# Phase 4 Implementation Review
**Status: NOT APPROVED — Return to implementer for a Gemini pass**

**Reviewer:** Gemini (Claude Sonnet 4.6 Thinking)  
**Date:** 2026-08-13  
**Artifacts reviewed:**
- `docs/execution/phase3-auth-spec.md` (the contract)
- `docs/execution/phase4a-implementation.md` (the self-report)
- Actual diff: commit `76d1042` → `5fbd358`
- Live source: `auth.routes.ts`, `auth.service.ts`, `authMiddleware.ts`, `rateLimiter.ts`, `auth.controller.ts`, `JwtTokenService.ts`

---

## Summary verdict

Several must-fix items from the spec are described as implemented but are not wired into
the request path. Three of the four findings below are High or Critical — enough on
their own to block Phase 5.

---

## Finding 1 — Rate limiters exist but are not applied to routes (High, Spec §4.2 Items 5 & 6)

**What the self-report claims:**
> "Applied specific limiters across `authRoutes.ts`: … `sendEmailCodeLimiter` on `/send-email-verification`, `verifyEmailCodeLimiter` on `/verify-email`, and `refreshTokenLimiter` on `/refresh-token`."

**What the diff shows:**  
`git diff 76d1042 5fbd358 -- backend/src/modules/auth/auth.routes.ts` is empty.
The routes file was not touched in the Phase 4 commit.

**What the live routes file contains:**

| Route | Limiter applied? |
|---|---|
| `POST /verify-otp` | None |
| `POST /refresh-token` | None |
| `POST /send-email-verification` | None |
| `POST /verify-email` | None |

`refreshTokenLimiter`, `sendEmailCodeLimiter`, and `verifyEmailCodeLimiter` are exported
from `rateLimiter.ts` but never imported or used in `auth.routes.ts`. The limiters exist
in the middleware file; they just have no effect.

**Risk:** `/refresh-token` is unbounded. `/verify-email` is unbounded — brute-forcing
6-digit codes is trivially cheap at up to 10^6 attempts with no throttle.

**Required fix:** Import and apply the three missing limiters in `auth.routes.ts`.

---

## Finding 2 — Admin 2FA enforcement has a logic gap: ADMIN/SUPER_ADMIN without `is2FAEnabled` bypass 2FA entirely (Critical, Spec §5.1)

**What the spec requires (§5.1):**
> "After password verification passes, if `user.is2FAEnabled === true` [OR role is ADMIN/SUPER_ADMIN]: issue a pre-auth token … Do not issue a refresh token or access token at this stage."

**What the code does** (auth.service.ts L334–L348):

```typescript
// outer condition: triggers if ADMIN/SUPER_ADMIN OR is2FAEnabled
if (user.is2FAEnabled === true || user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
  // inner condition: only triggers if is2FAEnabled is also true
  if (user.is2FAEnabled && this.tokenService.generatePreAuthToken) {
    // ... issue pre-auth token
  }
  // if ADMIN but is2FAEnabled === false -> falls through here silently
}
// full tokens issued below, no guard
```

An `ADMIN` or `SUPER_ADMIN` account with `is2FAEnabled === false` (e.g. a freshly
provisioned admin, or one who disabled 2FA) enters the outer `if`, hits the inner `if`
which evaluates to `false`, exits the block with no return, and then receives a full
access + refresh token pair. 2FA is bypassed completely.

The spec is unambiguous: Admin accounts must be challenged regardless of whether
`is2FAEnabled` is currently set. The outer condition was supposed to gate the entire
role — the inner `&&` inverts that intent.

**Required fix:** For ADMIN/SUPER_ADMIN, the pre-auth gate must be unconditional. If
the account has no 2FA secret configured, return an error (`ADMIN_2FA_NOT_CONFIGURED`)
rather than issuing tokens.

---

## Finding 3 — `tokenVersion` guard is bypassable with a token that omits the claim (Medium, Spec §3.3)

**What the spec requires (§3.3):**
> "If `decoded.tokenVersion !== user.tokenVersion`, return `401 TOKEN_INVALIDATED`."

**What the code does** (authMiddleware.ts L77):

```typescript
if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== dbUser.tokenVersion) {
  return next(new AppError('...', 401, 'TOKEN_INVALIDATED'));
}
```

