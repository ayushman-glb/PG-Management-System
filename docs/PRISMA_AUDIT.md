# RoomBae Prisma Schema & Database Normalization Audit Report

**Date**: August 19, 2026  
**Auditor**: Principal Database Architect & Security Engineer  
**Scope**: Prisma 7 Readiness, Relational Schema Normalization, Soft Deletes, Compound Indexes  
**Status**: AUDIT COMPLETE (Grounded in Codebase)

---

## 1. Executive Summary

This report audits the Prisma schema (`backend/prisma/schema.prisma`) for relational normalization, index efficiency, soft delete uniformity, and preparation for `BankAccount`, `IdempotencyRequest`, and `OutboxEvent` models.

---

## 2. Database Model Audit Matrix

| Model | Current Schema State | Required Schema Enhancement | Risk Level | Line References | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `User` | Complete with `kycStatus`, `tokenVersion`, `deletedAt`. | Preserve existing fields; ensure lowercase email unique index is enforced. | Low | [`schema.prisma:L20-L55`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L20-L55) | Maintain `deletedAt DateTime?` and compound index `@@index([residentCode, phone])`. |
| `RefreshToken` | Contains `tokenHash`, `userId`, `familyId`, `sessionId`. | Add `rotatedFrom String?`, `revokedReason String?`, `ipAddress String?`, and `userAgent String?`. | Medium | [`schema.prisma:L95-L115`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L95-L115) | Extend `RefreshToken` model non-destructively. |
| `BankAccount` | Not isolated (embedded in `OwnerProfile`). | Extract banking into dedicated `BankAccount` model linked 1:1 with `OwnerProfile`. | High | [`schema.prisma:L140-L170`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L140-L170) | Create `BankAccount` model with encrypted fields (`accountNumber`, `ifscCode`, `upiId`). |
| `IdempotencyRequest` | Missing model. | Add `IdempotencyRequest` with `key`, `route`, `userId`, `response`, `expiresAt`. | High | [`schema.prisma`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma) | Add `IdempotencyRequest` model with TTL index on `expiresAt`. |
| `OutboxEvent` | Missing model. | Add `OutboxEvent` with `eventType`, `payload`, `status` (`PENDING`, `PROCESSED`, `FAILED`), `attempts`. | High | [`schema.prisma`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma) | Add `OutboxEvent` model with index `@@index([status, createdAt])`. |
