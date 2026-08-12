# Phase 3 — REST Auth Target Spec

**Document type:** Specification (not code). Phase 4 implements against this.  
**Grounded in:** Phase 1 audit (`phase1-audit.md`) and Phase 2 fixes (`phase2-security-and-rbac-fixes.md`).  
**Scope:** REST auth surface only — signup, login, OTP/verification, refresh, logout, and RBAC guards for
the three roles the live UI exposes (PG Owner, Resident, Admin). GraphQL and SOAP parity are explicitly
out of scope for this pass; both need equivalent guards applied when they enter scope.  
**Authority:** This document supersedes any scattered, per-file role or token assumptions. Phase 4 is
graded against this spec, not against prior code state.

---

## 1. Role Mapping — Canonical, Single Source of Truth

### 1.1 UI Label → DB Enum → Access Path

| UI Tab / Label | DB `Role` enum value | How role is created | Notes |
|:---|:---|:---|:---|
| 🏢 **PG Owner** | `OWNER` | Self-serve signup (`POST /register` with `role: "OWNER"`) | Must complete email verification before any authenticated endpoint works |
| 🏠 **Resident** | `RESIDENT` | Self-serve signup (`POST /register` with `role: "RESIDENT"`) or provisioned by an Owner/Admin; can also log in via Resident Code | Must complete email verification; phone verification recommended |
| 🛡️ **Admin Sign In** | `ADMIN` or `SUPER_ADMIN` | **Never self-serve.** Created by seed scripts or via an authenticated `SUPER_ADMIN` provisioning endpoint only | Admin tab is a login-only surface, not a registration path |
| *(not in UI)* | `MANAGER` | Provisioned by `OWNER` or `ADMIN` via authenticated endpoint | Never self-serve |
| *(not in UI)* | `STAFF` | Provisioned by `OWNER` or `ADMIN` via authenticated endpoint | Never self-serve |

**Confirmed from Phase 1/2:**

- There is no `TENANT` value in the `Role` enum. "Resident" and `RESIDENT` are the same thing
  end-to-end. Any code or comment using "tenant" to mean a room occupant is incorrect and must be
  updated to `RESIDENT`.
- The `PUBLIC` role exists in the schema as a default guard value. No user should be able to
  authenticate with `PUBLIC` as their role. The `authenticate` middleware does not currently reject
  `PUBLIC`-role tokens. This is a **must-fix** for Phase 4.

### 1.2 Who Can Reach Each Role — Exact Creation Paths

| Role | Creation mechanism | Endpoint / trigger | Who initiates |
|:---|:---|:---|:---|
| `OWNER` | Self-serve signup | `POST /api/v1/auth/register` | The prospective owner |
| `RESIDENT` | Self-serve signup | `POST /api/v1/auth/register` | The prospective resident |
| `RESIDENT` | Owner/Admin provisioning | Future scoped endpoint (out of REST auth scope now) | A logged-in `OWNER` or `ADMIN` |
| `MANAGER` | Owner/Admin provisioning | Future scoped endpoint | A logged-in `OWNER` or `ADMIN` |
| `STAFF` | Owner/Admin provisioning | Future scoped endpoint | A logged-in `OWNER` or `ADMIN` |
| `ADMIN` | Privileged provisioning only | `SUPER_ADMIN`-protected endpoint or seed script | A `SUPER_ADMIN` or ops team |
| `SUPER_ADMIN` | Seed script / manual DB insert | No public or private API endpoint | Ops team only |

### 1.3 Role Is Never Accepted from Client Input After Creation

- **Signup:** `RegisterSchema` already restricts `role` to `["OWNER", "RESIDENT"]`.
  `AuthService.register` double-enforces via `forcedRole`. Both guards must remain — Phase 4 must
  not remove either.
- **Update/profile endpoints:** No authenticated endpoint may accept a `role` field in its body and
  apply it to the user record. Role changes are an ops-only operation (direct DB write or a future
  SUPER_ADMIN–guarded endpoint with a full audit entry).
- **Google OAuth:** `findOrCreateGoogleUser` in `auth.repository.ts` already clamps the role to
  `OWNER` or `RESIDENT` at creation. This clamping must remain.
- **`PUBLIC` role rejection:** Any token whose decoded `role` is `PUBLIC` must be rejected by the
  `authenticate` middleware with `403 FORBIDDEN`. Currently not implemented — **must-fix**.

---

## 2. Verification Requirements Per Role

