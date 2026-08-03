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
