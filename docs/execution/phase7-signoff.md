# Phase 7 — Go / No-Go Signoff

**Scope:** Cross-phase verification against `phase3-auth-spec.md` as single source of truth.  
**Evidence read:** phase1-audit.md, phase2-security-and-rbac-fixes.md, phase3-auth-spec.md, phase4-implementation-review.md, phase4a-implementation.md, phase5-frontend.md, phase6a-tests.md, phase6-test-report.md, plus live source of: `auth.service.ts`, `auth.controller.ts`, `authMiddleware.ts`, `authRoutes.ts`, `rateLimiter.ts`, `useAdaptiveLoading.ts`, git log, `git ls-files`.  
**Date:** 2026-08-13  

---

## Verdict: NO-GO

**Blocking count:** 4 open items — 2 Critical, 2 High. None are test-only gaps; all involve production code that will deploy.

---

## Open Items (Ordered by Severity)

---

### 1. Admin 2FA bypass — Critical (Spec §5.1)

**Source:** `auth.service.ts` lines 339–352.

**What the code does:**
```typescript
if (user.is2FAEnabled === true || user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
  if (user.is2FAEnabled && this.tokenService.generatePreAuthToken) {
    // issue pre-auth token
    return { requiresTwoFactor: true, preAuthToken };
  }
  // ADMIN with is2FAEnabled === false falls through silently
}
// full access + refresh token issued here — no guard
```

An ADMIN or SUPER_ADMIN account where `is2FAEnabled === false` — which covers any newly provisioned admin or one who disabled 2FA — passes the outer check, fails the inner `&&`, exits the block, and receives a complete token pair without any 2FA challenge. The outer OR condition was written to be unconditional for role; the inner `&&` inverts that.

**Spec requirement:** "After password verification passes, if role is ADMIN or SUPER_ADMIN: issue a pre-auth token. Do not issue tokens at this stage." Unconditional for that role — `is2FAEnabled` state is irrelevant to the gate.

**Fix:** Remove the inner `if (user.is2FAEnabled &&)` wrapper for ADMIN/SUPER_ADMIN. If `twoFactorSecret` is null (2FA not yet configured), return `403 ADMIN_2FA_NOT_CONFIGURED` rather than tokens.

**Phase to revisit:** Phase 4. One-line code change in `auth.service.ts`.

---

### 2. `tokenVersion` guard accepts tokens with no `tokenVersion` claim — High (Spec §3.3)

**Source:** `authMiddleware.ts` line 77.

```typescript
if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== dbUser.tokenVersion) {
  return next(new AppError('...', 401, 'TOKEN_INVALIDATED'));
}
```

Any token issued before the Phase 4 deploy — or any crafted token where the `tokenVersion` claim is simply omitted — passes this check unconditionally. `undefined !== undefined` is `false`; the guard never fires. Those pre-deploy tokens are permanently valid regardless of `tokenVersion` increments in the DB.

**Fix:** `if ((decoded.tokenVersion ?? -1) !== dbUser.tokenVersion)` — treat missing claim as version -1 (always stale). This will force re-login for pre-deploy sessions, which is the correct migration behaviour.

**Phase to revisit:** Phase 4. One-line code change in `authMiddleware.ts`.

---

### 3. Three test coverage gaps unaddressed — High (Phase 6 audit)

Per `phase6-test-report.md`, the following remain open with no tests written:

| Gap | What is missing |
|:---|:---|
| Cross-role RBAC | No test presents a RESIDENT/OWNER token to a role-guarded route and asserts 403. `authorize()` middleware is live but completely untested. |
| NoSQL injection guard | No test sends `{ "identifier": { "$gt": "" } }` to `/auth/login`. Zod is the actual gate; it is unverified. |
| Rate limiter config decoupling | `rateLimiter.test.ts` tests throwaway instances, not the exported `loginLimiter` / `sendOtpLimiter` etc. Config drift would not be caught. |

Token-family-revocation assertion and the npm audit fix are also open but do not block test signoff by themselves.

**Phase to revisit:** Phase 6. Tests only — no production code changes required.

---

### 4. Hardcoded fallback secret in production middleware — High (Security)

**Source:** `authMiddleware.ts` line 39.

```typescript
const secret = process.env.JWT_SECRET || 'dev_secret_change_me_in_production';
```

