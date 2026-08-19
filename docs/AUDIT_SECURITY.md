# RoomBae Audit: Security Architecture & Cryptographic Integrity

**Date**: August 19, 2026  
**Auditor**: Principal Security Architect  
**Status**: AUDIT COMPLETE — REMEDIATION PLANNED

---

## 1. Existing Implementation

- **Password Hashing**: Bcrypt cost factor 12.
- **Asymmetric JWT**: RS256 with `kid` header, multi-key store, and public JWKS endpoint (`/.well-known/jwks.json`).
- **Field Encryption**: AES-256-GCM envelope (`v1:<keyId>:iv:tag:ciphertext`) for Aadhaar, PAN, and banking details.
- **Device Risk Engine**: Multi-signal scoring with Haversine velocity impossible travel calculation (> 800 km/h) and step-up 2FA enforcement.
- **Header Hardening**: Helmet v8, HPP, express-mongo-sanitize, `Cache-Control: private, no-store`.

---

## 2. Problems Found

| Problem Area | Existing Code Pattern | File Locations | Root Cause |
| :--- | :--- | :--- | :--- |
| **Raw Fingerprint Storage** | Storing unhashed `visitorId` strings directly in device records. | `backend/src/services/security/RiskEngine.ts`, `backend/src/modules/devices/` | Lack of SHA-256 visitor hash normalization. |
| **Incomplete Signup PII Exposure** | Browser `localStorage` caching unencrypted bank account numbers and IFSC codes. | `frontend/src/features/auth/pages/Auth.tsx` | Over-broad draft serialization capturing all form fields. |
| **OAuth State Replay** | Unsigned OAuth state parameter allowing CSRF injection during Google callback. | `backend/src/modules/auth/auth.controller.ts` | Lack of HMAC-SHA256 signature and nonce validation on state payload. |

---

## 3. File Locations

- Risk Engine: `backend/src/services/security/RiskEngine.ts`
- Encryption Service: `backend/src/services/security/EncryptionService.ts`
- Auth Controller: `backend/src/modules/auth/auth.controller.ts`
- Frontend Wizard: `frontend/src/features/auth/pages/Auth.tsx`

---

## 4. Root Cause

Client-side browser storage and social authentication state lacked cryptographic signatures and strict field-level redaction filters.

---

## 5. Refactor Strategy

1. **Hash Visitor IDs**: Hash raw `visitorId` with SHA-256 before database persistence and index lookups (`UserDevice` compound unique `[userId, visitorIdHash]`).
2. **Sanitize Signup Drafts**: Strictly exclude banking details (`accountHolderName`, `bankName`, `ifscCode`, `accountNumber`, `upiId`), DOB, and emergency contacts from browser `localStorage`.
3. **Sign OAuth State**: Sign state payload (`{ role, redirect, nonce, timestamp }`) with HMAC-SHA256 and enforce post-OAuth Phone OTP verification.
