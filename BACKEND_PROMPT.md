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

## 3. 🔐 ZERO-TRUST SECURITY ARCHITECTURE

### A. Dedicated Server & Network Hardening
1. **IP Binding & Proxy Verification**: Bind Express server to local socket / reverse proxy. Extract client IP using trusted `X-Forwarded-For` and `X-Real-IP` headers behind NGINX / Cloudflare.
2. **IP Whitelisting & Blacklisting**: Enforce `express-ipfilter` to instantly block known malicious proxies, TOR exit nodes, and abusive IP ranges.
3. **Transport Security (TLS 1.3 & HSTS)**: Enforce HTTP Strict Transport Security (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and strict CSP headers via `helmet`.

### B. CIA Triad Implementation
- **Confidentiality**: Field-level AES-256-GCM encryption for sensitive resident data (Aadhaar number, PAN number, Bank Account details, UPI IDs). Store IV and authTag alongside encrypted payloads.
- **Integrity**: RSA-2048 digital signatures for e-agreements and document verifications. Validate webhook payload signatures using HMAC-SHA256.
- **Availability**: Redis-backed rate limiting (100 requests per 15 minutes per IP for general routes; 5 attempts per 15 minutes for auth/OTP routes).

### C. Concurrency Locks (Redlock Algorithm)
When multiple users attempt to book or pay for the **exact same room/bed** simultaneously:
1. Acquire a distributed lock on `bed:lock:{bedId}` using Redlock algorithm with a TTL of 30 seconds.
2. If payment succeeds for Request A, mark the bed as `OCCUPIED` and link `residentId`.
3. Concurrently executing Request B detects lock failure or occupied state, aborts the booking transaction, and triggers an automatic instant refund via `razorpay.payments.refund()`.

---

## 4. 🗄 PRISMA SCHEMA (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PUBLIC
  RESIDENT
  OWNER
  ADMIN
}

enum RoomType {
  SINGLE
  DOUBLE
  TRIPLE
  SUITE
}

enum BedStatus {
  AVAILABLE
  OCCUPIED
  LOCKED_FOR_BOOKING
  MAINTENANCE
}

enum PaymentStatus {
  PAID
  PENDING
  OVERDUE
  FAILED
  REFUNDED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
}

enum PassStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

model User {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  email            String       @unique
  passwordHash     String?
  name             String
  residentCode     String?      @unique // e.g. "RES1001"
  googleSubId      String?      @unique
  avatarUrl        String?
  role             Role         @default(PUBLIC)
  phone            String?
  is2FAEnabled     Boolean      @default(true)
  otpSecret        String?
  otpExpiresAt     DateTime?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  properties       Property[]
  residents        Resident[]
  auditLogs        AuditLog[]
}

model Property {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  ownerId          String       @db.ObjectId
  owner            User         @relation(fields: [ownerId], references: [id])
  name             String
  address          String
  city             String
  pincode          String
  latitude         Float
  longitude        Float
  gstin            String?
  totalRooms       Int
  totalBeds        Int
  amenities        String[]
  images           String[]
  rooms            Room[]
  residents        Resident[]
  payments         Payment[]
  complaints       Complaint[]
  visitorPasses    VisitorPass[]
  gatePasses       GatePass[]
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}

model Room {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  propertyId       String       @db.ObjectId
  property         Property     @relation(fields: [propertyId], references: [id])
  roomNumber       String
  floor            Int
  roomType         RoomType
  rentAmount       Float
  status           BedStatus    @default(AVAILABLE)
  beds             Bed[]
  createdAt        DateTime     @default(now())
}

model Bed {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  roomId           String       @db.ObjectId
  room             Room         @relation(fields: [roomId], references: [id])
  bedNumber        String
  isOccupied       Boolean      @default(false)
  lockExpiresAt    DateTime?
  resident         Resident?
}

