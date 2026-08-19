# RoomBae Session Management & Token Rotation Audit Report

**Date**: August 19, 2026  
**Auditor**: Principal Security Architect & Lead Backend Engineer  
**Scope**: Refresh Tokens, Session Families, Replay Invalidation, Frontend 401 Queue  
**Status**: AUDIT COMPLETE (Grounded in Codebase)

---

## 1. Executive Summary

This report audits session lifecycle management across `backend/src/services/security/SessionRevocationService.ts`, `backend/src/infrastructure/crypto/JwtTokenService.ts`, `backend/prisma/schema.prisma`, and `frontend/src/services/auth.service.ts`.

---

## 2. Session Subsystem Audit Matrix

| Audit Item | Current Implementation | Problems & Inconsistencies | Risk Level | File Path & Lines | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Refresh Token Lineage** | `RefreshToken` schema contains `familyId` and `sessionId`, but lacks `rotatedFrom` and `revokedReason` fields. | Without explicit `rotatedFrom` pointer, detailed forensic tracing of session forks cannot be visualized during active security audits. | Medium | [`schema.prisma:L95-L115`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L95-L115) | Add `rotatedFrom String?`, `revokedReason String?`, `ipAddress String?`, and `userAgent String?` to `RefreshToken`. |
| **Session Family Engine** | `SessionRevocationService.revokeForReuseDetection` marks family compromised and revokes active tokens. | The session family rotation should track each generation explicitly in the database transaction and evict connected WebSockets across multi-node clusters. | High | [`SessionRevocationService.ts:L30-L75`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/security/SessionRevocationService.ts#L30-L75) | Enforce atomic `$transaction` rotation that invalidates ancestor, creates new token, and updates `SessionFamily.currentSessionId`. |
| **Frontend 401 Silent Refresh** | `AuthService.ts` implements a singleton `refreshPromise` to deduplicate parallel 401 refreshes. | Works well, but needs strict fallback error handling to clear in-memory tokens and trigger redirect to `/login` when refresh fails or is compromised. | Medium | [`auth.service.ts:L120-L160`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/frontend/src/services/auth.service.ts#L120-L160) | Ensure `refreshPromise` catches rejection, clears in-memory state, and emits global auth-expired event. |
| **Signup Draft Whitelist** | `Auth.tsx` stores draft progress in `localStorage` under `roombae_incomplete_signup`. | Draft engine must guarantee absolute exclusion of bank accounts, IFSC, UPI, DOB, emergency contacts, Aadhaar, and PAN via strict whitelist. | High | [`Auth.tsx:L70-L110`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/frontend/src/features/auth/pages/Auth.tsx#L70-L110) | Enforce `safeDraft` whitelist filter containing only `{ selectedRole, regStep, fullName, photoUrl, phone, email, city, state, pincode }`. |
