# RoomBae Audit: Database Architecture & Prisma Schema

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect  
**Status**: AUDIT COMPLETE — REMEDIATION PLANNED

---

## 1. Existing Implementation

- **Primary Storage**: MongoDB Atlas with Prisma ORM 6.19.3.
- **Data Models**: `User`, `ResidentProfile`, `OwnerProfile`, `OwnerKYC`, `BankAccount`, `SessionFamily`, `RefreshToken`, `OtpToken`, `PreAuthChallenge`, `IdempotencyRequest`, `OutboxEvent`, `UserDevice`, `LoginHistory`, `SecurityAuditEvent`.
- **Soft Deletion**: `deletedAt` field across user, profile, and property tables.

---

## 2. Problems Found

| Problem Area | Existing Code Pattern | File Locations | Root Cause |
| :--- | :--- | :--- | :--- |
| **Banking Data Embedding** | PII and banking fields (account numbers, IFSC, UPI) previously mixed inside `OwnerProfile`. | `backend/prisma/schema.prisma` | Pre-normalization monolithic profile design. |
| **Missing Idempotency Storage** | Financial and registration mutations vulnerable to duplicate network retries without database deduplication. | `backend/prisma/schema.prisma` | Lack of dedicated `IdempotencyRequest` caching model. |
| **Dual-Write Hazard** | Background email and SMS dispatched directly inside API transactions. | `backend/src/modules/auth/`, `backend/src/modules/email/` | Lack of Transactional Outbox pattern model (`OutboxEvent`). |

---

## 3. File Locations

- Schema: `backend/prisma/schema.prisma`
- Database Client: `backend/src/config/prisma.ts`
- Security Service: `backend/src/services/security/EncryptionService.ts`

---

## 4. Root Cause

Initial database models combined authentication, business metadata, and sensitive financial credentials into shared documents without dedicated envelope encryption.

---

## 5. Refactor Strategy

1. **Normalize BankAccount**: Decouple `BankAccount` into a 1:1 relation with `OwnerProfile`, encrypting all financial fields using AES-256-GCM (`v1:<keyId>:iv:tag:ciphertext`).
2. **Add IdempotencyRequest Model**: Cache idempotency keys, routes, and responses with TTL indexes.
3. **Add OutboxEvent Model**: Introduce transactional outbox pattern to decouple database commits from BullMQ queue dispatches.