If `JWT_SECRET` is missing from the Render environment (misconfiguration, secret rotation, redeploy without env vars), the middleware silently falls back to a known, public string. Any token signed with that string is accepted in production. The same fallback appears in `residentManagement.test.ts` (test-only, lower risk).

**Fix:** `const secret = process.env.JWT_SECRET; if (!secret) throw new Error('JWT_SECRET is not configured');` — fail hard on missing secret, never silently accept a known fallback.

**Note:** No actual `.env` files with real secrets are committed — `git ls-files` returns only `.env.example` files. `USER_CREDENTIALS.md` contains seed/dev passwords only and is clearly marked local-only. The `.gitignore` correctly excludes all `.env` variants. This finding is about the fallback in middleware, not a committed secret.

**Phase to revisit:** Phase 4. One-line change in `authMiddleware.ts`.

---

## Items Confirmed — No Action Required

| Item | Evidence |
|:---|:---|
| Original bug fixed: valid PG Owner login no longer returns 401 | `screenshotLogin401.test.ts` passes; anti-enumeration is now applied only on missing account or wrong password, not valid accounts |
| Regression test guarding the original bug | `backend/src/__tests__/regression/screenshotLogin401.test.ts` — 2 tests, both passing |
| Account-not-found vs wrong-password externally indistinguishable | `auth.service.ts` L294–323: both throw identical HTTP 401 / `ACCOUNT_NOT_FOUND_OR_INVALID` / identical message string. Integration test asserts `JSON.stringify(res1.body) === JSON.stringify(res2.body)` |
| No real secrets committed to repo | `git ls-files` returns only `.env.example` files; `.gitignore` blocks all `.env` variants; `.env.example` files contain placeholder values only (`your_jwt_access_secret_here`) |
| Rate limiters live in the deployed request path | `authRoutes.ts` imports and applies `loginLimiter`, `registerLimiter`, `sendOtpLimiter`, `verifyOtpLimiter`, `sendEmailCodeLimiter`, `verifyEmailCodeLimiter`, `refreshTokenLimiter` — all wired to the correct routes. Not behind a flag. |
| Refresh rotation live in request path | `auth.service.ts` L151–155: old token revoked with `update({revokedAt: new Date()})` before new token persisted and returned — synchronous, not commented out |
| Reuse detection live in request path | `auth.service.ts` L127–134: `revokedAt` check + `updateMany` family wipe on presented token — in the actual `refreshToken()` call path |
| Role assignment: client cannot assign elevated roles | DTO `RegisterSchema` rejects ADMIN/SUPER_ADMIN; `auth.service.ts` `forcedRole` double-enforces; `req.user` populated from DB, not token claims |
| Skeleton loading degrades on browsers without Network Information API | `useAdaptiveLoading.ts` L50–68: `navigator.connection` is accessed with optional chaining and a null guard. If `conn` is null/undefined (Safari, Firefox, iOS), the branch is skipped and a 250ms timeout-based fallback activates. No API-unavailable error path; `isSlowNetwork` evaluates to `false` and the timeout handles graceful degradation. |
| `USER_CREDENTIALS.md` is seed/dev data only | File contains plaintext dev passwords but is explicitly marked "LOCAL / DEVELOPMENT ENVIRONMENT SEED DATA ONLY" with a DB guard in `seed.ts`. Not a production secret. Acceptable for a local dev repo. |

---

## What Phase Needs to Revisit What

| # | Issue | Phase | Scope |
|:---|:---|:---|:---|
| 1 | Admin 2FA bypass | **Phase 4** | `auth.service.ts` L340 — remove inner `is2FAEnabled &&` wrapper for ADMIN/SUPER_ADMIN |
| 2 | `tokenVersion` undefined bypass | **Phase 4** | `authMiddleware.ts` L77 — use `?? -1` instead of `!== undefined` guard |
| 3 | Fallback secret in middleware | **Phase 4** | `authMiddleware.ts` L39 — throw on missing `JWT_SECRET` instead of fallback string |
| 4 | RBAC, injection, rate-limiter config tests | **Phase 6** | Add 3 test cases; no production code changes |

All four are narrow, targeted changes. Items 1–3 are single-line fixes in Phase 4 files. Item 4 is test-only.
