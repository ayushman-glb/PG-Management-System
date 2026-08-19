# Rebuild Prompt — JWT Auth Service ("yt-auth") — For Antigravity / Gemini Coding Agent

You are rebuilding an authentication microservice inside my existing project. Follow this
spec exactly. Do not invent features, endpoints, fields, or environment variables that are
not listed below. Where something below is explicitly marked "not in scope," do not build it.

---

## 0. Non-negotiable constraints

1. **Do not create, edit, delete, or overwrite the `.env` file.** It already exists in this
   project with the correct, already-rotated values. Only ever read from it via
   `process.env`. If a variable listed in Section 3 is missing at runtime, fail fast with a
   clear thrown error (see Section 6, `config.js` pattern) — do not silently default it or
   write a new `.env`.
2. **Remove the old/legacy auth implementation in this project first** (routes, controllers,
   models, middleware, services related to auth/users/sessions/OTP), then rebuild from
   scratch using this spec. Don't try to patch the old files in place.
3. **Do not touch unrelated parts of the project** (anything not related to auth/users/
   sessions/email-verification).
4. This spec describes a **backend-only** service. There is no frontend in scope for this
   task. Design the API to be frontend-agnostic (see Section 8's token-delivery pattern) so
   any client can integrate later, but do not scaffold any frontend code.
5. Do not add functionality for any environment variable listed in Section 3 as
   "declared but out of scope" (CSRF, password reset, API keys, AES/KYC encryption) unless I
   separately ask for that feature. Their presence in `.env` is provisioning for future work,
   not a request to implement it now.

---

## 1. What this service is

A Node.js/Express REST API providing username+email/password registration with email OTP
verification, login, short-lived access tokens + long-lived rotating refresh tokens (stored
server-side as hashed session records), single-session logout, all-session logout, and a
"get current user" endpoint. Email delivery uses Gmail via OAuth2 through Nodemailer.

## 2. Tech stack (use these exact packages/major versions; ESM throughout — `"type": "module"` in package.json)

- express ^5
- mongoose ^9
- jsonwebtoken ^9
- cookie-parser ^1.4
- morgan ^1.10 (dev request logging)
- dotenv ^17
- nodemailer ^8
- Node's built-in `crypto` module (no bcrypt is currently used — see Section 9 for whether to change this)

## 3. Environment variables — read-only contract

**Used by the current implementation (must be wired in exactly as described in Section 6–9):**

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Mongoose connection string |
| `JWT_SECRET` | Signs/verifies JWTs |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_USER` | Gmail OAuth2 creds for Nodemailer |
| `JWT_REFRESH_SECRET` | **Declared but currently unused by the old code** — see Section 9, item 3: use this to sign/verify refresh tokens separately from access tokens. |
| `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | **Declared but currently unused by the old code** (values are hardcoded as `"15m"`/`"7d"`) — see Section 9, item 4: read these from env instead of hardcoding. |

**Declared in `.env` but out of scope — do not wire these into any feature unless I ask separately:**
`SESSION_SECRET`, `COOKIE_SECRET`, `CSRF_SECRET`, `PASSWORD_RESET_SECRET`,
`EMAIL_VERIFICATION_SECRET`, `API_KEY_SECRET`, `AES_256_KEY`, `ENCRYPTION_KEY`,
`KYC_ENCRYPTION_KEY`. Nothing in the current feature set (register/login/verify/refresh/
logout) needs CSRF protection, password-reset flow, API-key auth, or field-level encryption.
Leave them unread in code.

## 4. Config module contract (`src/config/config.js`)

On startup, load dotenv, then validate presence of: `MONGO_URI`, `JWT_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_USER` — throw a
descriptive `Error` for each missing one, exactly as the original does. Additionally validate
`JWT_REFRESH_SECRET` is present (needed once you split access/refresh signing per Section 9).
Export a single frozen config object; every other module reads secrets through this object,
never through `process.env` directly.

## 5. Database connection (`src/config/database.js`)

A single async `connectDB()` function that calls `mongoose.connect(config.MONGO_URI)` and
logs `"Connected to DB"` on success. Called once from the entrypoint before `app.listen`.

## 6. Data models

### `users` (`src/models/user.model.js`)

| Field | Type | Rules |
| --- | --- | --- |
| `username` | String | required, unique |
| `email` | String | required, unique |
| `password` | String | required (hashed — see Section 9 item 1 for hashing algorithm decision) |
| `verified` | Boolean | default `false` |

### `sessions` (`src/models/session.model.js`)

Represents one active refresh-token session (one device/login).

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId ref `users` | required |
| `refreshTokenHash` | String | required — `sha256` hex digest of the raw refresh token, never store the raw token |
| `ip` | String | required — from `req.ip` at login time |
| `userAgent` | String | required — from `req.headers["user-agent"]` at login time |
| `revoked` | Boolean | default `false` |
| timestamps | — | `createdAt`/`updatedAt` enabled |

### `otps` (`src/models/otp.model.js`)

| Field | Type | Rules |
| --- | --- | --- |
| `email` | String | required |
| `user` | ObjectId ref `users` | required |
| `otpHash` | String | required — `sha256` hex digest of the 6-digit OTP, never store the raw OTP |
| timestamps | — | `createdAt`/`updatedAt` enabled |

## 7. Email service (`src/services/email.service.js`)

A Nodemailer transporter created once at module load using `service: 'gmail'` and
`auth: { type: 'OAuth2', user: GOOGLE_USER, clientId: GOOGLE_CLIENT_ID, clientSecret:
GOOGLE_CLIENT_SECRET, refreshToken: GOOGLE_REFRESH_TOKEN }`. Call `transporter.verify()` at
startup and log success/failure without crashing the process on failure. Export a single
`sendEmail(to, subject, text, html)` async helper used by the OTP flow. The OTP email HTML is
a simple centered card showing the 6-digit code (see `src/utils/utils.js` `getOtpHtml`).

## 8. API contract

Base path: `/api/auth`. All bodies are JSON (`express.json()` is mounted globally).
`cookie-parser` is mounted globally so `req.cookies` is available.

**Token delivery pattern (frontend-agnostic — preserve exactly):**

- Access token → returned in the JSON response body only, never as a cookie. Client is
  expected to hold it in memory and send it as `Authorization: Bearer <token>`.
- Refresh token → set as an `httpOnly`, `secure`, `sameSite: "strict"` cookie named
  `refreshToken`, `maxAge` 7 days. Never returned in a JSON body.

| Method & Path | Auth required | Request body | Success response | Notes |
| --- | --- | --- | --- | --- |
| `POST /register` | none | `{ username, email, password }` | `201` `{ message, user: { username, email, verified } }` | Rejects if username or email already taken (`409`). Hashes password, creates user, generates a 6-digit OTP, stores its hash, emails the OTP as both plain text and HTML. |
| `POST /login` | none | `{ email, password }` | `200` `{ message, user: { username, email }, accessToken }` + sets `refreshToken` cookie | `401` if user not found, not verified, or password mismatch. On success: creates a new `sessions` doc, signs access token (15m) and refresh token (7d). |
| `GET /get-me` | Bearer access token | — | `200` `{ message, user: { username, email } }` | `401` if no/invalid token. |
| `GET /refresh-token` | `refreshToken` cookie | — | `200` `{ message, accessToken }` + rotates `refreshToken` cookie | `401` if cookie missing or no matching non-revoked session. Issues a new access token and a new refresh token, updates the session's stored hash (rotation), re-sets the cookie. |
| `GET /logout` | `refreshToken` cookie | — | `200` `{ message }` | Marks the matching session `revoked: true`, clears the cookie. `400` if cookie missing or no matching session. |
| `GET /logout-all` | `refreshToken` cookie | — | `200` `{ message }` | Decodes the refresh token to get the user id, sets `revoked: true` on every non-revoked session for that user, clears the cookie. |
| `GET /verify-email` | none | `{ otp, email }` — **note this is a body on a GET route, see Section 9 item 2 for the fix** | `200` `{ message, user: { username, email, verified } }` | Looks up the OTP hash, marks the user verified, deletes all OTP docs for that user. `400` if no matching OTP doc. |

## 9. Known defects in the original implementation — fix these during the rebuild, don't just port them as-is

Preserve the *behavior/feature set* described above exactly, but implement it correctly:

1. **Password hashing is unsalted `sha256`.** Rebuild using proper salted hashing
   (`bcrypt`/`bcryptjs`, cost factor 10-12) instead of `crypto.createHash("sha256")`. This
   changes the hashing call sites in register/login only — no schema field changes.
2. **`verify-email` is a `GET` route that reads `req.body`.** GET requests are not guaranteed
   to carry a body across all HTTP clients. Change the route to `POST /verify-email`
   accepting the same `{ otp, email }` JSON body.
3. **Access and refresh tokens are both signed with the same `JWT_SECRET`.** Sign access
   tokens with `config.JWT_SECRET` and refresh tokens with `config.JWT_REFRESH_SECRET`
   (already present in `.env`, just unused). Verify each token type against its matching
   secret in every place a token is decoded (`get-me`, `refresh-token`, `logout-all`).
4. **Token expirations are hardcoded (`"15m"`, `"7d"`) instead of read from env.** Use
   `config.JWT_ACCESS_EXPIRATION` and `config.JWT_REFRESH_EXPIRATION` (already present in
   `.env`) as the `expiresIn` values everywhere tokens are signed. Keep cookie `maxAge` for
   the refresh cookie consistent with `JWT_REFRESH_EXPIRATION`.
5. **`register` doesn't `return` after sending the 409 conflict response**, so execution
   falls through and a second response is attempted on an existing user. Add the missing
   `return`.
6. **No centralized auth middleware** — `get-me` manually parses `Authorization` and calls
   `jwt.verify` inline. Extract this into `src/middlewares/auth.middleware.js` exporting a
   `requireAuth(req, res, next)` that populates `req.user` (or `req.userId`) and calls
   `next()`, or responds `401`. Use it on `/get-me` (and any other route that needs it).
7. **No global error handler.** Wrap async controller functions in a small `asyncHandler`
   utility (or `try/catch` per controller) and add an Express error-handling middleware
   mounted last in `app.js` that returns a consistent `{ message }` JSON shape and logs the
   error server-side, instead of letting unhandled promise rejections crash requests.
8. **OTP documents never expire** (no TTL index), so unverified-signup OTPs accumulate
   forever. Add a Mongoose TTL index on `otps.createdAt` (e.g., `expireAfterSeconds`) so
   stale OTPs are automatically purged. Reasonable default: 15 minutes — flag this value to
   me for confirmation rather than silently picking one if you're unsure.
9. **No basic security middleware.** Add `cors` (configured for your actual frontend origin
   once one exists — leave permissive/dev-safe for now and flag it) and `helmet` for
   standard security headers. Only add these two — don't add CSRF/rate-limiting/etc. per
   Section 3's out-of-scope list unless I ask.

Do not fix anything not listed above — if you notice something else that looks off, tell me
about it instead of changing it unprompted.

## 10. Database migration required because the JWT secrets were rotated

**Important — this is not a "copy the new values into the DB" operation, because that's not
how JWT verification works.** Nothing in the database stores a copy of `JWT_SECRET` itself.
What's stored in the `sessions` collection is `sha256(refreshTokenString)` — a hash of a
token that was *signed* with the *old* secret. Once `.env` now has new secrets, every
previously-issued access/refresh token will fail `jwt.verify()` (signature mismatch),
regardless of what's sitting in the `sessions` collection. There is no valid transformation
that makes an old token verify under a new secret.

**The correct fix:** treat the secret rotation as "every existing login session is now dead."
As part of this rebuild:

1. Write a one-time migration (a small script under e.g. `scripts/purgeStaleSessions.js`, run
   manually once, not on every server boot) that either deletes every document in the
   `sessions` collection or sets `revoked: true` on all of them.
2. Do **not** attempt to re-sign, re-hash, or "update" any existing session document to make
   old refresh tokens valid again — that's cryptographically impossible.
3. After migration, users simply log in again through `POST /login`, which will naturally
   create fresh `sessions` documents whose tokens are signed with the current (rotated)
   `JWT_SECRET` / `JWT_REFRESH_SECRET`. No other collection (`users`, `otps`) is affected by
   the secret rotation — leave them untouched.

## 11. App wiring (`src/app.js`, `server.js`)

- `server.js`: import the Express app and `connectDB`, call `connectDB()`, then
  `app.listen(3000, ...)` with a startup log line.
- `src/app.js`: create the Express app, mount `express.json()`, `morgan("dev")`,
  `cookie-parser()`, `helmet()`, `cors()` (see item 9 above), then mount the auth router at
  `/api/auth`, then mount the global error handler last. Export the app.

## 12. Deliverable checklist for you (the coding agent)

- [ ] Remove old auth-related files from the target project.
- [ ] Recreate the file structure: `src/config`, `src/models`, `src/controllers`,
      `src/routes`, `src/services`, `src/utils`, `src/middlewares`, `server.js`.
- [ ] Implement all endpoints in Section 8 with the fixes in Section 9 applied.
- [ ] Confirm no code anywhere writes to or modifies `.env`.
- [ ] Confirm no code reads any of the out-of-scope env vars from Section 3.
- [ ] Write and run the one-time session-purge migration from Section 10 against the
      project's actual database before considering login "working" again.
- [ ] Report back anything in this spec that conflicts with existing code you find in the
      target project, instead of silently resolving the conflict yourself.
