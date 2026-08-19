# RoomBae Audit: Authentication & Authorization Flow

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect  
**Status**: AUDIT COMPLETE — REMEDIATION PLANNED

---

## 1. Existing Implementation

- **JWT Access Tokens**: Short-lived (15 min) asymmetric RS256 signed tokens containing `kid` headers, issued via `JwtKeyService.ts`.
- **Refresh Tokens**: Cryptographically random 256-bit opaque tokens stored as SHA-256 hashes in MongoDB `RefreshToken` table linked to `SessionFamily`.
- **CSRF Defense**: Double Submit Cookie middleware (`csrfMiddleware.ts`) protecting state-mutating endpoints.
- **Frontend Session**: `AuthService.ts` storing access token strictly in-memory with singleton `refreshPromise` for concurrent 401 deduplication.
- **Authorization**: `PolicyEngine.ts` and `KycAuthorizationService.ts` checking roles and `OwnerKYC.verificationStatus`.

---

## 2. Problems Found

| Problem Area | Existing Code Pattern | File Locations | Root Cause |
| :--- | :--- | :--- | :--- |
| **Token Algorithm Mixed Usage** | Legacy tests/modules referencing symmetric HS256 alongside asymmetric RS256. | `backend/src/infrastructure/crypto/JwtTokenService.ts`, `backend/src/services/security/JwtKeyService.ts` | Partial migration to RS256 without deprecating legacy HS256 helpers. |
| **CSRF Over-Enforcement** | Global CSRF filter blocking Bearer token authenticated API calls. | `backend/src/middleware/csrfMiddleware.ts` | Lack of dual-mode discrimination between Cookie-dependent vs Bearer API routes. |
| **Session Lineage Forks** | Refresh token rotation without explicit fork/replay invalidation. | `backend/src/modules/auth/auth.service.ts` | Lack of `SessionFamily` compromise cascade on replay detection. |

---

## 3. File Locations

- Services: `backend/src/services/security/JwtKeyService.ts`, `backend/src/services/security/SessionRevocationService.ts`, `backend/src/services/security/KycAuthorizationService.ts`
- Controllers: `backend/src/modules/auth/auth.controller.ts`, `backend/src/modules/auth/auth.service.ts`
- Middleware: `backend/src/middleware/authMiddleware.ts`, `backend/src/middleware/csrfMiddleware.ts`
- Frontend: `frontend/src/services/auth.service.ts`, `frontend/src/features/auth/pages/Auth.tsx`

---

## 4. Root Cause

Asymmetric cryptographic signing and session family models were introduced without fully decoupling cookie-dependent auth routes from stateless API tokens.

---

## 5. Refactor Strategy

1. **Unify on RS256 + JWKS**: Solely use `JwtKeyService` with `kid` headers and public `GET /.well-known/jwks.json`.
2. **Targeted Double Submit CSRF**: Require CSRF validation only on `/register`, `/login`, `/logout`, `/logout-all`; bypass Bearer API requests.
3. **Strict Session Family Lineage**: Link all rotated refresh tokens via `rotatedFrom` and automatically mark `SessionFamily.compromised = true` upon reuse.
4. **Single Source KYC Gate**: Evaluate `OwnerKYC.verificationStatus === 'VERIFIED'` as the sole authority for property creation.
