# Phase 6 — Test Audit Report

**Document type:** Gap audit, not new test code.  
**Grounded in:** `phase3-auth-spec.md`, `phase6a-tests.md`, and live source read of all test files.  
**Audit date:** 2026-08-13  

---

## Summary Verdict

| Gap # | Item | Verdict |
|:---|:---|:---:|
| 1 | Rate limiting triggers at spec threshold | ⚠️ Partial |
| 2 | Tampered / expired / malformed JWT rejected | ✅ Pass |
| 3 | Cross-role access blocked in both directions | ❌ Gap |
| 4 | Refresh-token reuse revokes whole session family | ⚠️ Partial |
| 5 | Mongo-operator injection in login fields | ❌ Gap |
| 6 | Dependency vulnerability scan — no unaddressed high/critical | ❌ Gap (backend) |

**Status: NOT APPROVED.** Three hard gaps (3, 5, 6) and two partials (1, 4) must close before Phase 7 starts.

---

## Gap 1 — Rate limiting triggers at spec threshold

### What exists
`rateLimiter.test.ts` creates throwaway in-test limiter instances using `createTestLimiter`, a local factory that does not import `rateLimiter.ts` at all. It passes `max: 5` for login, `max: 3` for OTP, and `max: 20` for refresh by hand.

### The problem
The tests prove `express-rate-limit` works generically. They do **not** prove that the exported `loginLimiter`, `sendOtpLimiter`, and `refreshTokenLimiter` in `rateLimiter.ts` are configured to those numbers. The actual file could ship `max: 50` and these tests would still green.

Separately, `rateLimiter.ts` sets `skip: () => process.env.NODE_ENV === 'test'`, which means the real limiters are never exercised in any test environment. The unit tests work around this by building fresh instances — but that decoupling is the gap.

Missing coverage per spec §4.2:
- `registerLimiter` (5 / 1h) — not tested
- `verifyOtpLimiter` (10 / 15m) — not tested  
- Window reset behaviour — not tested

### Required fix
Import the actual exported limiters (`loginLimiter`, etc.) and mount them on a test app. Assert exact threshold numbers match the spec §4.2 table.

---

## Gap 2 — Tampered, expired, or malformed JWT rejected

### Coverage found

| Scenario | Test | Result |
|:---|:---|:---:|
| Tampered signature (last 5 chars replaced) | `jwtTokenService.test.ts` L32–38 | ✅ |
| Wrong secret (refresh token vs access verifier) | `jwtTokenService.test.ts` L50–52 | ✅ |
| Standard token rejected as pre-auth token | `jwtTokenService.test.ts` L66–71 | ✅ |
| No token → 401 TOKEN_REQUIRED | `authIntegration.test.ts` L483–486 | ✅ |
| Middleware maps `TokenExpiredError` → TOKEN_EXPIRED | `authMiddleware.ts` source L121–122 | ✅ (code path confirmed) |
| Middleware maps `JsonWebTokenError` → INVALID_TOKEN | `authMiddleware.ts` source L124–125 | ✅ (code path confirmed) |

No dedicated integration test for an expired token, but library-level expiry is correctly mapped in the middleware.

**Verdict: Pass.**

---

## Gap 3 — Cross-role access blocked in both directions

### What exists
**Nothing.** No test in any file presents a valid token for Role A and calls a route guarded for Role B, asserting 403.

`phase6a-tests.md` counts `GET /auth/me` as "protected route authorization" — but `/auth/me` uses only `authenticate`, with no `authorize()` role guard. It proves the token is valid, not that roles are enforced.

The `authorize` / `requireRole` middleware in `authMiddleware.ts` (lines 131–137) is correct code, completely untested.

### Required fix
Add at minimum two integration tests:
1. `RESIDENT` token → `OWNER`-only route → assert `403 FORBIDDEN`
2. `OWNER` token → `ADMIN`-only route → assert `403 FORBIDDEN`

If no role-guarded routes are yet registered in the app, register a test-only route with `authorize(Role.ADMIN)` in the test setup.

---

## Gap 4 — Refresh-token reuse revokes the whole session family

### What the source does
`auth.service.ts` lines 127–134: when `storedToken.revokedAt` is set, `updateMany({ where: { userId, revokedAt: null } })` revokes all outstanding tokens for that user. This is the correct spec behaviour.