### 2.1 Account Usability Gate

No authenticated endpoint should return `200` for a user whose email is unverified, **except** for
the verification endpoints themselves and `POST /auth/logout`. The current code does not enforce this
gate — **must-fix for Phase 4**.

| Role | Email verification (hard gate) | Phone verification | 2FA |
|:---|:---|:---|:---|
| `OWNER` | ✅ Required before any authenticated call | Recommended, not blocking | Optional (TOTP available) |
| `RESIDENT` | ✅ Required before any authenticated call | Recommended, not blocking | Optional |
| `ADMIN` / `SUPER_ADMIN` | ✅ Yes (provisioned accounts start verified) | ✅ Required | ✅ **Enforced at login (TOTP)** |
| `MANAGER` / `STAFF` | ✅ Yes (provisioned, start verified) | Recommended | Optional |

**Phase 4 implementation note:** Add an `emailVerified` check immediately after password verification
in `AuthService.login`. The current `accountStatus !== "ACTIVE"` check exists (line 318) but
`emailVerified === false` does **not** block login today. An unverified login must return `403` with
code `ACCOUNT_UNVERIFIED` and a message directing the user to check their email — not the `401`
used for bad credentials.

---

## 3. JWT Token Strategy

### 3.1 Access Token Claims

The access token payload (confirmed from `buildAccessPayload`, Phase 1 audit) **must** contain
exactly:

```jsonc
{
  "id": "<user_id>",           // MongoDB ObjectId string
  "email": "<email>",          // Lowercase, trimmed
  "role": "<Role enum>",       // OWNER | RESIDENT | ADMIN | SUPER_ADMIN | MANAGER | STAFF
  "sessionId": "<16-byte hex>",// Per-issuance random; enables per-session audit correlation
  "tokenVersion": 0            // Incremented server-side on password change / forced logout
}
```

Claims that **must not** appear in the access token: raw password, OTP secrets, bank details,
aadhaarNumber, panNumber, or any PII beyond email. `residentCode` is acceptable (non-secret
identifier already visible to the user).

### 3.2 Access Token Lifetime

- **Expiry:** 15 minutes (`JWT_EXPIRATION=15m`). Already configured. Phase 4 must not alter this
  without a documented justification.
- **Algorithm:** HS256 with `JWT_SECRET`. Acceptable for current deployment scale; RS256 is a future
  consideration.
- **Rotation:** Access tokens are re-issued on every successful refresh cycle, not independently.

### 3.3 `tokenVersion` Invalidation

`tokenVersion` already exists in the `User` schema and is emitted in the JWT payload. The `authenticate`
middleware currently does **not** validate it against the DB after signature verification. This is
a **must-fix**:

1. After verifying the JWT signature, middleware fetches `user.tokenVersion` from DB (or a
   Redis cache with a 15-minute TTL matching the token lifetime).
2. If `decoded.tokenVersion !== user.tokenVersion`, return `401 TOKEN_INVALIDATED`.
3. `tokenVersion` is incremented (server-side DB write) on: password change, admin-forced logout,
   or confirmed suspicious activity.

This mechanism invalidates all outstanding access tokens for a user without maintaining a blocklist.

### 3.4 Refresh Token Strategy

**Rotation:** Every successful `POST /auth/refresh-token` call revokes the presented token and issues
a new one. Already implemented (`AuthService.refreshToken`, lines 154–157). Must be preserved.

**Reuse detection:** Already implemented (lines 129–136). A previously-revoked refresh token presented
again triggers full token-family revocation. Must be preserved.

**"Remember Me" → refresh token lifetime:**

| Remember Me checkbox | Refresh token lifetime | Current state |
|:---|:---|:---|
| Unchecked (default) | **7 days** | Hardcoded in `persistRefreshToken` — correct |
| Checked | **30 days** | Not yet wired — **must-fix** |

Phase 4 change: the frontend must include `rememberMe: boolean` in the login request body. The
backend `AuthController.login` passes it to `AuthService.login`, which passes it to
`persistRefreshToken`. `persistRefreshToken` sets `expiresAt` to `now + 7d` (unchecked) or
`now + 30d` (checked).

### 3.5 Refresh Token Storage — Cross-Origin Reality

**The constraint:** Frontend is served from `https://ayushman-glb.github.io`; backend is at
`https://pg-management-system-boxb.onrender.com`. Different origins. The backend sets
`refreshToken` as `SameSite=Lax; httpOnly`, but browsers block cross-site cookie sending by default
in this configuration. The cookie alone cannot reliably carry the refresh token across origins.

