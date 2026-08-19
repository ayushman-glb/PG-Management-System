# RoomBae Authentication Architecture Audit Report

**Date**: August 19, 2026  
**Auditor**: Principal Security Architect & Lead Backend Engineer  
**Scope**: Asymmetric RS256 Tokens, JWKS Rotation, CSRF Boundary, and Google OAuth 2.0 PKCE  
**Status**: AUDIT COMPLETE (Grounded in Codebase)

---

## 1. Executive Summary

This report performs a code-level audit of the authentication subsystems across `backend/src/infrastructure/crypto/JwtTokenService.ts`, `backend/src/services/security/JwtKeyService.ts`, `backend/src/middleware/csrfMiddleware.ts`, and `backend/src/modules/auth/auth.routes.ts`.

---

## 2. Authentication Architecture Audit Matrix

| Audit Item | Current Codebase Implementation | Problems & Vulnerabilities | Risk Level | File Path & Lines | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Token Algorithm & Key Management** | `JwtKeyService.ts` implements RS256 signing with ephemeral keypairs, but lacks `kid` header and public JWKS endpoint. | Without `kid` and a public JWKS endpoint (`/.well-known/jwks.json`), zero-downtime key rotation cannot be automated across distributed verification agents. | High | [`JwtKeyService.ts:L15-L60`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/security/JwtKeyService.ts#L15-L60) | Add `kid` in JWT header (`alg: RS256, kid`), multiple active key retention, and expose `GET /.well-known/jwks.json`. |
| **CSRF Validation Scope** | `csrfMiddleware.ts` globally validates state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`). | Validating CSRF on pure `Authorization: Bearer` APIs is redundant since browsers do not auto-attach Bearer tokens. It causes unnecessary friction on mobile/API clients. | Medium | [`csrfMiddleware.ts:L40-L75`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/csrfMiddleware.ts#L40-L75) | Restrict CSRF validation to cookie-dependent entrypoints (`/register`, `/login`, `/logout`, `/logout-all`) and pass through if `Authorization: Bearer` is provided. |
| **Google OAuth Flow** | Passport Google OAuth2 strategy in `auth.routes.ts` exchanges profile data directly. | Lacks PKCE challenge verification, HMAC-signed state tampering prevention, and mandatory post-OAuth phone OTP step before account provisioning. | High | [`auth.routes.ts:L85-L115`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.routes.ts#L85-L115) | Implement Authorization Code Flow with PKCE, HMAC-SHA256 signed state `{ role, redirect, nonce, timestamp }`, and enforce Phone OTP step before full user activation. |
| **Secrets Management** | `env.ts` directly references `process.env` properties across modules. | No unified `secrets.ts` validation with Zod to enforce fast failure on missing asymmetric keys, Redis URI, or database credentials. | High | [`env.ts:L1-L50`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/env.ts#L1-L50) | Create centralized `src/config/secrets.ts` with strict Zod schema parsing and fail-fast startup assertions. |