model Resident {
  id               String        @id @default(auto()) @map("_id") @db.ObjectId
  userId           String        @db.ObjectId
  user             User          @relation(fields: [userId], references: [id])
  propertyId       String        @db.ObjectId
  property         Property      @relation(fields: [propertyId], references: [id])
  bedId            String        @unique @db.ObjectId
  bed              Bed           @relation(fields: [bedId], references: [id])
  idProofNumber    String        // Plain/masked for query
  idProofUrl       String?
  encryptedKycData String?       // AES-256-GCM payload (Aadhaar, PAN, Guardian, Bank)
  emergencyContact String
  emergencyName    String?
  bloodGroup       String?
  occupation       String?
  companyCollege   String?
  moveInDate       DateTime
  rentDueDate      DateTime
  status           String        @default("ACTIVE")
  payments         Payment[]
  complaints       Complaint[]
  visitorPasses    VisitorPass[]
  gatePasses       GatePass[]
  mealSkips        MealSkip[]
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

model Payment {
  id                String        @id @default(auto()) @map("_id") @db.ObjectId
  residentId        String        @db.ObjectId
  resident          Resident      @relation(fields: [residentId], references: [id])
  propertyId        String        @db.ObjectId
  property          Property      @relation(fields: [propertyId], references: [id])
  invoiceNumber     String        @unique // e.g. "INV-2025-089"
  baseAmount        Float
  cgstAmount        Float
  sgstAmount        Float
  igstAmount        Float
  lateFee           Float         @default(0)
  totalAmount       Float
  paymentDate       DateTime      @default(now())
  dueDate           DateTime
  paymentMethod     String        // "UPI", "RAZORPAY", "NETBANKING", "CASH"
  status            PaymentStatus @default(PENDING)
  razorpayOrderId   String?
  razorpayPaymentId String?
  razorpaySignature String?
  razorpayRefundId  String?
  clientIp          String?
  clientGeoLocation String?
  pdfUrl            String?
  createdAt         DateTime      @default(now())
}

model Complaint {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  ticketCode       String       @unique // e.g. "TICK-402"
  residentId       String       @db.ObjectId
  resident         Resident     @relation(fields: [residentId], references: [id])
  propertyId       String       @db.ObjectId
  property         Property     @relation(fields: [propertyId], references: [id])
  category         String       // "Plumbing", "WiFi / Internet", "Electrical", "Housekeeping"
  title            String
  description      String
  priority         Priority     @default(MEDIUM)
  status           TicketStatus @default(OPEN)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}

model VisitorPass {
  id               String     @id @default(auto()) @map("_id") @db.ObjectId
  passCode         String     @unique // e.g. "VP-801"
  residentId       String     @db.ObjectId
  resident         Resident   @relation(fields: [residentId], references: [id])
  propertyId       String     @db.ObjectId
  property         Property   @relation(fields: [propertyId], references: [id])
  visitorName      String
  visitorMobile    String
  relation         String
  visitDate        DateTime
  timeSlot         String
  qrCodeData       String     // Encrypted QR verification token
  status           PassStatus @default(APPROVED)
  createdAt        DateTime   @default(now())
}

model GatePass {
  id               String     @id @default(auto()) @map("_id") @db.ObjectId
  passCode         String     @unique // e.g. "GP-104"
  residentId       String     @db.ObjectId
  resident         Resident   @relation(fields: [residentId], references: [id])
  propertyId       String     @db.ObjectId
  property         Property   @relation(fields: [propertyId], references: [id])
  passType         String     // "Weekend Outing", "Night Out"
  destination      String
  departureTime    DateTime
  returnTime       DateTime
  reason           String?
  status           PassStatus @default(APPROVED)
  createdAt        DateTime   @default(now())
}

model MealSkip {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  residentId       String   @db.ObjectId
  resident         Resident @relation(fields: [residentId], references: [id])
  date             DateTime
  mealType         String   // "Breakfast", "Lunch", "Dinner"
  createdAt        DateTime @default(now())
}

model AuditLog {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  userId           String?  @db.ObjectId
  user             User?    @relation(fields: [userId], references: [id])
  action           String
  ipAddress        String
  userAgent        String
  details          String
  timestamp        DateTime @default(now())
}
```

---

## 5. 🌐 API ENDPOINTS & PROTOCOL SPECIFICATIONS

### A. Authentication API (`/api/v1/auth`)
- `POST /login`: Supports credentials login (`email`/`password` or `residentCode`/`password`). Generates 15m Access JWT & HTTP-Only Refresh Cookie.
- `POST /register`: Registers property owners or initiates resident onboarding.
- `POST /send-otp`: Dispatches 6-digit cryptographic OTP via Nodemailer (Email) and SMS gateway (WebOTP format: `@roombae.com #123456`).
- `POST /verify-otp`: Validates OTP and returns authenticated session token.
- `GET /google`: Triggers Passport Google OAuth 2.0 flow.
- `POST /logout`: Revokes Refresh Token in Redis and clears cookies.

### B. Property & Geo Discovery API (`/api/v1/properties`)
- `GET /public`: Geo-spatial query using Nominatim OSM lat/lng distance calculation, price range filtering, type filters (`Men's`, `Women's`, `Mixed`), and pagination.
- `GET /:id`: Returns full PG details, room breakdown, reviews, amenities, and available bed count.
- `POST /`: Owner endpoint to create property with total rooms, beds, lat/lng, and GSTIN.
- `GET /owner/summary`: Aggregates live owner metrics (MRR, total revenue, occupancy rate %, active complaints, pending dues).

### C. Resident Onboarding & Portal API (`/api/v1/residents`)
- `POST /onboard`: 5-Step KYC onboarding submission. Encrypts Aadhaar/PAN and bank data via AES-256-GCM.
- `GET /directory`: Owner search & filter endpoint for resident directory.
- `GET /portal/me`: Resident portal data endpoint returning profile, roommate details, Wi-Fi credentials, invoices, and meal schedule.
- `POST /portal/visitor-pass`: Generates a digital visitor pass with an encrypted QR token payload.
- `POST /portal/gate-pass`: Submits outing gate pass request.
- `POST /portal/meal-skip`: Toggles meal skip for credit calculations.

### D. Billing, Razorpay & GST PDF API (`/api/v1/billing`)
- `POST /create-order`: Initiates Razorpay Order for rent payment. Acquires Redlock lock on `bed:lock:{bedId}`.
- `POST /verify-payment`: Validates Razorpay HMAC-SHA256 signature, updates invoice status to `PAID`, marks bed `OCCUPIED`, and sends WhatsApp/Email receipt.
- `GET /invoices/:id/download`: PDFKit stream generating official GST Tax Invoice PDF with CGST (9%) + SGST (9%) or IGST (18%).

### E. Complaints API (`/api/v1/complaints`)
- `GET /`: List complaints filtered by priority, status (`OPEN`, `IN_PROGRESS`, `RESOLVED`), or property.
- `POST /`: Submit new complaint ticket (`TICK-xxx`).
- `PATCH /:id/status`: Update complaint ticket status and record audit log.

### F. Dual Protocol Interfaces
1. **GraphQL Interface (`/graphql`)**: `@apollo/server` endpoint handling complex queries for multi-property analytics, resident listings, and real-time dashboard updates with strict depth and complexity limits.
2. **SOAP ERP Interface (`/soap/billing?wsdl`)**: Enterprise SOAP billing service built with `node-soap` exposing WSDL methods for enterprise accounting reconciliation (`GetInvoiceDetails`, `ProcessBulkReconciliation`).

---

## 6. 🛠 IMPLEMENTATION RULES & INSTRUCTIONS FOR AI

1. **Strict TypeScript & Zero Unsafe Casts**: All request handlers, Prisma queries, and GraphQL resolvers must be 100% type-safe.
2. **Error Handling Middleware**: Implement global async error handling with structured JSON responses (`{ success: false, code, message, error }`).
3. **Audit Logging**: Every sensitive action (login, status change, refund, payment, KYC upload) must create an `AuditLog` record with client IP and User-Agent.
4. **Environment Configuration**: Validate all environment variables (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `AES_256_KEY`) using `zod` at startup.

---

## 7. 🚀 DELIVERABLE EXPECTATIONS

Generate the complete, runnable Node.js + Express + TypeScript backend codebase structure including:
- `prisma/schema.prisma`
- `src/server.ts`, `src/app.ts`
- `src/config/` (env validation, redis, prisma)
- `src/middleware/` (auth, ipFilter, rateLimit, error, audit)
- `src/services/` (razorpay, crypto, pdfGenerator, soapServer)
- `src/graphql/` (schema, resolvers)
- `src/controllers/` & `src/routes/` (auth, properties, residents, billing, complaints)

Begin by analyzing the architecture requirements and generating the complete backend solution!
