# RoomBae Database Migration & Prisma Normalization Report

**Date**: August 19, 2026  
**Auditor**: Principal Database Architect  
**Status**: SCHEMA VALIDATED & MIGRATION COMPLETE

---

## 1. What Changed

1. **Normalized `BankAccount` Model**: Extracted banking fields from `OwnerProfile` into a dedicated 1:1 relation with authenticated AES-256-GCM envelope encryption (`accountHolderName`, `accountNumber`, `ifscCode`, `upiId`).
2. **Added `IdempotencyRequest` Model**: Caches idempotency keys, routes, and responses with TTL indexes on `expiresAt` for deduplication.
3. **Added `OutboxEvent` Model**: Stores transactional events (`eventType`, `payload`, `status`, `attempts`, `error`) for reliable BullMQ processing.
4. **Extended `RefreshToken` Model**: Added `rotatedFrom` and `revokedReason` columns for lineage tracking and forensic analysis.
5. **Universal Soft Deletion**: Embedded `deletedAt DateTime?` across all core entity models (`User`, `ResidentProfile`, `OwnerProfile`, `Property`, `Room`, `Bed`, `Booking`, `Invoice`, `Complaint`).

---

## 2. Why It Changed

- Financial PII must be encrypted at rest and separated from general owner demographic data.
- Payment, booking, and registration mutations require server-side idempotency to prevent duplicate charges.
- Background tasks (Email/SMS) require transactional outbox guarantees to eliminate dual-write hazards.

---

## 3. Files Modified

- Schema Definition: `backend/prisma/schema.prisma`
- Encryption Service: `backend/src/services/security/EncryptionService.ts`
- Idempotency Middleware: `backend/src/middleware/idempotencyMiddleware.ts`
- Outbox Manager: `backend/src/services/outbox/OutboxService.ts`

---

## 4. Migration Impact

- **Forward & Backward Compatibility**: All newly created models integrate cleanly without modifying existing collection IDs.
- **Client Generation**: Prisma Client regenerated successfully (`npx prisma generate`).

---

## 5. Verification Evidence

- `npx prisma validate` output: `The schema at prisma/schema.prisma is valid 🚀`.
- Unit tests: `encryptionService.test.ts`, `idempotencyMiddleware.test.ts`, `outboxService.test.ts` passing.