**What the current code does:** `AuthController.refreshToken` sets an httpOnly cookie **and**
returns the raw `refreshToken` value in the JSON response body. The frontend `refreshPromise`
sends `credentials: "include"` and also reads `res.data.refreshToken`. The token is therefore
accessible to JavaScript — the httpOnly property of the cookie does not protect the value that
was already placed in the JSON body.

**Phase 4 target storage design:**

| Token | Storage location | Reason |
|:---|:---|:---|
| Access token | In-memory only (`AuthService.inMemoryToken`) | Already implemented; never written to localStorage. No change needed. |
| Refresh token (rememberMe=false) | `sessionStorage` | Cleared when the browser tab closes; limits exposure window |
| Refresh token (rememberMe=true) | `localStorage` | Persists across sessions; user has explicitly opted in |

**XSS exposure:** Both `sessionStorage` and `localStorage` are readable by JavaScript. An XSS
vulnerability executing in the GitHub Pages origin can steal the refresh token. This is an accepted,
documented trade-off given the cross-origin deployment constraint.

**Mitigations that must ship alongside Phase 4:**

1. A Content Security Policy header (`script-src 'self'`) on the frontend build to block injected
   scripts.
2. `tokenVersion` validation in `authenticate` (§3.3) means a stolen refresh token that generates
   a new access token is invalidated the next time `tokenVersion` is incremented.
3. Refresh tokens are SHA-256 hashed before DB storage — a DB breach does not expose raw tokens.
4. 15-minute access token expiry limits the damage window of a leaked access token.
5. `rememberMe=false` path uses `sessionStorage` (clears on tab close).

**API change:** `POST /auth/refresh-token` must accept the refresh token in the **request body**
(`{ "refreshToken": "<token>" }`) in addition to the cookie. Body takes priority; cookie is the
fallback for future same-origin deployments. The frontend must send the locally-stored token in
the body rather than relying on `credentials: "include"`.

**Disclosure obligation (must ship with Phase 4):** The Privacy Policy must state that RoomBae
stores session tokens in browser sessionStorage/localStorage for session continuity, and that
device fingerprint data (SHA-256 hashed) is collected for fraud prevention. No raw fingerprint
components are stored or sold. Users may contact support to review or remove device records.

**Future path:** A same-origin proxy forwarding refresh calls to Render would allow true httpOnly
cookies. This is a deployment infrastructure change and is deferred.

---

## 4. Login / Error Contract

### 4.1 Unified Error Response — All Role Tabs

The `loginRole` tab value selected in the UI (owner / resident / admin) is **not sent to the
backend**. The backend has no knowledge of which tab was active and does not need it — role is
read from the DB record, not from the request.

| Condition | HTTP status | Error code | User-facing message |
|:---|:---|:---|:---|
| User not found | `401` | `ACCOUNT_NOT_FOUND_OR_INVALID` | "We couldn't find an account with these details. Would you like to sign up instead?" |
| Wrong password | `401` | `ACCOUNT_NOT_FOUND_OR_INVALID` | Same message (anti-enumeration — identical to user-not-found) |
| OAuth account (no password hash) | `401` | `OAUTH_ACCOUNT_REQUIRES_SSO` | "This account uses Google Sign-In. Please sign in with Google." |
| Account unverified | `403` | `ACCOUNT_UNVERIFIED` | "Please verify your email address before signing in." *(Must-fix)* |
| Account deactivated | `403` | `ACCOUNT_INACTIVE` | "This account has been deactivated." |
| `PUBLIC` role token | `403` | `FORBIDDEN` | "Permission denied." *(Must-fix)* |
| Rate limit exceeded | `429` | `LOGIN_RATE_EXCEEDED` | "Too many login attempts. Please try again after 15 minutes." |
| Admin 2FA required | `200` partial | `TWO_FACTOR_REQUIRED` | Return `{ requiresTwoFactor: true, preAuthToken: "<short-lived>" }` instead of full token pair *(Must-fix)* |

### 4.2 Rate Limit Reference Table

Confirmed from `rateLimiter.ts`. Phase 6 tests must use exactly these numbers:

