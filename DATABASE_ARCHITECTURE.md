# RoomBae — Database Architecture & MongoDB Indexing

This document outlines RoomBae's database schema design, Prisma ORM v5.22 integration, embedded composite types, indexing strategy, and soft delete rules.

---

## 1. Core Data Models (`schema.prisma`)

- **`User`**: Account credentials, roles (`Role` enum), Google OAuth IDs, and profile references.
- **`Owner`**: PG Owner profiles, address, Aadhaar/PAN details, and linked properties.
- **`Resident`**: Tenant details, bed assignments, move-in dates, guardian info, and status (`ACTIVE`, `INACTIVE`, `ON_LEAVE`).
- **`PG`**: Property details, address coordinates, capacity, occupancy, amenities, and floor plans.
- **`MediaRecord`**: Top-level collection storing Cloudinary asset metadata (`url`, `secureUrl`, `publicId`, `assetId`, `folder`, `width`, `height`, `format`, `bytes`, `originalFilename`, `checksum`, `entityType`, `entityId`, `uploadedBy`, `uploadedAt`).
- **`MediaAsset`**: Embedded composite type for storing media metadata inline inside parent models (`User`, `PG`, `Resident`, `OwnerKYC`, `Complaint`, `Agreement`).

---

## 2. Indexing Strategy

- `@unique` index on `publicId` in `MediaRecord` collection for O(1) asset metadata lookup.
- `@unique` index on `email` and `residentCode` in `User` collection.
- `@unique` index on `slug` in `PG` collection.
- Index on `[entityType, entityId]` in `MediaRecord` collection for quick filtering of entity media attachments.
