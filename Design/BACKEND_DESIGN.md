# ⚙️ RoomBae Enterprise Backend Architecture & System Design (`BACKEND_DESIGN.md`)

> **Architectural Specification & Systems Design Document** for the RoomBae Zero-Trust MERN Enterprise Backend (Node.js + Express + TypeScript + Prisma ORM + MongoDB + Redis + GraphQL + SOAP).

---

## 🏛️ 1. High-Level Architecture Overview

The **RoomBae Backend** is an enterprise-grade micro-modular Node.js service engineered to support the RoomBae React 19 single-page application. It delivers a multi-protocol API layer (REST, GraphQL, SOAP ERP) coupled with zero-trust security, field-level encryption, distributed concurrency locks, and automated GST billing workflows.

```
                    ┌─────────────────────────────────────────┐
                    │      React 19 + Vite 6 Frontend         │
                    └──────────────────┬──────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   REST API (/api/v1/*)      GraphQL (/graphql)      SOAP ERP (/soap/billing)
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │     Express.js Server       │
                        │    (Security & Middleware)  │
                        └──────────────┬──────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
 Prisma ORM 5.x                 Redis 7.x Cache &             Razorpay & PDFKit
(MongoDB Atlas 7.0)            Distributed Redlock            Payment / Invoice
```

---

## 🔐 2. Zero-Trust Security Architecture

### 2.1 Cryptographic Standards & Field Encryption
- **AES-256-GCM Encryption**: Sensitive resident KYC payloads (Aadhaar number, PAN number, Bank account number, UPI IDs) are encrypted prior to database persistence. Each encrypted record stores the IV, authTag, and ciphertext.
- **Password Hashing**: Bcrypt with 12 salt rounds for local credential authentication.
- **JWT Authentication**:
  - **Access Token**: Short-lived 15-minute JWT signed with RS256/HS256. Passed via `Authorization: Bearer <token>`.
  - **Refresh Token**: Long-lived 7-day HTTP-Only SameSite cookie.

### 2.2 Network & Edge Security
- **IP Address Whitelisting & Filtering**: `express-ipfilter` checks client IP against security blacklists.
- **Strict Headers**: `helmet` enforces HSTS (`max-age=63072000`), CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **NoSQL & XSS Sanitization**: `express-mongo-sanitize` strips `$` and `.` operators from user inputs.

### 2.3 Distributed Bed Concurrency Locking (Redlock)
When simultaneous users attempt to reserve or pay for the same bed:
1. Redlock acquires a distributed lock on key `bed:lock:{bedId}` with a TTL of 30 seconds.
2. Successful transaction sets bed status to `OCCUPIED` and attaches `residentId`.
3. Competing requests fail lock acquisition and trigger an instant Razorpay refund (`razorpay.payments.refund()`).

---

## 🗄️ 3. Complete Prisma Data Model (`schema.prisma`)

The system manages 11 interconnected domain models in MongoDB Atlas:

```
+---------------+        +------------------+        +-----------------+
|     User      |------->|     Property     |------->|      Room       |
| (Owner/Res)   | 1    * |                  | 1    * |                 |
+---------------+        +------------------+        +-----------------+
        |                         |                           |
        | 1                       | 1                         | 1
        v *                       v *                         v *
+---------------+        +------------------+        +-----------------+
|   AuditLog    |        |     Resident     |<-------|       Bed       |
+---------------+        +------------------+ 1    1 +-----------------+
                                  |
         +------------------------+------------------------+
         | 1                    1 |                      1 |
         v *                      v *                      v *
+-----------------+      +------------------+      +-------------------+
|     Payment     |      |    Complaint     |      | Visitor/GatePass  |
+-----------------+      +------------------+      +-------------------+
```

### Models & Schema Overview
1. **`User`**: System accounts (`email`, `passwordHash`, `residentCode`, `googleSubId`, `role` enum: `PUBLIC`, `RESIDENT`, `OWNER`, `ADMIN`, `is2FAEnabled`, `otpSecret`).
2. **`Property`**: PG properties (`name`, `address`, `city`, `pincode`, `latitude`, `longitude`, `gstin`, `totalRooms`, `totalBeds`, `amenities`, `images`).
3. **`Room`**: Rooms per property (`roomNumber`, `floor`, `roomType` enum: `SINGLE`, `DOUBLE`, `TRIPLE`, `SUITE`, `rentAmount`).
4. **`Bed`**: Individual bed inventory (`bedNumber`, `isOccupied`, `lockExpiresAt`).
5. **`Resident`**: Resident profiles (`idProofNumber`, `encryptedKycData`, `emergencyContact`, `moveInDate`, `rentDueDate`, `status`).
6. **`Payment`**: GST invoices & transactions (`invoiceNumber`, `baseAmount`, `cgstAmount`, `sgstAmount`, `igstAmount`, `totalAmount`, `paymentMethod`, `status`, `razorpayOrderId`, `pdfUrl`).
7. **`Complaint`**: Helpdesk tickets (`ticketCode`, `category`, `title`, `description`, `priority` enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, `status` enum: `OPEN`, `IN_PROGRESS`, `RESOLVED`).
8. **`VisitorPass`**: Visitor passes (`passCode`, `visitorName`, `visitorMobile`, `visitDate`, `qrCodeData`, `status`).
9. **`GatePass`**: Outing passes (`passCode`, `passType`, `destination`, `departureTime`, `returnTime`, `status`).
10. **`MealSkip`**: Daily meal skips (`date`, `mealType`: `Breakfast`, `Lunch`, `Dinner`).
11. **`AuditLog`**: System audit trail (`action`, `ipAddress`, `userAgent`, `details`, `timestamp`).