| Endpoint | Limiter | Max | Window | Error code |
|:---|:---|:---|:---|:---|
| `POST /auth/login` | `loginLimiter` | **5** | **15 min** | `LOGIN_RATE_EXCEEDED` |
| `POST /auth/register` | `registerLimiter` | **5** | **1 hour** | `REGISTRATION_RATE_EXCEEDED` |
| `POST /auth/send-otp` | `sendOtpLimiter` | **3** | **10 min** | `SEND_OTP_RATE_EXCEEDED` |
| `POST /auth/send-phone-otp` | `sendOtpLimiter` | **3** | **10 min** | `SEND_OTP_RATE_EXCEEDED` |
| `POST /auth/verify-otp` | `verifyOtpLimiter` | **10** | **15 min** | `VERIFY_OTP_RATE_EXCEEDED` |
| `POST /auth/verify-phone-otp` | `phoneVerifyLimiter` (= `verifyOtpLimiter`) | **10** | **15 min** | `VERIFY_OTP_RATE_EXCEEDED` |
| `POST /auth/send-email-verification` | **None — must-fix** | 3 (target) | 10 min (target) | `SEND_EMAIL_CODE_RATE_EXCEEDED` |
| `POST /auth/verify-email` | **None — must-fix** | 10 (target) | 15 min (target) | `VERIFY_EMAIL_RATE_EXCEEDED` |
| `POST /auth/refresh-token` | **None — must-fix** | 20 (target) | 15 min (target) | `TOO_MANY_REQUESTS` |
| `GET /auth/me` | `generalLimiter` | **100** | **15 min** | `TOO_MANY_REQUESTS` |

All limiters return `429` with `standardHeaders: true` (`Retry-After` exposed to clients).

---

## 5. Defense in Depth

### 5.1 OTP / 2FA Policy Per Role

| Role | Email OTP (signup gate) | Phone OTP (signup) | TOTP 2FA (login) |
|:---|:---|:---|:---|
| `OWNER` | **Required, hard gate** | Recommended | Optional (self-enrolled) |
| `RESIDENT` | **Required, hard gate** | Recommended | Optional (self-enrolled) |
| `ADMIN` | Verified at provisioning | **Required** | **Enforced at login — must-fix** |
| `SUPER_ADMIN` | Verified at provisioning | **Required** | **Enforced at login — must-fix** |
| `MANAGER` | Required | Recommended | Optional |
| `STAFF` | Required | Recommended | Optional |

**Admin 2FA enforcement — must-fix detail:** The current `AuthService.login` issues full access and
refresh tokens with no 2FA challenge, even when `user.is2FAEnabled === true`. Phase 4 must change
this:

1. After password verification passes, if `user.is2FAEnabled === true`:
   - Issue a **pre-auth token** (JWT, signed with `JWT_SECRET`, 5-minute expiry, contains
     `{ preAuth: true, userId, role }`).
   - Return `HTTP 200` with body `{ requiresTwoFactor: true, preAuthToken: "<token>" }`.
   - **Do not issue a refresh token or access token at this stage.**
2. Client calls `POST /auth/2fa/verify` with `{ preAuthToken, totpCode }`.
3. Backend validates the pre-auth token, verifies the TOTP code, then issues the full access +
   refresh token pair.

This flow makes 2FA for Admin accounts non-bypassable.

### 5.2 Device Fingerprinting — Risk Policy

**Current state (Phase 1 audit):** `identifyAndEvaluateDevice` is called after password verification
in `AuthController.login`. `BLOCKED` device → `403`. `NEW` device → proceeds, fires client event.
`REVOKED` device → proceeds silently with no challenge.

**Target behaviour for Phase 4:**

| Device risk level | Current | Target |
|:---|:---|:---|
| `BLOCKED` (score = 100, CRITICAL) | Hard 403 deny | **Keep** — correct |
| `REVOKED` (score += 60, HIGH) | Proceeds, no step-up | **Step-up:** prompt for email OTP before issuing tokens |
| `NEW` (score += 25, MEDIUM) | Proceeds, client event | Proceed + write `SUSPICIOUS_LOGIN` audit event; no hard gate |
| `TRUSTED` (score = 0, LOW) | Proceeds normally | **Keep** — correct |

**Rationale for REVOKED step-up (not hard deny):** A revoked device could be legitimate (user
accidentally revoked all devices during a security review). A hard block with no message creates
unresolvable lockout. Email OTP is a proportionate challenge that verifies identity without
permanently blocking access.

**Fingerprinting is always secondary.** A login that passes password + email verification must
never be permanently blocked by fingerprint alone without a human-reviewable appeal path.

