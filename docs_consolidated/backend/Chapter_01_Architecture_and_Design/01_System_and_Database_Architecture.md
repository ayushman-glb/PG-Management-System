# 01 System and Database Architecture

> Consolidated documentation chapter for **backend**

---

## Source: $relSource

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



---

## Source: $relSource

# RoomBae — Centralized Upload Architecture

This document describes the end-to-end file and media upload pipeline for RoomBae, covering Multer staging, Sharp image processing, magic byte verification, Cloudinary cloud storage, MongoDB metadata persistence, and transactional rollback compensation.

---

## 1. Request Lifecycle Diagram

```
Client App (React / Axios / XHR)
      │
      ▼
Express Router (/api/v1/media or /api/v1/upload)
      │
      ├─► Rate Limiter Middleware (uploadLimiter)
      ├─► Multer Staging Middleware (multerUpload)
      ├─► Security Pipeline Middleware (processSecurityPipeline)
      │      ├── 1. File extension validation (.jpg, .png, .webp, .avif, .pdf)
      │      ├── 2. Magic byte signature verification
      │      ├── 3. Sharp optimization (q_auto, f_auto, WebP/AVIF output)
      │      └── 4. SHA-256 Checksum computation
      │
      ▼
Media Controller (mediaController.uploadSingle / uploadMultiple)
      │
      ▼
Media Service (mediaService.uploadSingle)
      │
      ├─► 1. Cloudinary Upload (cloudinaryService.uploadFile)
      └─► 2. MongoDB Metadata Record Save (mediaRepository.createMediaRecord)
             └── Transactional Rollback: If DB save fails, automatically call
                 cloudinaryService.deleteFile(publicId) to prevent orphans.
```

---

## 2. Supported Folder Hierarchy

Uploads are automatically organized into Cloudinary subfolders namespaced by environment prefix (`RoomBae-development` or `RoomBae-production`):

| Target Entity | Cloudinary Path | Allowed Extensions |
| :--- | :--- | :--- |
| **Rooms & Beds** | `RoomBae-{env}/rooms/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Properties** | `RoomBae-{env}/properties/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Owner Profiles** | `RoomBae-{env}/owners/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Residents** | `RoomBae-{env}/residents/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Avatars** | `RoomBae-{env}/avatars/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Agreements** | `RoomBae-{env}/agreements/` | `.pdf`, `.svg` |
| **Complaints** | `RoomBae-{env}/complaints/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Documents** | `RoomBae-{env}/documents/` | `.pdf`, `.jpg`, `.png`, `.webp` |
| **KYC Scans** | `RoomBae-{env}/kyc/` | `.pdf`, `.jpg`, `.png`, `.webp` |

---

## 3. Transactional Compensation & Rollback Rules

To eliminate orphaned cloud assets and dangling database references:
1. **Cloudinary Upload Failure**: If Cloudinary upload fails, the request returns a 500 error immediately. Database records are **never** created.
2. **MongoDB Write Failure**: If database metadata saving fails after Cloudinary succeeds, a `try/catch` block catches the exception and immediately issues a `cloudinaryService.deleteFile(publicId)` call to delete the asset from Cloudinary.
3. **Asset Replacement**: When an image is replaced via `PUT /api/v1/media/replace/:publicId`, the existing Cloudinary asset and its MongoDB record are purged before the new asset is persisted.



---

## Source: $relSource

# ⚙️ RoomBae Enterprise Backend Architecture & Systems Design Specification (`backend_design.md`)

> **Architectural Specification & Systems Design Document** for the RoomBae Clean Architecture MERN Enterprise Backend (Node.js + Express + TypeScript + Prisma ORM + MongoDB + Redis + GraphQL + Socket.IO).

---

## 🏛️ 1. High-Level Architecture Overview

The **RoomBae Backend** is an enterprise-grade feature-first modular Node.js backend engineered to support the RoomBae React 19 single-page application. It delivers a multi-protocol API layer (REST, GraphQL, Socket.IO real-time engine) coupled with zero-trust security, field-level encryption, distributed concurrency locks, and automated GST billing workflows.