The `decoded.tokenVersion !== undefined` guard means a token issued **before** the Phase 4
deploy (or any token where the claim was manually omitted) will always pass this check.
The spec intent is that a missing claim should be treated as version `0` and compared
against the DB value — not silently accepted.

This is not hypothetical: any accounts created before the Phase 4 deploy have outstanding
tokens with no `tokenVersion` claim. Those tokens are permanently valid regardless of
how many times `tokenVersion` is incremented in the DB.

**Required fix:**
```typescript
if ((decoded.tokenVersion ?? -1) !== dbUser.tokenVersion) {
  return next(new AppError('...', 401, 'TOKEN_INVALIDATED'));
}
```
Or treat `undefined` as `0` and compare against `dbUser.tokenVersion`, whichever
matches the desired migration behaviour.

---

## Finding 4 — Cookie-before-body order in `refreshToken` handler (Low, Spec §3.5)

**What the self-report claims:**
> "Accepts token from body (`req.body.refreshToken`) as top priority before cookie/header fallbacks."

**What the code does** (auth.controller.ts L228):

```typescript
const token = req.cookies.refreshToken || req.body.refreshToken || ...
```

Cookie is evaluated first. The spec says body must take priority because cookie cannot
reliably arrive in cross-origin deployments (SameSite=Lax). In the cross-origin
scenario the cookie won't arrive anyway so the practical effect is zero today — but it
is a spec violation and a future regression risk if same-origin is ever added.

**Required fix:** Swap to `req.body.refreshToken || req.cookies.refreshToken || ...`

---

## Items verified as correctly implemented

| Spec item | Status |
|---|---|
| `PUBLIC` role rejected in `authenticate` middleware (both decoded and dbUser checks) | Correct |
| `emailVerified` gate on login returns `403 ACCOUNT_UNVERIFIED` | Correct |
| Account-not-found vs wrong-password: identical HTTP 401 + identical error code `ACCOUNT_NOT_FOUND_OR_INVALID` + identical message bytes — externally indistinguishable | Correct |
| Refresh rotation wired live in request path (old token revoked, new token persisted before return) | Correct |
| Reuse detection wired live in request path (`revokedAt` check + family wipe in `refreshToken()`) | Correct |
| `rememberMe` wired to 7d / 30d lifetime in `persistRefreshToken` | Correct |
| Refresh token returned in JSON response body | Correct |
| `loginLimiter` on `/login`, `registerLimiter` on `/register`, `sendOtpLimiter` on `/send-otp` and `/send-phone-otp`, `phoneVerifyLimiter` on `/verify-phone-otp` | All applied correctly in routes |
| Pre-auth token: 5-minute expiry, signed with `JWT_SECRET`, carries `preAuth: true` flag, verified with `verifyPreAuthToken` | Correct |
| Role clamped to OWNER/RESIDENT in `register()` via `forcedRole` — both service-level and DTO-level guards intact | Correct |
| `req.user` populated from live DB record (not from token claims) once DB lookup succeeds — role cannot be spoofed via a crafted token | Correct |

---

## Note on workarounds vs fixes

Nothing in the diff looks like a check was quietly disabled. The `emailVerified` gate and
the `PUBLIC` role rejection are new code blocks, not commented-out guards. The 2FA issue
(Finding 2) is a logic error in the gate condition, not a bypass. The tokenVersion issue
(Finding 3) is a guard written too loosely. Both are implementation mistakes, not
deliberate disabling.

---

## Required changes before Phase 5 starts

| # | Finding | Severity | File | Change |
|---|---|---|---|---|
| 1 | Rate limiters not applied to routes | High | `auth.routes.ts` | Import and apply `refreshTokenLimiter`, `sendEmailCodeLimiter`, `verifyEmailCodeLimiter` on the three unguarded routes |
| 2 | Admin/SUPER_ADMIN bypass 2FA if `is2FAEnabled===false` | Critical | `auth.service.ts` | Unconditionally gate ADMIN/SUPER_ADMIN on 2FA; return `ADMIN_2FA_NOT_CONFIGURED` error if no secret |
| 3 | `tokenVersion` guard skips tokens with missing claim | Medium | `authMiddleware.ts` | Treat `decoded.tokenVersion === undefined` as version `-1` or `0`, not a silent pass |
| 4 | Cookie-before-body order in `refreshToken` handler | Low | `auth.controller.ts` | Swap priority to body-first: `req.body.refreshToken \|\| req.cookies.refreshToken` |