**Optional, never blocking:** If FingerprintJS fails (ad-blocker, network error), the existing
`try/catch` in `AuthController.login` already swallows the error and proceeds. Phase 4 must
preserve this — fingerprint unavailability must never block a legitimate login.

**Disclosure (must ship with Phase 4):** Privacy Policy must state that RoomBae uses browser
fingerprinting (FingerprintJS) to detect suspicious devices. The SHA-256 hashed visitor ID is
stored server-side. No raw fingerprint components are stored or sold. Users may request device
record review or deletion via support.

### 5.3 Auth Event Audit Log

**What already exists:** `LoginHistory` written on successful login (Phase 1, `auth.service.ts`
lines 323–335). `SecurityAuditEvent` written by `DeviceService` for device events.

**What is missing and must be added in Phase 4:**

| Event | Status | Required fields |
|:---|:---|:---|
| Login success | ✅ Exists (`LoginHistory`) | userId, IP, userAgent, role, timestamp |
| Login failure — user not found | ❌ Missing | IP, timestamp, hashed attempted identifier |
| Login failure — wrong password | ❌ Missing | userId (if account exists), IP, timestamp |
| Login failure — account unverified | ❌ Missing | userId, IP, timestamp |
| Email verified | ❌ Missing as explicit log | userId, timestamp |
| Phone OTP verified | ❌ Missing as explicit log | userId, timestamp |
| 2FA enrolled | ❌ Missing | userId, timestamp |
| 2FA verified at login | ❌ Missing | userId, sessionId, timestamp |
| Refresh token rotation | ❌ Missing | userId, sessionId, IP, timestamp |
| Refresh token reuse detected | ⚠️ `logger.warn` only | Must also write to `SecurityAuditEvent` |
| Logout | ❌ Missing | userId, sessionId, IP, timestamp |
| `tokenVersion` incremented | ❌ Missing | userId, reason, timestamp |

**Retention:** Minimum 90 days. Auto-purge after 365 days.

**Log hygiene:** Email addresses in failure log entries must be SHA-256 hashed — not stored as
plaintext — to prevent the log itself from becoming an enumeration surface.

---

## 6. Must-Fix Items for Phase 4

Ordered by severity:

| # | Item | Severity | Spec Reference |
|:---|:---|:---|:---|
| 1 | Admin TOTP enforced at login (pre-auth token flow) | 🔴 Critical | §2.1, §5.1 |
| 2 | `tokenVersion` validated in `authenticate` middleware | 🔴 Critical | §3.3 |
| 3 | `emailVerified` gate on login (`403 ACCOUNT_UNVERIFIED`) | 🔴 Critical | §2.1, §4.1 |
| 4 | `PUBLIC` role token rejected in `authenticate` | 🔴 Critical | §1.3 |
| 5 | Rate limiters on `send-email-verification` and `verify-email` | 🟠 High | §4.2 |
| 6 | Rate limiter on `refresh-token` | 🟠 High | §4.2 |
| 7 | Refresh token sent in request body (cross-origin fix) + localStorage storage | 🟠 High | §3.5 |
| 8 | `rememberMe` wired to refresh token lifetime (7d / 30d) | 🟡 Medium | §3.4 |
| 9 | Audit log entries for login failures, logout, and reuse detection | 🟡 Medium | §5.3 |
| 10 | Device step-up (email OTP) for `REVOKED` device risk | 🟡 Medium | §5.2 |
| 11 | Privacy disclosure for fingerprinting and localStorage token storage | 🟡 Medium | §3.5, §5.2 |
| 12 | "Tenant" references in code/comments updated to "Resident" | 🟢 Low | §1.1 |
| 13 | `AuthUserPayload` in `express.d.ts` kept in sync with `authMiddleware.ts` | 🟢 Low | Phase 2 §D |

---

## 7. Out of Scope — This Pass

- GraphQL resolver auth guards — noted, deferred.
- SOAP/WSDL endpoint auth — noted, deferred.
- Razorpay webhook signature verification — separate surface.
- Manager/Staff provisioning endpoints — not yet built; out of REST auth scope.
- `SUPER_ADMIN` account management UI — ops-only, out of scope.

---

*Spec authored from live audit of commit `76d10426eb45e47417d21632e093b6a4caf61819`.
Any code change between that commit and Phase 4 execution must be reviewed against this
document before implementation begins.*
