# RoomBae Database Architecture Audit Report

**Date**: August 19, 2026  
**Auditor**: Principal Database Architect & Security Engineer  
**Scope**: MongoDB Atlas Schema, Prisma ORM Models, Compound Indexes, Soft Deletes & Integrity  
**Status**: ✅ **100% AUDITED & VERIFIED**

---

## 1. Executive Summary

This audit assesses the database tier of RoomBae, covering Prisma ORM 6.19.3 (Prisma 7 ready) schema models, compound index coverage, soft-delete implementation (`deletedAt`), and relational integrity across MongoDB Atlas replica sets.

---

## 2. Core Model Schema & Index Audit

| Model Name | Primary Key / Mappings | Critical Indexes | Soft Delete | Integrity Notes |
| :--- | :--- | :--- | :--- | :--- |
| `User` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([email])`, `@@index([residentCode])`, `@@index([phone])`, `@@index([deletedAt])` | `deletedAt DateTime?` | Normalized lowercase email lookups; single user identity root. |
| `SessionFamily` | `id` (`@map("_id") @db.ObjectId`) | `@@index([userId])`, `@@index([familyId])` | N/A | Session family lineage tracking for token replay detection. |
| `RefreshToken` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([tokenHash])`, `@@index([userId])`, `@@index([familyId])`, `@@index([sessionId])` | `revokedAt DateTime?` | Stores SHA-256 token hash only; links to `SessionFamily`. |
| `OtpToken` | `id` (`@map("_id") @db.ObjectId`) | `@@index([phone])`, `@@index([email])`, `@@index([expiresAt])` | N/A | Authoritative persistent OTP store with nonce & consumed timestamp. |
| `PreAuthChallenge` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([tokenHash])`, `@@index([userId])`, `@@index([expiresAt])` | N/A | Dual-storage fallback model for step-up 2FA challenges. |
| `UserDevice` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([userId, visitorIdHash])`, `@@index([status])` | N/A | Probabilistic device fingerprint storage and trust status. |
| `LoginHistory` | `id` (`@map("_id") @db.ObjectId`) | `@@index([userId, createdAt])` | N/A | Velocity history for Haversine impossible travel detection. |
| `SecurityAuditEvent` | `id` (`@map("_id") @db.ObjectId`) | `@@index([userId, createdAt])`, `@@index([eventType])`, `@@index([createdAt])` | N/A | High-throughput append-only audit trail. |
| `Owner` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([userId])`, `@@unique([email])` | `deletedAt DateTime?` | Owner profile with 1:1 relation to `OwnerKYC`. |
| `OwnerKYC` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([ownerId])` | N/A | Authoritative Single Source of Truth for owner verification. |
| `Resident` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([userId])`, `@@index([pgId])`, `@@index([status])` | `deletedAt DateTime?` | Resident profile linked to PG properties and bookings. |
| `PG` | `id` (`@map("_id") @db.ObjectId`) | `@@unique([slug])`, `@@index([ownerId])`, `@@index([city])` | `deletedAt DateTime?` | Property model managing rooms, beds, and amenities. |

---

## 3. Migration & Validation Verification

- **Schema Validation**: `npx prisma validate` completed with zero errors.
- **Client Rebuild**: `npx prisma generate` cleanly generated Client v6.19.3.
- **Data Loss Prevention**: All schema modifications (adding `deletedAt`, `SessionFamily`, and `OtpToken` fields) are strictly non-destructive additions that preserve 100% of existing collection data.
- **Currency Standard**: Paired with integer calculations for monetary units to prevent floating-point inaccuracies.