---

## 🌐 4. API Endpoints & Interfaces

### 4.1 REST API Routes (`/api/v1`)

#### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticates credentials & returns JWT + Refresh cookie.
- `POST /register`: Registers new property owners or initial resident accounts.
- `POST /send-otp`: Sends 6-digit OTP via Email/SMS.
- `POST /verify-otp`: Validates OTP code.
- `GET /google`: Triggers Google OAuth 2.0 flow.
- `POST /logout`: Revokes refresh token in Redis.

#### Properties (`/api/v1/properties`)
- `GET /public`: Geo-spatial property discovery search with Nominatim Haversine distance, city, and rent range filters.
- `GET /:id`: Retrieves single PG property details and room/bed matrix.
- `POST /`: Owner endpoint to create property and auto-generate room/bed matrix.
- `GET /owner/summary`: Aggregates owner MRR, occupancy rate, total revenue, and pending dues.

#### Residents (`/api/v1/residents`)
- `POST /onboard`: Submits 5-step KYC registration with AES-256-GCM encrypted payload.
- `GET /directory`: Owner search and directory filter.
- `GET /portal/me`: Resident self-service portal data dataset.
- `POST /portal/visitor-pass`: Generates visitor pass with encrypted QR payload.
- `POST /portal/gate-pass`: Submits outing gate pass.
- `POST /portal/meal-skip`: Toggles meal skip status.

#### Billing & Invoices (`/api/v1/billing`)
- `POST /create-order`: Initiates Razorpay Order and acquires Redlock bed lock.
- `POST /verify-payment`: Validates Razorpay HMAC-SHA256 signature, updates invoice status to `PAID`, and marks bed `OCCUPIED`.
- `GET /invoices/:id/download`: Streams official GST Tax Invoice PDF generated via PDFKit.

#### Complaints (`/api/v1/complaints`)
- `GET /`: Lists tickets filtered by priority, status, or property.
- `POST /`: Submits new complaint ticket (`TICK-xxx`).
- `PATCH /:id/status`: Updates ticket status (`OPEN` → `IN_PROGRESS` → `RESOLVED`).

---

### 4.2 GraphQL Interface (`/graphql`)
- **Server**: Apollo Server v4 mounted on Express middleware.
- **Queries**: `getOwnerMetrics`, `searchPublicProperties`, `getResidentPortal`, `listComplaints`.
- **Mutations**: `loginUser`, `onboardResident`, `updateComplaintStatus`, `createVisitorPass`.

---

### 4.3 Enterprise SOAP ERP Interface (`/soap/billing?wsdl`)
- **Server**: Built with `node-soap`.
- **WSDL Definition**: Exposes XML endpoints for enterprise ERP accounting systems.
- **Methods**: `GetInvoiceDetails`, `ProcessBulkReconciliation`.

---

## 🧾 5. GST Tax Invoicing & PDF Engine

- **Automated Tax Calculation**:
  - Intrastate transactions: **CGST (9%) + SGST (9%)** = 18%.
  - Interstate transactions: **IGST (18%)**.
- **PDFKit Stream Generator**:
  - Dynamically builds PDF stream in memory.
  - Formats header, business GSTIN, resident details, itemized rent charges, tax breakdown, and digital signature stamp.

---

## 🛡️ 6. Resilience & Graceful Fallback Architecture

1. **Database Fallback Handler**:
   - If MongoDB Atlas credentials are pending or unauthenticated, services gracefully catch database errors and return valid fallback payloads so authentication and public search routes remain 100% operational.
2. **Redis Stub Cache**:
   - Includes a graceful in-memory stub fallback if a live Redis instance is offline.
3. **Global Error Middleware**:
   - Catches all operational `AppError` exceptions and unhandled promise rejections, returning standardized JSON responses (`{ success: false, code, message }`).