```
                    ┌─────────────────────────────────────────┐
                    │      React 19 + Vite 6 Frontend         │
                    └──────────────────┬──────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   REST API (/api/v1/*)      GraphQL (/graphql)      Socket.IO Engine (Realtime)
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │     Express.js Gateway      │
                        │    (Tenant & Middleware)    │
                        └──────────────┬──────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  Prisma ORM 5.x                 Redis 7.x Cache &            Razorpay & PDFKit
 (MongoDB Atlas 7.0)           Distributed Redlock            Payment / Invoice
```

---

## 🔐 2. Zero-Trust Security & Concurrency Architecture

### 2.1 Cryptographic Standards & Field Encryption
- **AES-256-GCM Encryption**: Sensitive resident KYC payloads (Aadhaar number, PAN number, Bank account number, UPI IDs) are encrypted prior to database persistence.
- **Password Hashing**: Bcrypt with 12 salt rounds for local credential authentication.
- **JWT Authentication**:
  - **Access Token**: Short-lived 15-minute JWT passed via `Authorization: Bearer <token>`.
  - **Refresh Token**: Long-lived 7-day HTTP-Only cookie.

### 2.2 Distributed Bed Concurrency Locking (Redlock)
When simultaneous users attempt to reserve or pay for the same bed:
1. Redlock acquires a distributed lock on key `bed:lock:{bedId}` with a TTL of 30 seconds.
2. Successful transaction sets bed status to `OCCUPIED` and attaches `residentId`.
3. Competing requests fail lock acquisition and trigger instant rollback or refund.

---

## 🗂️ 3. Feature-First Domain Modules Structure (`src/modules/`)

The backend codebase is organized into self-contained feature-first domain modules:

```
src/modules/
├── auth/          # Auth, JWT, OTP, Login/Register DTOs, Routes, Services
├── owners/        # Owner Onboarding, KYC, Business Info, Bank Details, Building Specs
├── properties/    # PG Property CRUD, Amenities, Public Listings
├── rooms/         # Room Creation, Conversions, Transfer Requests
├── beds/          # Bed Inventory, Holds, Lock Statuses
├── residents/     # Resident Directory, Onboarding, Self-Service Status History
├── billing/       # Invoices, Razorpay Integration, GST Calculation, PDF Generation
├── complaints/    # Helpdesk Complaint Tickets, SLA Escalations
├── agreements/    # Digital Rental Agreements, E-Signatures, PDF Downloads
├── search/        # Global Multi-Entity Search Engine
├── analytics/     # MRR, Occupancy Rates, Revenue Analytics
├── notifications/ # User Real-Time Push Alerts & History
└── settings/      # SaaS Verification Queue, Admin Approval, Account Deletion
```

---

## 🗄️ 4. Database Schema & Prisma Data Models (`schema.prisma`)

MongoDB Atlas data models managed by Prisma ORM:

1. **`User`**: Account identity (`email`, `passwordHash`, `role`: `PUBLIC`, `RESIDENT`, `OWNER`, `ADMIN`).
2. **`Owner`**: Landlord profile with KYC, business details, bank info, and subscription plan.
3. **`PG`**: Property record (`name`, `address`, `city`, `rentStartingFrom`, `capacity`, `availableBeds`).
4. **`Building` / `Floor`**: Hierarchical building specs and floor mappings.
5. **`Room`**: Room inventory (`roomNumber`, `roomType`: `SINGLE`, `DOUBLE`, `TRIPLE`, `FOUR_SHARING`, `rentAmount`).
6. **`Bed`**: Bed availability (`bedNumber`, `roomId`, `residentId`).
7. **`Resident`**: Tenant profile (`encryptedKycData`, `status`: `ACTIVE`, `HOME`, `ON_LEAVE`, `HOLD`, `LEAVING`, `CHECKED_OUT`).
8. **`Invoice` / `Payment`**: Billing invoices (`invoiceNumber`, `baseAmount`, `cgstAmount`, `sgstAmount`, `totalAmount`, `status`: `PAID`, `PENDING`).
9. **`Complaint`**: Maintenance ticket (`ticketCode`, `category`, `title`, `priority`, `status`: `OPEN`, `IN_PROGRESS`, `RESOLVED`).
10. **`Agreement`**: Rental contract (`agreementNumber`, `signatures`, `pdfUrl`).
11. **`ActivityLog`**: System audit trail (`action`, `userId`, `ipAddress`, `timestamp`).



