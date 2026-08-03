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