### What the tests cover
- Happy-path rotation: ✅ (`authIntegration.test.ts` L428–436)
- Bad/malformed token → 401: ✅ (`authIntegration.test.ts` L438–445)

### What is missing
No test:
1. Re-submits a previously-rotated (revoked) refresh token
2. Asserts `401 REFRESH_TOKEN_REVOKED`
3. Asserts family revocation occurred (all other tokens for that user now revoked)

Point 3 is the spec requirement. Without it the test only proves single-token rejection, not family revocation.

### Required fix
After `tokenA → tokenB` rotation, POST `tokenA` again. Assert 401. Assert all tokens in `store.refreshTokens` for that userId are revoked (`revokedAt !== null`).

---

## Gap 5 — Mongo-operator injection in login fields

### What exists
None. No test sends `{ "identifier": { "$gt": "" }, "password": "anything" }` to `POST /auth/login`.

### Why this matters
Prisma's typed layer prevents ORM-level injection. The real gate is Zod. `LoginSchema` presumably rejects an object for `identifier` (Zod `z.string()` fails on objects), but this is unverified in the test suite.

### Required fix

Add to `auth.dto.test.ts`:
```typescript
test('rejects operator-object as identifier (NoSQL injection guard)', () => {
  const result = LoginSchema.safeParse({
    body: { identifier: { $gt: '' }, password: 'Password123!' },
  });
  expect(result.success).toBe(false);
});
```

Add an integration test sending the crafted body to `POST /api/v1/auth/login` and asserting `400` (validation failure), not `401` or `200`.

---

## Gap 6 — Dependency vulnerability scan

### Backend (`npm --prefix backend audit`)

**Result: 3 high, 0 critical — fixes available**

| Package | CVSS | Advisory | Runtime path? |
|:---|:---|:---|:---|
| `brace-expansion` | 7.5 | GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895 | Partially — `swagger-jsdoc` is a runtime dep |
| `fast-uri` | 7.5 | GHSA-7p8r-x3mc-p8w7 | Yes — `ajv` validation chain |
| `js-yaml` | 7.5 | GHSA-5p4m-2wfm-xmqj | Partially — `@istanbuljs` is dev; root `js-yaml` may be runtime |

### Frontend (`npm --prefix frontend audit`)
**Result: 0 vulnerabilities — clean.**

### Required fix
Run `npm --prefix backend audit fix`. For breaking-change bumps, review manually. Document which findings remain after fix and confirm remaining ones are dev-dependency-only. Gate: zero unaddressed high/critical in production dependency paths.

---

## What is Confirmed Green

| Item | Test location |
|:---|:---|
| Anti-enumeration 401 shape + byte equivalence | `screenshotLogin401.test.ts`, `authIntegration.test.ts` L379–402 |
| No client role override in login | `auth.dto.test.ts` L67–87, regression test L33 |
| ADMIN/SUPER_ADMIN self-signup blocked by DTO | `auth.dto.test.ts` L67–87 |
| Tampered JWT rejected | `jwtTokenService.test.ts` L32–38 |
| Wrong-secret cross-verification rejected | `jwtTokenService.test.ts` L50–52 |
| 2FA pre-auth token rejects standard access token | `jwtTokenService.test.ts` L66–71 |
| Bcrypt cost-12 + AES-256-GCM auth tag | `crypto.test.ts` |
| Token rotation happy path | `authIntegration.test.ts` L428–436 |
| Logout + session invalidation | `authIntegration.test.ts` L488–496 |
| Duplicate email → 409 | `authIntegration.test.ts` L282–305 |
| PUBLIC role rejected in middleware (source) | `authMiddleware.ts` L42–44 |

---

## Actions Before Phase 7

| Priority | Action |
|:---|:---|
| 🔴 Blocker | Add cross-role RBAC integration tests (Gap 3) |
| 🔴 Blocker | Add NoSQL injection guard DTO + integration tests (Gap 5) |
| 🔴 Blocker | `npm --prefix backend audit fix`, document residuals (Gap 6) |
| 🟠 Required | Rewrite `rateLimiter.test.ts` to use real exported limiters (Gap 1) |
| 🟠 Required | Add token-reuse → family-revocation assertion (Gap 4) |