---

## Source: $relSource

# ⚙️ RoomBae Backend Architecture & Enterprise Systems Design Specification (`backend/DESIGN.md`)

> **Architectural Specification & Systems Design Document** for the RoomBae Clean Architecture MERN Enterprise Backend (Node.js + Express + TypeScript + Prisma ORM + MongoDB + Redis + GraphQL + Socket.IO).

---

## 🏛️ 1. High-Level Architecture Overview & SOLID Design

The **RoomBae Backend** is an enterprise-grade feature-first modular Node.js service engineered to support the RoomBae React 19 single-page application. It enforces **Clean Architecture**, **SOLID principles** (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion), and **Composition over Inheritance**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation Protocols                          │
│        REST Routes (/api/v1/*)  │  GraphQL Apollo  │  Socket.IO Realtime│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                           Controller Layer                             │
│       Transforms HTTP/GQL requests, invokes Application Services        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Application Service Layer                       │
│    Business Rules, Validation, State Machines, Notification Dispatch    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Domain Repository Layer                        │
│     Interfaces abstraction over Prisma ORM (MongoDB) & Redis Redlock   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 2. Dependency Injection & IoC Container Architecture

The backend uses a lightweight Inversion of Control (IoC) Container pattern (`Container.ts`) to wire dependencies with TypeScript interfaces:

```typescript
// Dependency Wiring Example
export class Container {
  private static _residentService: IResidentService;
  private static _residentRepository: IResidentRepository;

  public static getResidentService(): IResidentService {
    if (!this._residentService) {
      this._residentRepository = new PrismaResidentRepository(prismaClient);
      this._residentService = new ResidentService(
        this._residentRepository,
        this.getNotificationService(),
        this.getRedisService()
      );
    }
    return this._residentService;
  }
}
```

---

## 🗂️ 3. Feature-First Domain Modules Structure (`src/modules/`)

The backend codebase is organized into self-contained feature-first domain modules:

```
src/modules/
├── auth/          # Auth, JWT, OTP, Login/Register DTOs, Routes, Services
├── owners/        # Owner Onboarding, KYC, Business Info, Bank Details, Building Specs
├── properties/    # PG Property CRUD, Amenities, Public Listings
├── rooms/         # Room Creation, Conversions, Transfer Requests
├── beds/          # Bed Inventory, Holds, Lock Statuses
├── residents/     # Resident Directory, Onboarding, Self-Service Status History
├── billing/       # Invoices, Razorpay Integration, GST Calculation, PDF Generation
├── complaints/    # Helpdesk Complaint Tickets, SLA Escalations
├── agreements/    # Digital Rental Agreements, E-Signatures, PDF Downloads
├── search/        # Global Multi-Entity Search Engine
├── analytics/     # MRR, Occupancy Rates, Revenue Analytics
├── notifications/ # User Real-Time Push Alerts & History
└── settings/      # SaaS Verification Queue, Admin Approval, Account Deletion
```

Each module contains:
- `*.dto.ts`: Data Transfer Objects and Zod validation schemas.
- `*.interface.ts`: TypeScript interfaces for services and repositories.
- `*.repository.ts`: Data access layer implementation via Prisma ORM.
- `*.service.ts`: Business logic and domain state transitions.
- `*.controller.ts`: Express REST HTTP handlers.
- `*.graphql.ts`: GraphQL Apollo queries and mutations.

---

## 🔐 4. Zero-Trust Security & Concurrency Architecture

### 4.1 Field-Level Encryption (AES-256-GCM)
Sensitive resident KYC data (Aadhaar number, PAN number, Bank account details) is encrypted before database persistence using AES-256-GCM encryption with IVs and authentication tags.

### 4.2 Distributed Concurrency Locks (Redis Redlock)
When multiple users attempt to reserve or pay for the same bed concurrently:
1. Redlock acquires a lock on `bed:lock:{bedId}` with a 30-second TTL.
2. The transaction sets bed status to `OCCUPIED` and links `residentId`.
3. Concurrent requests fail lock acquisition and trigger instant payment rollback/refund.

### 4.3 Multi-Role Authorization (RBAC)
- Roles: `PUBLIC`, `RESIDENT`, `OWNER`, `ADMIN`.
- Protected routes evaluate JWT claims and enforce role-level permission guards.

---

## 🗄️ 5. Prisma ORM Data Model (`schema.prisma`)

Data entities managed in MongoDB Atlas:

1. **`User`**: Account identity & authentication.
2. **`Owner`**: Landlord profile with KYC, business details, bank info, and subscription plan.
3. **`PG`**: Property record (`name`, `address`, `city`, `capacity`, `availableBeds`).
4. **`Building` / `Floor`**: Hierarchical building specs and floor mappings.
5. **`Room`**: Room inventory (`roomNumber`, `roomType`: `SINGLE`, `DOUBLE`, `TRIPLE`, `FOUR_SHARING`, `rentAmount`).
6. **`Bed`**: Bed availability (`bedNumber`, `roomId`, `residentId`).
7. **`Resident`**: Tenant profile (`encryptedKycData`, `status`: `ACTIVE`, `HOME`, `ON_LEAVE`, `HOLD`, `LEAVING`, `CHECKED_OUT`).
8. **`Invoice` / `Payment`**: Billing invoices (`invoiceNumber`, `baseAmount`, `cgstAmount`, `sgstAmount`, `totalAmount`, `status`: `PAID`, `PENDING`).
9. **`Complaint`**: Maintenance ticket (`ticketCode`, `category`, `title`, `priority`, `status`: `OPEN`, `IN_PROGRESS`, `RESOLVED`).
10. **`Agreement`**: Rental contract (`agreementNumber`, `signatures`, `pdfUrl`).
11. **`ActivityLog`**: System audit trail (`action`, `userId`, `ipAddress`, `timestamp`).



---

## Source: $relSource

# ⚙️ RoomBae Backend Architecture & Enterprise Systems Design Specification (`BACKEND_DESIGN.md`)

> **Architectural Specification & Systems Design Document** for the RoomBae Clean Architecture MERN Enterprise Backend (Node.js + Express + TypeScript + Prisma ORM + MongoDB + Redis + GraphQL + Socket.IO).

---

## 🏛️ 1. High-Level Architecture Overview & SOLID Design

The **RoomBae Backend** is an enterprise-grade feature-first modular Node.js service engineered to support the RoomBae React 19 single-page application. It enforces **Clean Architecture**, **SOLID principles** (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion), and **Composition over Inheritance**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation Protocols                          │
│        REST Routes (/api/v1/*)  │  GraphQL Apollo  │  Socket.IO Realtime│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                           Controller Layer                             │
│       Transforms HTTP/GQL requests, invokes Application Services        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Application Service Layer                       │
│    Business Rules, Validation, State Machines, Notification Dispatch    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Domain Repository Layer                        │
│     Interfaces abstraction over Prisma ORM (MongoDB) & Redis Redlock   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 2. Dependency Injection & IoC Container Architecture

The backend uses a lightweight Inversion of Control (IoC) Container pattern (`Container.ts`) to wire dependencies with TypeScript interfaces:

```typescript
// Dependency Wiring Example
export class Container {
  private static _residentService: IResidentService;
  private static _residentRepository: IResidentRepository;

  public static getResidentService(): IResidentService {
    if (!this._residentService) {
      this._residentRepository = new PrismaResidentRepository(prismaClient);
      this._residentService = new ResidentService(
        this._residentRepository,
        this.getNotificationService(),
        this.getRedisService()
      );
    }
    return this._residentService;
  }
}
```

---

## 🗂️ 3. Feature-First Domain Modules Structure (`src/modules/`)

The backend codebase is organized into self-contained feature-first domain modules:

```
src/modules/
├── auth/          # Auth, JWT, OTP, Login/Register DTOs, Routes, Services
├── owners/        # Owner Onboarding, KYC, Business Info, Bank Details, Building Specs
├── properties/    # PG Property CRUD, Amenities, Public Listings
├── rooms/         # Room Creation, Conversions, Transfer Requests
├── beds/          # Bed Inventory, Holds, Lock Statuses
├── residents/     # Resident Directory, Onboarding, Self-Service Status History
├── billing/       # Invoices, Razorpay Integration, GST Calculation, PDF Generation
├── complaints/    # Helpdesk Complaint Tickets, SLA Escalations
├── agreements/    # Digital Rental Agreements, E-Signatures, PDF Downloads
├── search/        # Global Multi-Entity Search Engine
├── analytics/     # MRR, Occupancy Rates, Revenue Analytics
├── notifications/ # User Real-Time Push Alerts & History
└── settings/      # SaaS Verification Queue, Admin Approval, Account Deletion
```

Each module contains:
- `*.dto.ts`: Data Transfer Objects and Zod validation schemas.
- `*.interface.ts`: TypeScript interfaces for services and repositories.
- `*.repository.ts`: Data access layer implementation via Prisma ORM.
- `*.service.ts`: Business logic and domain state transitions.
- `*.controller.ts`: Express REST HTTP handlers.
- `*.graphql.ts`: GraphQL Apollo queries and mutations.

---

## 🔐 4. Zero-Trust Security & Concurrency Architecture

### 4.1 Field-Level Encryption (AES-256-GCM)
Sensitive resident KYC data (Aadhaar number, PAN number, Bank account details) is encrypted before database persistence using AES-256-GCM encryption with IVs and authentication tags.

### 4.2 Distributed Concurrency Locks (Redis Redlock)
When multiple users attempt to reserve or pay for the same bed concurrently:
1. Redlock acquires a lock on `bed:lock:{bedId}` with a 30-second TTL.
2. The transaction sets bed status to `OCCUPIED` and links `residentId`.
3. Concurrent requests fail lock acquisition and trigger instant payment rollback/refund.

### 4.3 Multi-Role Authorization (RBAC)
- Roles: `PUBLIC`, `RESIDENT`, `OWNER`, `ADMIN`.
- Protected routes evaluate JWT claims and enforce role-level permission guards.

---

## 🗄️ 5. Prisma ORM Data Model (`schema.prisma`)

Data entities managed in MongoDB Atlas:

1. **`User`**: Account identity & authentication.
2. **`Owner`**: Landlord profile with KYC, business details, bank info, and subscription plan.
3. **`PG`**: Property record (`name`, `address`, `city`, `capacity`, `availableBeds`).
4. **`Building` / `Floor`**: Hierarchical building specs and floor mappings.
5. **`Room`**: Room inventory (`roomNumber`, `roomType`: `SINGLE`, `DOUBLE`, `TRIPLE`, `FOUR_SHARING`, `rentAmount`).
6. **`Bed`**: Bed availability (`bedNumber`, `roomId`, `residentId`).
7. **`Resident`**: Tenant profile (`encryptedKycData`, `status`: `ACTIVE`, `HOME`, `ON_LEAVE`, `HOLD`, `LEAVING`, `CHECKED_OUT`).
8. **`Invoice` / `Payment`**: Billing invoices (`invoiceNumber`, `baseAmount`, `cgstAmount`, `sgstAmount`, `totalAmount`, `status`: `PAID`, `PENDING`).
9. **`Complaint`**: Maintenance ticket (`ticketCode`, `category`, `title`, `priority`, `status`: `OPEN`, `IN_PROGRESS`, `RESOLVED`).
10. **`Agreement`**: Rental contract (`agreementNumber`, `signatures`, `pdfUrl`).
11. **`ActivityLog`**: System audit trail (`action`, `userId`, `ipAddress`, `timestamp`).



---

## Source: $relSource

# 🚀 ULTIMATE AI MASTER PROMPT: Zero-Trust MERN Enterprise Backend for "RoomBae" PG Management System

> **Target Role**: Principal Cyber-Security Architect, Lead Systems Architect, and Senior MERN Backend Engineer (Node.js + Express + TypeScript + Prisma ORM + MongoDB + Redis + GraphQL + SOAP).
> **Purpose**: Build the production-ready, enterprise-grade, zero-trust backend for the **RoomBae** PG Management application.

---

## 1. 📌 PROJECT ARCHITECTURE OVERVIEW

You are building the official enterprise backend service for **RoomBae**, a modern luxury Paying Guest (PG) & Co-Living Management Platform. The frontend is a React 19 + Vite 6 + TypeScript single-page application containing **14 interactive views**:

1. **Landing & Discovery (`Landing.tsx`, `PGListing.tsx`, `PGDetails.tsx`)**: Public PG search by location/city, rent range sliders, type filters (Men's, Women's, Mixed), room options (Single, Double, Triple), image galleries, reviews, nearby places, and visit scheduling.
2. **Owner Management Dashboard (`Dashboard.tsx`, `Analytics.tsx`)**: Real-time revenue metrics, occupancy percentages (heatmaps & pie charts), pending dues breakdown, monthly collection trends, and automated quick actions.
3. **Property & Inventory Operations (`Properties.tsx`, `Operations.tsx`)**: Multi-property management, floor-by-floor room grid, bed allocation matrices, and property configuration (GSTIN, bank payout accounts, amenities).
4. **Resident Directory & Digital Onboarding (`Residents.tsx`, `ResidentRegister.tsx`)**: 5-step KYC onboarding flow (Personal info, Aadhaar/PAN upload with image/PDF preview, permanent/current address, PG preferences, bank/UPI details).
5. **Billing, GST Invoicing & Payments (`Billing.tsx`)**: Razorpay payment integration, automatic CGST (9%) + SGST (9%) or IGST (18%) calculations, PDF tax invoice generation, and reminder dispatch.
6. **Complaints & Helpdesk (`Complaints.tsx`)**: Priority ticket workflow (Low, Medium, High, Urgent), ticket categories (Plumbing, Wi-Fi, Electrical, Housekeeping), status transitions (Open, In Progress, Resolved).
7. **Resident Self-Service Portal (`ResidentPortal.tsx`)**: 8-tab tenant dashboard covering Rent Due status, KYC verification badge, Roommate profiles & Wi-Fi credentials, Rent history & instant Razorpay checkout, Maintenance ticket tracker, Digital Visitor Pass QR generation, Weekly Meal Menu with Skip-Meal toggles, and Outing Gate Pass workflow.
8. **Authentication & Security (`Auth.tsx`)**: Dual role authentication (`OWNER` vs `RESIDENT`), Email + Password login, Resident ID login (`RES1001`), Google OAuth 2.0, WebOTP SMS auto-fill, and 2FA OTP verification.

---

## 2. 🛠 COMPLETE TECH STACK & SYSTEM SPECS

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ LTS) + TypeScript | PM2 Cluster Mode (Multi-threaded CPU scaling) |
| **Framework** | Express.js 4.x / 5.x | REST API routes (`/api/v1/*`) |
| **Database** | MongoDB 7.0 Replica Set | Multi-document ACID transactions |
| **ORM** | Prisma ORM 5.x (`provider = "mongodb"`) | Type-safe database queries & migrations |
| **Caching & Locking** | Redis 7.x + `ioredis` + `redlock` | Rate limiting, Session store, Distributed bed locks |
| **Dual API Layer** | GraphQL (`@apollo/server`) + SOAP (`node-soap`) | Complex data fetching (GraphQL) & Enterprise ERP billing (`/soap/billing?wsdl`) |
| **Payment Engine** | Razorpay SDK + Webhooks (HMAC-SHA256) | Multi-channel payments, auto-reconciliation, instant refunds |
| **Invoice Engine** | PDFKit + Stream | GST Tax Invoice PDF generation (`GET /api/v1/invoices/:id/download`) |
| **Geo-Location** | Nominatim OpenStreetMap / Mapbox API | Haversine distance, nearby PGs, lat/lng validation |
| **Security Suite** | Helmet, `express-ipfilter`, `express-rate-limit`, `express-mongo-sanitize`, AES-256-GCM | Zero-Trust security, TLS 1.3, CSP, NoSQL Injection & XSS protection |



---

## Source: $relSource

# RoomBae 1M+ User Scale Enterprise Architecture & Threat Model

## 1. System Architecture & Topology

```
                          [ Global Cloudflare Edge / WAF ]
                                        │
                                [ NGINX Load Balancer ]
                             (L7 IP Hash Sticky Sessions)
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
  [ Node.js Cluster Worker 1 ] [ Node.js Cluster Worker 2 ] [ Node.js Cluster Worker N ]
    ├── REST API v1              ├── REST API v1              ├── REST API v1
    ├── Apollo GraphQL           ├── Apollo GraphQL           ├── Apollo GraphQL
    ├── SOAP ERP                 ├── SOAP ERP                 ├── SOAP ERP
    └── Socket.IO WS             └── Socket.IO WS             └── Socket.IO WS
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
  [ Redis Cluster Pub/Sub ]                              [ MongoDB Atlas Cluster ]
   ├── Distributed Locks (Redlock)                         ├── Replicas (Primary / Secondary)
   ├── Sliding Window Rate Limits                          ├── Compound & TTL Indexes
   └── Socket.IO Redis Adapter                             └── Aggregation Pipelines
```

---

## 2. Microservice Decomposition Strategy

The architecture is split into 12 domain-bounded context modules designed for seamless extraction into standalone microservices:

| Module | Primary Responsibility | Exposed Interfaces | Caching Strategy |
|---|---|---|---|
| **Auth** | User identity, JWT rotation, OTP, RBAC | REST, GraphQL | Redis Token Revocation List |
| **Properties** | PG listings, room grid, geo-search | REST, GraphQL | Redis Public Search Cache (TTL 300s) |
| **Residents** | Directory, KYC, gate pass, visitor pass | REST, GraphQL | Redis Resident Profile Cache |
| **Agreements** | Rental contracts, digital signatures | REST, GraphQL | Local S3 + HMAC Integrity Signatures |
| **Billing** | Invoices, Razorpay webhooks, SOAP ERP | REST, GraphQL, SOAP | Database Ledger + Webhook Idempotency |
| **Complaints** | Support ticketing, status transitions | REST, GraphQL, Sockets | Real-time WebSocket Broadcaster |
| **Notifications**| Email, SMS, Push notification queue | Events / Queue | BullMQ Async Processing |
| **Meals** | Meal plans, daily skip toggles | REST, GraphQL | Daily Redis Skip Roster |
| **Analytics** | MRR, occupancy rate, financial reports | REST, GraphQL | Worker Thread CPU Offloading |
| **Search** | Geo-spatial Haversine distance search | REST | Geohash Redis Indexing |
| **Media** | Safe image upload, MIME validation | REST | CDN + Storage Buckets |
| **Sockets** | Real-time presence & multi-room sync | WebSockets | Redis Adapter Multi-Instance Sync |

---

## 3. Threat Model (STRIDE Framework)

| Threat Category | Potential Risk | Mitigation in Architecture |
|---|---|---|
| **Spoofing** | JWT token theft or forged requests | Short-lived JWT access tokens + Refresh token rotation + `x-correlation-id` tracing |
| **Tampering** | Data modification in transit or storage | TLS 1.3 enforced + AES-256-GCM field encryption + HMAC SHA-256 signatures |
| **Repudiation** | Unverified agreement signatures or actions | `logAudit()` audit logger middleware recording user ID, action, IP, timestamp |
| **Information Disclosure**| Database error leaks or PII exposure | Global error masking, friendly user error messages, AES-256 PII encryption |
| **Denial of Service** | API request floods or slowloris attacks | NGINX rate limit zones + sliding window rate limiters + GraphQL depth limits |
| **Elevation of Privilege**| Unauthorized admin/owner endpoint access | Layered `authenticate` + `authorize(Role...)` RBAC middleware on all routes |

---

## 4. Operational & Observability Endpoints

- **`/health`**: Returns real-time DB latency, memory usage, service readiness, and uptime.
- **`/ready`**: Kubernetes readiness probe verifying container availability.
- **`/live`**: Kubernetes liveness probe checking container process health.
- **`/metrics`**: Prometheus metrics endpoint scraping memory, active workers, and process metrics.
- **`/api/docs`**: Interactive OpenAPI 3.0 Swagger UI documentation.



---

