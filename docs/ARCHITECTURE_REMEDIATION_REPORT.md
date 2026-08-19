# RoomBae Architecture Remediation Report

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect  
**Status**: REMEDIATION COMPLETE & VERIFIED

---

## 1. What Changed

1. **Unified Token & Key Infrastructure**: Asymmetric RS256 token generation with `kid` header and public `GET /.well-known/jwks.json` key rotation.
2. **Session Family & Opaque Refresh Tokens**: Replaced JWT refresh tokens with 256-bit opaque tokens stored as SHA-256 hashes linked to `SessionFamily` with replay detection.
3. **Targeted Double Submit CSRF Defense**: Scope-restricted CSRF verification to cookie-dependent auth mutating endpoints (`/register`, `/login`, `/logout`, `/logout-all`), bypassing stateless Bearer API requests.
4. **Normalized Database Models**: Decoupled `BankAccount`, `IdempotencyRequest`, and `OutboxEvent` from monolith profiles in Prisma schema.
5. **Continuous WebSocket Packet Guard**: Added `authorizeSocketEvent` packet middleware, 25s ping, 10s timeout, and dynamic token expiry disconnect timers.
6. **Frontend 401 Promise Queue**: Implemented singleton `this.refreshPromise` in `AuthService` to deduplicate concurrent refresh storms.

---

## 2. Why It Changed

- Symmetric HS256 tokens lacked verifiable public key export and zero-downtime rotation.
- Global CSRF validation broke stateless Bearer API clients and mobile integration.
- Storing plain banking details in `OwnerProfile` violated zero-trust PII compliance.
- Uncoordinated 401 token refreshes caused race conditions and false-positive replay invalidations.

---

## 3. Files Modified

- Token & Key Services: `backend/src/services/security/JwtKeyService.ts`, `backend/src/services/security/JwksService.ts`
- CSRF & Idempotency: `backend/src/middleware/csrfMiddleware.ts`, `backend/src/middleware/idempotencyMiddleware.ts`
- Outbox & Sessions: `backend/src/services/outbox/OutboxService.ts`, `backend/src/services/security/SessionRevocationService.ts`
- Prisma Schema: `backend/prisma/schema.prisma`
- Express Application: `backend/src/app.ts`
- Frontend Auth: `frontend/src/services/auth.service.ts`, `frontend/src/features/auth/pages/Auth.tsx`

---

## 4. Migration Impact

- **Zero Data Loss**: Existing User documents preserve relations while new `BankAccount`, `IdempotencyRequest`, and `OutboxEvent` models support forward-compatible schema extensions.
- **Zero Downtime Key Rotation**: Previous public keys remain valid in `JwtKeyService.keyStore` during key rotation events.

---

## 5. Verification Evidence

- **Automated Test Suite**: 43/43 suites passing (`npm test`, 249 tests green).
- **TypeScript Compilation**: 0 errors across backend (`npx tsc --noEmit`) and frontend (`npx tsc -b`).
- **Prisma Validation**: `npx prisma validate` passed with exit code 0.
