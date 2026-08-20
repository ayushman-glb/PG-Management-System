# 🔌 RoomBae Enterprise API Architecture & Communication Specification (`api_design.md`)

> **Authoritative Technical Architecture Document** covering the end-to-end communication lifecycle, REST v1 API catalog, SOAP ERP billing engine, Socket.IO WebSockets real-time subsystem, Prisma ORM data layer, MongoDB Atlas schema, security pipelines, and complete frontend-to-backend mappings for **RoomBae**.

---

## 📑 Table of Contents

1. [API Architecture Overview](#1-api-architecture-overview)
2. [Complete Communication Architecture](#2-complete-communication-architecture)
3. [Local Development Architecture](#3-local-development-architecture)
4. [Production Architecture](#4-production-architecture)
5. [API Base URL & Client Configuration](#5-api-base-url--client-configuration)
6. [Frontend Page → Backend API Mapping](#6-frontend-page--backend-api-mapping)
7. [Feature-wise API Documentation](#7-feature-wise-api-documentation)
   - 7.1 [Authentication & Session Lifecycle (`/api/v1/auth`)](#71-authentication--session-lifecycle-apiv1auth)
   - 7.2 [Phone OTP Subsystem (`/api/v1/auth/phone`)](#72-phone-otp-subsystem-apiv1authphone)
   - 7.3 [Device Security & FingerprintJS (`/api/v1/security/devices`)](#73-device-security--fingerprintjs-apiv1securitydevices)
   - 7.4 [Owner Onboarding & Management (`/api/v1/owners` & `/api/v1/onboarding`)](#74-owner-onboarding--management-apiv1owners--apiv1onboarding)
   - 7.5 [Properties & Public Marketplace (`/api/v1/properties`)](#75-properties--public-marketplace-apiv1properties)
   - 7.6 [Rooms Management & Transfers (`/api/v1/rooms`)](#76-rooms-management--transfers-apiv1rooms)
   - 7.7 [Beds Inventory & Hold Locks (`/api/v1/beds`)](#77-beds-inventory--hold-locks-apiv1beds)
   - 7.8 [Residents & Resident Portal (`/api/v1/residents`)](#78-residents--resident-portal-apiv1residents)
   - 7.9 [Billing & Fines Subsystem (`/api/v1/billing`)](#79-billing--fines-subsystem-apiv1billing)
   - 7.10 [Payments & Razorpay Transactions (`/api/v1/payments`)](#710-payments--razorpay-transactions-apiv1payments)
   - 7.11 [Complaints & Maintenance Support (`/api/v1/complaints` & `/api/v1/support`)](#711-complaints--maintenance-support-apiv1complaints--apiv1support)
   - 7.12 [Agreements & Digital Signatures (`/api/v1/agreements`)](#712-agreements--digital-signatures-apiv1agreements)
   - 7.13 [Centralized Document Downloads (`/api/v1/documents`)](#713-centralized-document-downloads-apiv1documents)
   - 7.14 [Search & Marketplace Filters (`/api/v1/search`)](#714-search--marketplace-filters-apiv1search)
   - 7.15 [Analytics & Revenue Intelligence (`/api/v1/analytics`)](#715-analytics--revenue-intelligence-apiv1analytics)
   - 7.16 [Notifications Subsystem (`/api/v1/notifications`)](#716-notifications-subsystem-apiv1notifications)
   - 7.17 [Marketing Campaigns & Email Broadcasts (`/api/v1/marketing`)](#717-marketing-campaigns--email-broadcasts-apiv1marketing)
   - 7.18 [Marketplace Tours & Shortlists (`/api/v1/tours` & `/api/v1/shortlist`)](#718-marketplace-tours--shortlists-apiv1tours--apiv1shortlist)
   - 7.19 [Rental Applications & Lease Approvals (`/api/v1/applications`)](#719-rental-applications--lease-approvals-apiv1applications)
   - 7.20 [Tenant-Owner Realtime Messaging (`/api/v1/messages`)](#720-tenant-owner-realtime-messaging-apiv1messages)
   - 7.21 [Move-In Coordination & Key Handover (`/api/v1/move-in`)](#721-move-in-coordination--key-handover-apiv1move-in)
   - 7.22 [Media & File Assets (`/api/v1/media` & `/api/v1/upload`)](#722-media--file-assets-apiv1media--apiv1upload)
   - 7.23 [Dashboard Aggregates (`/api/v1/dashboard`)](#723-dashboard-aggregates-apiv1dashboard)
   - 7.24 [System Settings & Admin Verification (`/api/v1/settings`)](#724-system-settings--admin-verification-apiv1settings)
   - 7.25 [SOAP ERP Billing Service (`/soap/billing`)](#725-soap-erp-billing-service-soapbilling)
   - 7.26 [System Health, Telemetry & JWKS (`/health`, `/ready`, `/live`, `/metrics`, `/.well-known/jwks.json`)](#726-system-health-telemetry--jwks)
8. [CRUD Operation Matrix](#8-crud-operation-matrix)
9. [Request Lifecycle Pipeline](#9-request-lifecycle-pipeline)
10. [Response Lifecycle & Envelope Contracts](#10-response-lifecycle--envelope-contracts)
11. [Authentication & Session Security Flow](#11-authentication--session-security-flow)
12. [Middleware Execution Order](#12-middleware-execution-order)
13. [Database Communication & Prisma ORM Layer](#13-database-communication--prisma-orm-layer)
14. [Socket.IO + REST Integration Architecture](#14-socketio--rest-integration-architecture)
15. [Third-Party API Integrations](#15-third-party-api-integrations)
16. [API Security Architecture](#16-api-security-architecture)
17. [Complete API Inventory Master Catalog](#17-complete-api-inventory-master-catalog)
18. [Folder-to-Communication Architecture Mapping](#18-folder-to-communication-architecture-mapping)
19. [Environment Variable Matrix](#19-environment-variable-matrix)
20. [Appendix: Standards, Conventions & Formats](#20-appendix-standards-conventions--formats)

---

## 1. API Architecture Overview

RoomBae is architected as an **enterprise-grade, multi-tenant PG & Coliving management ecosystem** combining high-throughput REST APIs, bidirectional Socket.IO WebSockets, and an enterprise SOAP ERP bridge.

### Core Architectural Pillars

```mermaid
graph TD
    Client["Client Tier<br/>(React 19 + Vite + TypeScript)"]
    Gateway["Express Gateway & Security Pipeline<br/>(CORS, Helmet, RateLimiter, MongoSanitize, HPP)"]
    AuthModule["Security & Auth Engine<br/>(RS256 JWT, Double-Submit CSRF, FingerprintJS, TokenVersion)"]
    ServiceLayer["Modular Domain Services<br/>(Auth, Billing, Residents, Properties, Documents)"]
    RepoLayer["Repository Pattern Layer<br/>(Prisma Data Access Abstraction)"]
    Database["MongoDB Atlas ReplicaSet<br/>(Document Database, JSON Documents)"]
    Realtime["Socket.IO Server<br/>(Engine.IO Transport, Redis-Free Channel Multiplexing)"]
    ThirdParty["External Providers<br/>(Razorpay, Cloudinary, Twilio, Brevo, Google OAuth)"]

    Client -->|HTTPS REST API / JSON| Gateway
    Client <-->|WSS WebSockets| Realtime
    Gateway --> AuthModule
    AuthModule --> ServiceLayer
    ServiceLayer --> RepoLayer
    RepoLayer --> Database
    ServiceLayer --> Realtime
    ServiceLayer --> ThirdParty
```

1. **REST Protocol Standard**: All transactional operations follow RESTful conventions over HTTPS, consuming and returning UTF-8 encoded JSON payloads.
2. **Stateless Authentication**: Core access tokens use asymmetric **RS256 (RSA-2048) JWTs** (with graceful HS256 fallback) validated via in-memory caching and public `/.well-known/jwks.json`. Refresh tokens are opaque 256-bit cryptographic strings stored in secure, `httpOnly`, `SameSite=None/Lax` cookies with SHA-256 hashed database verification and automatic family reuse detection.
3. **Multi-Tenant Isolation**: Every authenticated request passes through the `tenantMiddleware`, which extracts tenant/user context and binds database queries to the requesting owner's PG property or resident code.
4. **Authoritative Consistency (Redis-Free)**: Token invalidation and session revocation operate on an authoritative `User.tokenVersion` stored in MongoDB Atlas, with an in-memory 10-second fast-path cache. Distributed holds use optimistic locking and database timestamps (`lockExpiresAt`).
5. **Separation of Concerns**: Strict architectural isolation between `Routes` -> `Middleware` -> `Controllers` -> `Services` -> `Repositories` -> `Prisma Client` -> `MongoDB`.

---

## 2. Complete Communication Architecture

Every interaction from the user interface flows through a deterministic multi-tier pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser (React)
    participant UI as Component / Hook
    participant ApiClient as ApiClient (Fetch Engine)
    participant Express as Express Gateway
    participant Security as Security Pipeline
    participant Auth as Auth & CSRF Guard
    participant Controller as Domain Controller
    participant Service as Business Service
    participant Repo as Prisma Repository
    participant DB as MongoDB Atlas
    participant Socket as Socket.IO Engine

    User->>UI: Triggers UI Action (e.g. Pay Rent / Book Bed)
    UI->>ApiClient: Invokes Service Method (e.g. billingService.createBillingOrder)
    ApiClient->>ApiClient: Injects In-Memory JWT & X-Visitor-Id & X-CSRF-Token
    ApiClient->>Express: HTTPS POST /api/v1/payments/create-order
    Express->>Security: Helmet, CORS, RateLimiter, MongoSanitize, HPP
    Security->>Auth: Verify RS256 JWT, TokenVersion & Double-Submit CSRF
    Auth->>Controller: PaymentController.createOrder(req, res)
    Controller->>Service: PaymentService.createOrder(userId, amount, pgId)
    Service->>Repo: PaymentRepository.create(paymentRecord)
    Repo->>DB: Prisma.payment.create({ data })
    DB-->>Repo: Saved Document
    Repo-->>Service: Payment Entity
    Service->>Socket: SocketServer.emitToUser(userId, 'billing:payment_received')
    Service-->>Controller: Verified Result
    Controller-->>Express: ApiResponse.success(res, "Order created", data, 201)
    Express-->>ApiClient: 201 Created { success: true, data: { ... } }
    ApiClient-->>UI: Resolves Promise with Typed Data
    UI->>User: Updates UI State & Triggers Modal Flow
```

### Detailed Layer Responsibilities

| Tier / Layer | File Location | Responsibility |
| :--- | :--- | :--- |
| **React View / Page** | `frontend/src/features/*/pages/` | Renders dynamic UI, consumes React state, handles view events. |
| **Custom React Hook** | `frontend/src/hooks/` | Encapsulates async states, debouncing, loading skeletons, and real-time listeners. |
| **Frontend API Client** | `frontend/src/services/api.ts` | Centralized `fetch` wrapper; manages in-memory JWT injection, 401 token refresh queue, CSRF headers, and error parsing. |
| **Express Router** | `backend/src/routes/apiRouter.ts` | Dispatches URLs to modular route handlers (`/auth`, `/owners`, `/properties`, etc.). |
| **Security Middleware** | `backend/src/middleware/` | Executes Helmet CSP, CORS origin validation, Rate Limiting, MongoSanitizer, and HPP parameter pollution guards. |
| **Domain Controller** | `backend/src/modules/*/controller.ts` | Unpacks `req.body`, `req.params`, `req.query`, validates DTO schemas via Zod, and formats `ApiResponse`. |
| **Domain Service** | `backend/src/modules/*/service.ts` | Executes business logic, pricing computations, access control assertions, document triggers, and third-party API calls. |
| **Repository** | `backend/src/modules/*/repository.ts` | Isolates Prisma ORM calls, manages multi-document transactions (`prisma.$transaction`), aggregation pipelines, and sorting. |
| **Prisma ORM Client** | `backend/src/config/prisma.ts` | Generates type-safe MongoDB queries, manages native connection pooling. |
| **MongoDB Atlas** | Cloud MongoDB ReplicaSet | Persists BSON collections, sparse indexes, unique compound constraints, and audit trails. |

---

## 3. Local Development Architecture

In local development, the full system runs locally across distinct ports with hot-reloading enabled.

```mermaid
graph LR
    FrontendDev["Vite Dev Server<br/>http://localhost:5173"]
    BackendDev["Express Node.js Server<br/>http://localhost:5000"]
    MongoDev["MongoDB Atlas Cluster<br/>pgm.7dp53y4.mongodb.net"]
    SocketDev["Socket.IO Server<br/>ws://localhost:5000"]

    FrontendDev -->|API: /api/v1| BackendDev
    FrontendDev <-->|WebSocket Stream| SocketDev
    BackendDev -->|Mongoose/Prisma TLS| MongoDev
```

### Local Endpoint & URL Configuration

| Component | Target URL | Protocol | Configuration Variable |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:5173` | HTTP / HMR | `VITE_FRONTEND_URL`, `CLIENT_URL` |
| **Backend REST API** | `http://localhost:5000/api/v1` | HTTP / JSON | `VITE_API_BASE_URL`, `API_PREFIX` |
| **Backend Server Root** | `http://localhost:5000` | HTTP | `API_BASE_URL`, `PORT=5000` |
| **Socket.IO Realtime** | `ws://localhost:5000` (Engine.IO) | WebSocket | `VITE_SOCKET_URL`, `SOCKET_URL` |
| **Swagger UI Docs** | `http://localhost:5000/api/docs` | HTTP / HTML | Non-production routes |
| **SOAP WSDL Endpoint** | `http://localhost:5000/soap/billing?wsdl` | HTTP / XML | `SOAP_BILLING_API_KEY` |
| **Public JWKS Keys** | `http://localhost:5000/.well-known/jwks.json` | HTTP / JSON | Asymmetric Key Service |

### Local Environment Variables (`backend/.env.development` & `frontend/.env.development`)

- `PORT=5000`: Local Express server port.
- `NODE_ENV=development`: Enables verbose error traces, Swagger UI, and development OTP headers.
- `DATABASE_URL`: MongoDB Atlas TLS connection string pointing to the `roombae-db` database.
- `CLIENT_URL="http://localhost:5173"`: Permitted CORS origin for local frontend requests.
- `VITE_API_BASE_URL=http://localhost:5000/api/v1`: Base endpoint for frontend client calls.

---

## 4. Production Architecture

In production, the frontend is deployed as a single-page application on **GitHub Pages**, communicating securely with the backend hosted on **Render** backed by **MongoDB Atlas**, **Cloudinary CDN**, **Twilio SMS**, **Brevo SMTP**, and **Razorpay**.

```mermaid
graph TD
    GH["GitHub Pages<br/>https://ayushman-glb.github.io/PG-Management-System"]
    Render["Render Web Service<br/>https://pg-management-system-boxb.onrender.com"]
    Atlas["MongoDB Atlas ReplicaSet<br/>pgm.7dp53y4.mongodb.net/roombae-db"]
    Cloudinary["Cloudinary CDN<br/>RoomBae-Production"]
    RazorpayAPI["Razorpay Live Gateway<br/>api.razorpay.com"]
    TwilioAPI["Twilio Programmable SMS<br/>api.twilio.com"]
    BrevoSMTP["Brevo SMTP / Transactional Mail<br/>smtp-relay.brevo.com"]

    GH -->|HTTPS REST Requests / Credentials Included| Render
    GH <-->|WSS Secure WebSockets| Render
    Render -->|TLS Encrypted Connection| Atlas
    Render -->|Media Upload & PDF Streaming| Cloudinary
    Render -->|Order Creation & HMAC Verification| RazorpayAPI
    Render -->|SMS OTP Dispatch| TwilioAPI
    Render -->|Transactional HTML Email| BrevoSMTP
```

### Production Endpoint Matrix

| Component | Production URL | Security & Protocol |
| :--- | :--- | :--- |
| **Production Frontend** | `https://ayushman-glb.github.io/PG-Management-System` | HTTPS / TLS 1.3 / Strict CSP |
| **Production Backend** | `https://pg-management-system-boxb.onrender.com` | HTTPS / TLS 1.3 / Reverse Proxy |
| **API Base URL** | `https://pg-management-system-boxb.onrender.com/api/v1` | HTTPS / JSON / CORS restricted |
| **Socket.IO Engine** | `wss://pg-management-system-boxb.onrender.com` | WSS Secure WebSockets |
| **Google OAuth Callback** | `https://pg-management-system-boxb.onrender.com/api/v1/auth/google/callback` | HTTPS OAuth 2.0 State-verified |
| **SOAP ERP Billing** | `https://pg-management-system-boxb.onrender.com/soap/billing` | HTTPS / XML / `X-API-Key` Guarded |

### Production Security Hardening
- **Cross-Origin Resource Sharing (CORS)**: Strict origin whitelisting allowing only `https://ayushman-glb.github.io` with `credentials: true`.
- **HTTP Strict Transport Security (HSTS)**: `max-age=31536000; includeSubDomains; preload` enforced on all responses.
- **Cookies**: `SameSite=None; Secure; HttpOnly; Path=/` for cross-site cookie transmission between GitHub Pages and Render.
- **NoSQL Injection Sanitization**: `express-mongo-sanitize` strips any payload keys starting with `$` or containing `.`.

---

## 5. API Base URL & Client Configuration

The frontend consumes backend APIs through a dedicated `ApiClient` singleton located in `frontend/src/services/api.ts` and initialized via `frontend/src/config/api.ts` and `frontend/src/config/env.ts`.

### Dynamic Base URL Resolution (`frontend/src/config/env.ts`)

```typescript
const isDev = import.meta.env.DEV ?? import.meta.env.MODE === "development";
const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const PROD_API_URL = "https://pg-management-system-boxb.onrender.com/api/v1";
const PROD_SOCKET_URL = "https://pg-management-system-boxb.onrender.com";

export const env = {
  API_URL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (isLocalhost || isDev ? "http://localhost:5000/api/v1" : PROD_API_URL),
  SOCKET_URL:
    import.meta.env.VITE_SOCKET_URL ||
    (isLocalhost || isDev ? "http://localhost:5000" : PROD_SOCKET_URL),
  MODE: import.meta.env.MODE ?? (isDev ? "development" : "production"),
  IS_DEV: isDev,
  IS_PROD: !isDev,
};
```

### Core API Client Architecture (`frontend/src/services/api.ts`)

```typescript
class ApiClient {
  public async request<T = any>(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<T> {
    const token = authService.getToken(); // In-memory token access (No localStorage)
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Attach FingerprintJS Device Identity Header
    try {
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      if (identity?.visitorId) {
        headers["X-Visitor-Id"] = identity.visitorId;
      }
    } catch { /* graceful fallback */ }

    let res: Response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Enables HttpOnly refreshToken transmission
    });

    // Automatic Token Refresh Queue Interceptor on 401 Unauthorized
    if (res.status === 401 && !isRetry && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      try {
        const refreshed = await authService.refreshToken();
        if (refreshed?.accessToken) {
          authService.setToken(refreshed.accessToken);
          return this.request<T>(endpoint, options, true); // Replay original request
        }
      } catch {
        authService.clearToken();
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error ${res.status}`);
    }

    return await res.json();
  }
}
```

---

## 6. Frontend Page → Backend API Mapping

The following comprehensive matrix maps every React page, component, custom hook, HTTP method, and backend controller across RoomBae:

| Frontend Page | Triggering Component / Hook | Custom Hook / Service Method | Method | API Endpoint | Backend Controller & Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth (`/auth`)** | `LoginForm` | `useAuth().login` / `authService.login()` | `POST` | `/api/v1/auth/login` | `AuthController.login` |
| **Auth (`/auth`)** | `RegisterForm` | `useAuth().register` / `authService.register()` | `POST` | `/api/v1/auth/register` | `AuthController.register` |
| **Auth (`/auth`)** | `PhoneOtpModal` | `authService.sendPhoneOtp()` | `POST` | `/api/v1/auth/phone/send-otp` | `PhoneAuthController.sendOtp` |
| **Auth (`/auth`)** | `PhoneOtpModal` | `authService.verifyPhoneOtp()` | `POST` | `/api/v1/auth/phone/verify-otp` | `PhoneAuthController.verifyOtp` |
| **Auth (`/auth`)** | `ForgotPasswordModal` | `authService.sendPasswordReset()` | `POST` | `/api/v1/auth/password/send-reset` | `AuthController.sendPasswordReset` |
| **Auth (`/auth`)** | `ForgotPasswordModal` | `authService.verifyPasswordReset()` | `POST` | `/api/v1/auth/password/verify` | `AuthController.verifyPasswordReset` |
| **Auth (`/auth`)** | `GoogleAuthButton` | Direct Browser Redirection | `GET` | `/api/v1/auth/google` | `AuthController.googleLogin` |
| **Landing (`/landing`)** | `PublicHeader` | `useAuth().refreshUser()` | `GET` | `/api/v1/auth/me` | `AuthController.me` |
| **Dashboard (`/dashboard`)** | `BentoDashboard` | `api.getOwnerSummary()` | `GET` | `/api/v1/dashboard/overview` | `DashboardController.getOverview` |
| **Dashboard (`/dashboard`)** | `RevenueChart` | `dashboardService.getRevenueAnalytics()` | `GET` | `/api/v1/dashboard/revenue` | `DashboardController.getRevenueAnalytics` |
| **Dashboard (`/dashboard`)** | `OccupancyWidget` | `dashboardService.getOccupancyAnalytics()` | `GET` | `/api/v1/dashboard/occupancy` | `DashboardController.getOccupancyAnalytics` |
| **Admin Console (`/admin-console`)** | `AdminVerificationTable` | `api.get('/settings/admin/verification-queue')`| `GET` | `/api/v1/settings/admin/verification-queue` | `SettingsController.getVerificationQueue`|
| **Admin Console (`/admin-console`)** | `ApprovePGButton` | `api.post('/settings/admin/approve-pg/:id')` | `POST` | `/api/v1/settings/admin/approve-pg/:pgId` | `SettingsController.approvePg` |
| **Properties (`/properties`)** | `PropertyGrid` | `api.getPublicProperties()` | `GET` | `/api/v1/properties/public` | `PropertyController.searchPublic` |
| **Properties (`/properties`)** | `AddPropertyModal` | `api.createProperty()` | `POST` | `/api/v1/properties` | `PropertyController.create` |
| **Properties (`/properties`)** | `BuildingConfigStep` | `api.post('/owners/property/:id/building')` | `PUT` | `/api/v1/owners/property/:pgId/building` | `OwnerController.configureBuilding` |
| **Properties (`/properties`)** | `BatchRoomStep` | `api.post('/owners/property/:id/rooms/batch')`| `POST` | `/api/v1/owners/property/:pgId/rooms/batch`| `OwnerController.batchCreateRooms` |
| **PG Details (`/pg-details`)** | `PGHeader` / `PGOverview` | `api.getPropertyById(id)` | `GET` | `/api/v1/properties/:id` | `PropertyController.getById` |
| **PG Details (`/pg-details`)** | `MealScheduleTab` | `api.get('/:pgId/meal-schedules')` | `GET` | `/api/v1/properties/:pgId/meal-schedules` | `PropertyController.getMealSchedules` |
| **Residents (`/residents`)** | `ResidentDirectoryTable` | `residentService.getResidentDirectory()` | `GET` | `/api/v1/residents/directory` | `ResidentController.getDirectory` |
| **Residents (`/residents`)** | `ResidentStatusDropdown` | `residentService.updateResidentStatus()` | `PATCH`| `/api/v1/residents/:residentId/status` | `ResidentController.updateStatus` |
| **Residents (`/residents`)** | `ResidentProfileModal` | `residentService.getResidentById(id)` | `GET` | `/api/v1/residents/:id` | `ResidentController.getResidentById` |
| **Resident Portal (`/resident-portal`)**| `PortalProfileHeader` | `residentService.getPortalMe()` | `GET` | `/api/v1/residents/portal/me` | `ResidentController.getPortalMe` |
| **Resident Portal (`/resident-portal`)**| `FileComplaintModal` | `complaintService.createComplaint()` | `POST` | `/api/v1/complaints` | `ComplaintController.create` |
| **Resident Portal (`/resident-portal`)**| `VisitorPassModal` | `visitorService.createVisitorPass()` | `POST` | `/api/v1/residents/portal/visitor-pass` | `ResidentController.createVisitorPass` |
| **Resident Portal (`/resident-portal`)**| `GatePassModal` | `visitorService.createGatePass()` | `POST` | `/api/v1/residents/portal/gate-pass` | `ResidentController.createGatePass` |
| **Resident Register (`/resident-register`)**| `OnboardingWizard`| `residentService.onboardResident()` | `POST` | `/api/v1/residents/onboard` | `ResidentController.onboard` |
| **Billing (`/billing`)** | `InvoicesTable` | `billingService.getPaymentHistory()` | `GET` | `/api/v1/payments/history` | `PaymentController.getPaymentHistory` |
| **Billing (`/billing`)** | `PaymentAnalyticsCard` | `billingService.getPaymentAnalytics()` | `GET` | `/api/v1/payments/analytics` | `PaymentController.getPaymentAnalytics` |
| **Billing (`/billing`)** | `PayRentModal` | `billingService.createBillingOrder()` | `POST` | `/api/v1/payments/create-order` | `PaymentController.createOrder` |
| **Billing (`/billing`)** | `RazorpayCheckout` | `billingService.verifyPayment()` | `POST` | `/api/v1/payments/verify` | `PaymentController.verifyPayment` |
| **Billing (`/billing`)** | `DownloadInvoiceBtn` | `useDocumentDownload('INVOICE')` | `GET` | `/api/v1/documents/invoice/:paymentId` | `DocumentController.downloadInvoice` |
| **Complaints (`/complaints`)** | `ComplaintListTable` | `complaintService.listComplaints()` | `GET` | `/api/v1/complaints` | `ComplaintController.list` |
| **Complaints (`/complaints`)** | `ComplaintStatusSelect`| `complaintService.updateComplaintStatus()` | `PUT` | `/api/v1/complaints/:id/status` | `ComplaintController.updateStatus` |
| **Complaints (`/complaints`)** | `KanbanBoardView` | `api.getRoomTransferRequests()` | `GET` | `/api/v1/rooms/transfer-requests` | `RoomController.listTransferRequests` |
| **Complaints (`/complaints`)** | `RoomTransferModal` | `roomService.approveRoomTransfer()` | `PUT` | `/api/v1/rooms/transfer-requests/:id/approve` | `RoomController.approveTransfer` |
| **Operations (`/rooms`)** | `RoomConversionModal` | `api.put('/rooms/:roomId/convert')` | `PUT` | `/api/v1/rooms/:roomId/convert` | `RoomController.convertType` |
| **Operations (`/beds`)** | `BedGrid` | `bedService.updateBedStatus()` | `PUT` | `/api/v1/beds/:bedId/status` | `BedController.updateStatus` |
| **Operations (`/beds`)** | `BedHoldModal` | `bedService.createBedHold()` | `POST` | `/api/v1/beds/holds` | `BedController.createHold` |
| **Operations (`/beds`)** | `ReleaseHoldBtn` | `bedService.releaseBedHold(id)` | `DELETE`| `/api/v1/beds/holds/:holdId` | `BedController.releaseHold` |
| **Operations (`/settings`)** | `DeviceManagementSection`| `deviceService.getUserDevices()` | `GET` | `/api/v1/security/devices` | `DeviceController.getDevices` |
| **Operations (`/settings`)** | `DeviceManagementSection`| `deviceService.trustDevice(id)` | `PATCH`| `/api/v1/security/devices/:deviceId/trust` | `DeviceController.trustDevice` |
| **Operations (`/settings`)** | `DeviceManagementSection`| `deviceService.revokeDevice(id)` | `POST` | `/api/v1/security/devices/:deviceId/revoke` | `DeviceController.revokeDevice` |
| **Shortlist (`/shortlist`)** | `ShortlistPage` | `api.getShortlist()` | `GET` | `/api/v1/tours/shortlist` | `ToursController.getShortlist` |
| **Shortlist (`/shortlist`)** | `ShortlistHeartBtn` | `api.toggleShortlist(pgId)` | `POST` | `/api/v1/tours/shortlist/:propertyId` | `ToursController.toggleShortlist` |
| **Tours (`/tours`)** | `ToursPage` | `api.getTours()` | `GET` | `/api/v1/tours` | `ToursController.getTours` |
| **Tours (`/tours`)** | `ScheduleTourModal` | `api.requestTour()` | `POST` | `/api/v1/tours` | `ToursController.requestTour` |
| **Applications (`/application`)** | `ApplicationPage` | `api.getApplications()` | `GET` | `/api/v1/applications` | `ApplicationsController.list` |
| **Applications (`/application`)** | `ApplyModal` | `api.createApplication()` | `POST` | `/api/v1/applications` | `ApplicationsController.create` |
| **Applications (`/application`)** | `LeaseSignCanvas` | `api.signLease(appId)` | `POST` | `/api/v1/applications/:id/sign-lease` | `ApplicationsController.signLease` |
| **Move-In (`/move-in-dashboard`)**| `MoveInDashboardPage` | `api.getTenantDashboardSummary()` | `GET` | `/api/v1/move-in/tenant-summary` | `MoveInController.getTenantDashboardSummary` |
| **Move-In (`/move-in-dashboard`)**| `ChatThreadList` | `api.getThreads()` | `GET` | `/api/v1/messages/threads` | `MessagesController.getUserThreads` |
| **Move-In (`/move-in-dashboard`)**| `ChatMessageWindow` | `api.sendMessage()` | `POST` | `/api/v1/messages` | `MessagesController.sendMessage` |

---

## 7. Feature-wise API Documentation

### 7.1 Authentication & Session Lifecycle (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
- **Purpose**: Registers a new User account with an initial `PUBLIC` or specified `OWNER` / `RESIDENT` role.
- **Middleware**: `registerLimiter` (5 req / 1 hr per IP), `validate(RegisterSchema)`.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "OWNER",
    "phone": "+919876543210"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "67b43a9b89c31e2b4f0011a1",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "OWNER",
        "accountStatus": "ACTIVE",
        "emailVerified": false
      },
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Cookies Set**: `refreshToken` (HttpOnly, Secure, SameSite=None/Lax, 7d).
- **Database Operations**: `prisma.user.create()`, `prisma.sessionFamily.create()`, `prisma.refreshToken.create()`.
- **Collections Modified**: `users`, `session_families`, `refresh_tokens`.

#### `POST /api/v1/auth/login`
- **Purpose**: Authenticates user credentials, evaluates Device Intelligence risk, and issues RS256 JWT tokens.
- **Middleware**: `loginLimiter` (10 req / 15 min per IP), `validate(LoginSchema)`.
- **Request Body**:
  ```json
  {
    "identifier": "jane@example.com",
    "password": "Password123!",
    "rememberMe": true,
    "visitorId": "a1b2c3d4e5f6g7h8",
    "deviceLabel": "Chrome 122 on Windows"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "67b43a9b89c31e2b4f0011a1",
        "email": "jane@example.com",
        "name": "Jane Doe",
        "role": "OWNER",
        "tokenVersion": 0
      },
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "deviceSecurity": {
        "isNewDevice": false,
        "status": "TRUSTED",
        "riskLevel": "LOW",
        "stepUpRequired": false
      }
    }
  }
  ```
- **Database Operations**: `prisma.user.findFirst()`, `prisma.userDevice.upsert()`, `prisma.securityAuditEvent.create()`, `prisma.refreshToken.create()`.
- **Collections Modified**: `users`, `user_devices`, `security_audit_events`, `refresh_tokens`, `login_histories`.

#### `POST /api/v1/auth/refresh-token`
- **Purpose**: Rotates the refresh token and issues a fresh 15-minute RS256 access token.
- **Middleware**: `generalLimiter`, `validateCsrf`.
- **Request Body**: `{ "refreshToken": "<optional-token-fallback>" }` (Primary source: `req.cookies.refreshToken`).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Access token refreshed and rotated",
    "data": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Database Operations**: `prisma.refreshToken.findUnique()`, `prisma.refreshToken.update()`, `prisma.refreshToken.create()`.
- **Collections Modified**: `refresh_tokens`, `session_families`.

#### `POST /api/v1/auth/logout`
- **Purpose**: Revokes current device refresh token and blacklists access token in memory.
- **Middleware**: `validateCsrf`.
- **Database Operations**: `prisma.refreshToken.updateMany()`, `prisma.securityAuditEvent.create()`.
- **Collections Modified**: `refresh_tokens`, `security_audit_events`.

#### `POST /api/v1/auth/logout-all`
- **Purpose**: Mass revocation across all user devices; increments `User.tokenVersion` and disconnects all live WebSockets.
- **Middleware**: `authenticate`, `validateCsrf`.
- **Database Operations**: `prisma.refreshToken.updateMany({ where: { userId } })`, `prisma.user.update({ tokenVersion: { increment: 1 } })`.
- **Collections Modified**: `refresh_tokens`, `users`, `security_audit_events`.

---

### 7.2 Phone OTP Subsystem (`/api/v1/auth/phone`)

#### `POST /api/v1/auth/phone/send-otp`
- **Purpose**: Dispatches a cryptographic 6-digit SMS OTP via Twilio.
- **Middleware**: `sendOtpLimiter` (3 req / 10 min), `validate(SendPhoneOtpSchema)`.
- **Request Body**: `{ "phone": "+919876543210", "purpose": "PHONE_VERIFICATION" }`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "OTP sent to +919876543210",
    "data": {
      "phone": "+919876543210",
      "expiresInSeconds": 600,
      "resendCooldownSeconds": 30
    }
  }
  ```
- **Database Operations**: `prisma.phoneOTP.create()`.
- **Collections Modified**: `phone_otps`.

#### `POST /api/v1/auth/phone/verify-otp`
- **Purpose**: Validates submitted OTP against bcrypt hash, flags phone as verified in `User` record.
- **Middleware**: `phoneVerifyLimiter` (10 req / 15 min), `validate(VerifyPhoneOtpSchema)`.
- **Request Body**: `{ "phone": "+919876543210", "otp": "492810" }`
- **Database Operations**: `prisma.phoneOTP.findFirst()`, `prisma.user.update()`.
- **Collections Modified**: `phone_otps`, `users`.

---

### 7.3 Device Security & FingerprintJS (`/api/v1/security/devices`)

#### `POST /api/v1/security/devices/identify`
- **Purpose**: Evaluates browser FingerprintJS visitor ID against device history, flagging suspicious new devices or impossible travel velocity.
- **Middleware**: `authenticate`, `authLimiter`.
- **Request Body**:
  ```json
  {
    "visitorId": "f9028cb9e8172da0",
    "provider": "fingerprintjs",
    "deviceLabel": "Safari 17 on macOS Sonoma"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Device evaluated",
    "data": {
      "device": {
        "id": "67b43c1289c31e2b4f001201",
        "deviceLabel": "Safari 17 on macOS Sonoma",
        "status": "TRUSTED",
        "trustLevel": "TRUSTED",
        "firstSeenAt": "2026-08-20T10:00:00.000Z"
      },
      "isNew": false,
      "risk": {
        "score": 5,
        "level": "LOW",
        "reasons": [],
        "requiresStepUp": false
      }
    }
  }
  ```
- **Collections Modified**: `user_devices`, `security_audit_events`.

#### `GET /api/v1/security/devices`
- **Purpose**: Lists all registered devices for the authenticated user.
- **Middleware**: `authenticate`.
- **Response (`200 OK`)**: Array of `UserDevice` entities.

#### `PATCH /api/v1/security/devices/:deviceId/trust`
- **Purpose**: Manually flags a device as `TRUSTED`.
- **Middleware**: `authenticate`.
- **Collections Modified**: `user_devices`, `security_audit_events`.

#### `POST /api/v1/security/devices/:deviceId/revoke`
- **Purpose**: Revokes access for a specific device, triggering instant token blacklisting.
- **Middleware**: `authenticate`.
- **Collections Modified**: `user_devices`, `refresh_tokens`, `security_audit_events`.

---

### 7.4 Owner Onboarding & Management (`/api/v1/owners` & `/api/v1/onboarding`)

#### `POST /api/v1/owners/onboard`
- **Purpose**: Full 10-step atomic onboarding wizard endpoint for PG owners. Persists personal profile, KYC documents, business info, bank details, property configuration, building floors, batch rooms, and subscription tier.
- **Middleware**: `authenticate`, `authorize(OWNER)`.
- **Request Body**:
  ```json
  {
    "ownerId": "67b43a9b89c31e2b4f0011a1",
    "personal": {
      "name": "Vikram Malhotra",
      "phone": "+919876543210",
      "address": "104 Brigade Road, Bangalore",
      "aadhaarNumber": "987654321098",
      "panNumber": "ABCDE1234F",
      "upiId": "vikram@okhdfcbank",
      "bankName": "HDFC Bank",
      "accountNumber": "50100234567890",
      "ifscCode": "HDFC0001234",
      "emergencyContact": "+919876543211"
    },
    "kyc": {
      "aadhaarDocUrl": "https://res.cloudinary.com/roombae/image/upload/aadhaar.pdf",
      "panDocUrl": "https://res.cloudinary.com/roombae/image/upload/pan.pdf"
    },
    "business": {
      "businessName": "Malhotra Living Spaces LLP",
      "businessType": "LLP",
      "gstin": "29ABCDE1234F1Z5",
      "businessAddress": "104 Brigade Road, Bangalore",
      "businessEmail": "contact@malhotraliving.com",
      "businessPhone": "+919876543210"
    },
    "property": {
      "name": "Sunrise Luxury PG",
      "description": "Premium coliving space near Whitefield tech corridor",
      "address": "ITPL Main Road, Whitefield",
      "city": "Bangalore",
      "pincode": "560066",
      "rentStartingFrom": 12000,
      "securityDeposit": 24000,
      "amenities": ["WiFi", "Laundry", "Mess", "CCTV", "Power Backup"],
      "rules": ["No Smoking", "Gate closes 10:30 PM"]
    },
    "building": {
      "buildingName": "Tower Alpha",
      "floorsCount": 4
    },
    "roomConfig": {
      "roomsPerFloor": 6,
      "defaultRoomType": "DOUBLE",
      "defaultRent": 14000
    },
    "subscription": {
      "planType": "PROFESSIONAL"
    }
  }
  ```
- **Database Operations**: Executes inside atomic `prisma.$transaction`:
  1. Creates/updates `Owner` document.
  2. Encrypts sensitive bank details and KYC using AES-256-GCM (`BankAccount`, `OwnerKYC`).
  3. Creates `Business` record.
  4. Creates `PG` entity with auto-generated slug.
  5. Generates `Building` -> `Floor` -> `Room` -> `Bed` inventory hierarchy.
  6. Creates `Subscription` record.
- **Collections Modified**: `owners`, `bank_accounts`, `owner_kycs`, `businesses`, `pgs`, `buildings`, `floors`, `rooms`, `beds`, `subscriptions`.

---

### 7.5 Properties & Public Marketplace (`/api/v1/properties`)

#### `GET /api/v1/properties/public` (Alias: `GET /api/v1/properties`)
- **Purpose**: Public unauthenticated search for approved PGs with multi-facet filtering (city, rent range, room type, pagination).
- **Query Parameters**: `city`, `minRent`, `maxRent`, `roomType`, `page`, `limit`.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Public properties retrieved",
    "data": {
      "properties": [
        {
          "id": "67b4401289c31e2b4f001301",
          "name": "Sunrise Luxury PG",
          "slug": "sunrise-luxury-pg-whitefield",
          "city": "Bangalore",
          "address": "ITPL Main Road, Whitefield",
          "rentStartingFrom": 12000,
          "capacity": 48,
          "availableBeds": 12,
          "amenities": ["WiFi", "Laundry", "Mess"],
          "galleryImages": ["https://res.cloudinary.com/.../img1.webp"]
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 142, "totalPages": 15 }
    }
  }
  ```

#### `POST /api/v1/properties`
- **Purpose**: Creates a new PG property.
- **Middleware**: `authenticate`, `authorize(OWNER)`, `requireKycApproved`.
- **Collections Modified**: `pgs`.

---

### 7.6 Rooms Management & Transfers (`/api/v1/rooms`)

#### `PUT /api/v1/rooms/:roomId/convert`
- **Purpose**: Converts room layout configuration (e.g. `DOUBLE` -> `TRIPLE`) and regenerates underlying bed slots.
- **Database Operations**: Updates `Room`, adds/removes `Bed` documents.
- **Collections Modified**: `rooms`, `beds`.

#### `POST /api/v1/rooms/transfer-requests`
- **Purpose**: Resident submits formal room transfer request.
- **Request Body**:
  ```json
  {
    "residentId": "67b4450189c31e2b4f001401",
    "pgId": "67b4401289c31e2b4f001301",
    "currentBedId": "67b4405589c31e2b4f001350",
    "preferredRoomType": "SINGLE",
    "reason": "Need quiet environment for remote work"
  }
  ```
- **Collections Modified**: `room_transfer_requests`.
- **Realtime Trigger**: Broadcasts `room:transfer_request_updated` via Socket.IO.

#### `PUT /api/v1/rooms/transfer-requests/:id/approve`
- **Purpose**: Owner approves transfer and reassigns bed.
- **Database Operations**: Atomically swaps resident bed assignments, sets old bed to `AVAILABLE` and target bed to `OCCUPIED`.
- **Collections Modified**: `room_transfer_requests`, `residents`, `beds`.

---

### 7.7 Beds Inventory & Hold Locks (`/api/v1/beds`)

#### `PUT /api/v1/beds/:bedId/status`
- **Purpose**: Updates bed operational status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `CLEANING`, `BLOCKED`).
- **Collections Modified**: `beds`, `bed_histories`.

#### `POST /api/v1/beds/holds`
- **Purpose**: Reserves an exclusive temporary hold lock on a bed.
- **Request Body**: `{ "bedId": "67b4405589c31e2b4f001350", "reason": "MAINTENANCE", "holdStartDate": "2026-08-20T10:00:00Z" }`
- **Collections Modified**: `beds`, `bed_holds`, `bed_histories`.

#### `DELETE /api/v1/beds/holds/:holdId`
- **Purpose**: Releases active hold lock, returning bed to `AVAILABLE`.
- **Collections Modified**: `bed_holds`, `beds`.

---

### 7.8 Residents & Resident Portal (`/api/v1/residents`)

#### `GET /api/v1/residents/directory`
- **Purpose**: Retrieves searchable resident directory for owner dashboard.
- **Middleware**: `authenticate`, `authorize(OWNER, ADMIN, SUPER_ADMIN)`.
- **Query Parameters**: `propertyId`, `search`, `status`.
- **Collections Read**: `residents`, `users`, `pgs`, `beds`.

#### `GET /api/v1/residents/portal/me`
- **Purpose**: Self-service profile endpoint for mobile resident portal (assigned bed, PG rules, gate passes, dues).
- **Middleware**: `authenticate`, `authorize(RESIDENT, OWNER, ADMIN, SUPER_ADMIN)`.

#### `POST /api/v1/residents/onboard`
- **Purpose**: Self-service resident onboarding with personal details, emergency contacts, food preferences, and document uploads.
- **Collections Modified**: `residents`, `emergency_contacts`, `guardians`, `documents`.

#### `PATCH /api/v1/residents/:residentId/status`
- **Purpose**: Changes resident operational status (`ACTIVE`, `HOME`, `ON_LEAVE`, `HOLD`, `LEAVING`, `CHECKED_OUT`).
- **Collections Modified**: `residents`, `resident_status_histories`.
- **Realtime Trigger**: Broadcasts `resident:status_updated`.

---

### 7.9 Billing & Fines Subsystem (`/api/v1/billing`)

#### `GET /api/v1/billing/fine-rules`
- **Purpose**: Lists property fine rules (e.g. Late Rent 5% per day, grace period 3 days).
- **Middleware**: `authenticate`, `authorize(OWNER, ADMIN, SUPER_ADMIN)`.

#### `POST /api/v1/billing/fines`
- **Purpose**: Issues a manual or automated fine to a resident.
- **Collections Modified**: `fines`.

#### `POST /api/v1/billing/fines/:fineId/waive`
- **Purpose**: Owner waives an unpaid resident fine.
- **Collections Modified**: `fines`.

---

### 7.10 Payments & Razorpay Transactions (`/api/v1/payments`)

#### `POST /api/v1/payments/create-order`
- **Purpose**: Creates Razorpay payment order and generates preliminary `Payment` and `Invoice` tracking records with automatic CGST (9%) and SGST (9%) or IGST (18%) tax computation.
- **Middleware**: `authenticate`, `idempotencyMiddleware`.
- **Request Body**:
  ```json
  {
    "residentId": "67b4450189c31e2b4f001401",
    "baseAmount": 10000,
    "isInterstate": false,
    "description": "Monthly Rent - August 2026"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Payment order created",
    "data": {
      "paymentId": "67b4499089c31e2b4f001601",
      "invoiceNumber": "INV-2026-08-0042",
      "receiptNumber": "REC-2026-08-0042",
      "razorpayOrderId": "order_PxK9281aZ01948",
      "baseAmount": 10000,
      "cgstAmount": 900,
      "sgstAmount": 900,
      "igstAmount": 0,
      "totalAmount": 11800,
      "currency": "INR",
      "keyId": "rzp_test_TM4mpVud9kvppK",
      "status": "PENDING"
    }
  }
  ```
- **Collections Modified**: `payments`, `invoices`.

#### `POST /api/v1/payments/verify`
- **Purpose**: Verifies cryptographic HMAC-SHA256 signature from Razorpay checkout. Marks payment `PAID`, triggers PDF invoice generation, and updates resident dues.
- **Middleware**: `authenticate`, `idempotencyMiddleware`.
- **Request Body**:
  ```json
  {
    "paymentId": "67b4499089c31e2b4f001601",
    "razorpayOrderId": "order_PxK9281aZ01948",
    "razorpayPaymentId": "pay_Q1892kL90184",
    "razorpaySignature": "49f0a82b9c1d..."
  }
  ```
- **Collections Modified**: `payments`, `invoices`, `residents`, `generated_documents`.
- **Realtime Trigger**: Broadcasts `billing:payment_received`.

#### `POST /api/v1/payments/webhook` (Public Razorpay Webhook)
- **Purpose**: Asynchronous fallback processor for Razorpay checkout events (`payment.captured`, `payment.failed`, `refund.processed`).
- **Signature Verification**: Validated using `RAZORPAY_WEBHOOK_SECRET` via `crypto.createHmac('sha256')`.
- **Collections Modified**: `payments`, `invoices`, `payment_webhook_logs`.

---

### 7.11 Complaints & Maintenance Support (`/api/v1/complaints` & `/api/v1/support`)

#### `POST /api/v1/complaints`
- **Purpose**: Files a maintenance ticket with category, description, and attached images.
- **Middleware**: `authenticate`.
- **Collections Modified**: `complaints`.
- **Realtime Trigger**: Broadcasts `complaint:ticket_created`.

#### `GET /api/v1/complaints`
- **Purpose**: Lists property complaints with priority and status filtering.
- **Middleware**: `authenticate`, `authorize(OWNER, ADMIN, SUPER_ADMIN)`.

#### `PUT /api/v1/complaints/:id/status` (Alias: `PATCH`)
- **Purpose**: Updates complaint status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
- **Collections Modified**: `complaints`.
- **Realtime Trigger**: Broadcasts `complaint:ticket_updated`.

---

### 7.12 Agreements & Digital Signatures (`/api/v1/agreements`)

#### `POST /api/v1/agreements/generate`
- **Purpose**: Generates legal rental agreement document with house rules, notice period, and QR verification payload.
- **Collections Modified**: `agreements`, `agreement_versions`.

#### `POST /api/v1/agreements/:id/sign`
- **Purpose**: Captures SVG digital signature, records signer IP address, and generates SHA-256 HMAC signature integrity hash.
- **Request Body**:
  ```json
  {
    "signerType": "RESIDENT",
    "signerName": "Jane Doe",
    "signatureDataSvg": "<svg>...</svg>"
  }
  ```
- **Collections Modified**: `agreements`, `signatures`.

#### `GET /api/v1/agreements/verify/:agreementNumber`
- **Purpose**: Public verification endpoint for scanning agreement QR code.
- **Collections Modified**: `verifications`.

---

### 7.13 Centralized Document Downloads (`/api/v1/documents`)

RoomBae centralizes all PDF streaming through deterministic endpoints authenticated exclusively via `Authorization: Bearer` headers (JWTs are never placed in query strings):

- `GET /api/v1/documents/invoice/:entityId`: Generates and streams GST Tax Invoice PDF.
- `GET /api/v1/documents/receipt/:entityId`: Streams Payment / Rent Receipt PDF.
- `GET /api/v1/documents/agreement/:entityId`: Streams Digitally Signed Lease Agreement PDF.
- `GET /api/v1/documents/kyc/:entityId`: Streams KYC Verification Certificate PDF.
- `GET /api/v1/documents/refund/:entityId`: Streams Refund Voucher PDF.
- `GET /api/v1/documents/status/:documentKey`: Polls asynchronous PDF compilation state (`PENDING`, `GENERATING`, `READY`, `FAILED`).

---

### 7.14 Search & Marketplace Filters (`/api/v1/search`)

#### `GET /api/v1/search`
- **Purpose**: Full-text search across properties, resident directory, room inventory, and tickets.
- **Query Parameters**: `q`, `category`, `pgId`.

---

### 7.15 Analytics & Revenue Intelligence (`/api/v1/analytics`)

#### `GET /api/v1/analytics/revenue`
- **Purpose**: Aggregates Monthly Recurring Revenue (MRR), collection rates, overdue rent, and payment method distributions.
- **Middleware**: `authenticate`, `authorize(OWNER, ADMIN, SUPER_ADMIN)`.

#### `GET /api/v1/analytics/pg/:pgId`
- **Purpose**: Property-specific occupancy metrics, historical churn, and ticket resolution velocity.

---

### 7.16 Notifications Subsystem (`/api/v1/notifications`)

#### `GET /api/v1/notifications`
- **Purpose**: Retrieves in-app alerts for authenticated user.
- **Middleware**: `authenticate`.

#### `PUT /api/v1/notifications/:id/read`
- **Purpose**: Marks notification as read.

---

### 7.17 Marketing Campaigns & Email Broadcasts (`/api/v1/marketing`)

#### `POST /api/v1/marketing`
- **Purpose**: Creates email marketing campaign draft.
- **Middleware**: `authenticate`, `authorize(ADMIN, SUPER_ADMIN, OWNER)`.

#### `POST /api/v1/marketing/send`
- **Purpose**: Triggers bulk transactional email delivery via Brevo / SMTP engine.
- **Collections Modified**: `marketing_campaigns`, `email_logs`.

---

### 7.18 Marketplace Tours & Shortlists (`/api/v1/tours` & `/api/v1/shortlist`)

- `POST /api/v1/tours/shortlist/:propertyId`: Toggles PG in user shortlist.
- `GET /api/v1/tours/shortlist`: Retrieves user shortlists.
- `POST /api/v1/tours`: Schedules in-person or virtual property tour.
- `GET /api/v1/tours`: Lists requested and confirmed tours.
- `PATCH /api/v1/tours/:id`: Updates tour status (`CONFIRMED`, `RESCHEDULED`, `COMPLETED`, `CANCELLED`).

---

### 7.19 Rental Applications & Lease Approvals (`/api/v1/applications`)

- `POST /api/v1/applications`: Submits formal tenancy application.
- `GET /api/v1/applications`: Lists applications for tenant or owner.
- `GET /api/v1/applications/:id`: Retrieves full application dossier.
- `POST /api/v1/applications/:id/documents`: Uploads identity/income verification proofs.
- `PATCH /api/v1/applications/:id/status`: Updates application status (`UNDER_REVIEW`, `APPROVED`, `REJECTED`, `LEASE_SENT`).
- `POST /api/v1/applications/:id/sign-lease`: Tenant signs digital lease agreement.

---

### 7.20 Tenant-Owner Realtime Messaging (`/api/v1/messages`)

- `POST /api/v1/messages/thread`: Retrieves or creates 1-on-1 chat thread between tenant and PG owner.
- `GET /api/v1/messages/threads`: Lists active conversation threads.
- `GET /api/v1/messages/thread/:threadId`: Fetches message history.
- `POST /api/v1/messages`: Sends direct message and emits real-time event.

---

### 7.21 Move-In Coordination & Key Handover (`/api/v1/move-in`)

- `GET /api/v1/move-in/tenant-summary`: Retrieves onboarding checklists, gate code, WiFi credentials, and key handover contact.
- `GET /api/v1/move-in/:propertyId`: Fetches move-in guide for property.
- `POST /api/v1/move-in/:propertyId`: Owner configures property move-in instructions.

---

### 7.22 Media & File Assets (`/api/v1/media` & `/api/v1/upload`)

#### `POST /api/v1/media/upload/single`
- **Purpose**: Uploads single image or PDF document to Cloudinary with ClamAV virus scanning.
- **Middleware**: `authenticate`, `uploadLimiter`, `multerUpload.single('file')`, `processSecurityPipeline`.
- **Collections Modified**: `media_records`.

#### `POST /api/v1/media/upload/multiple`
- **Purpose**: Batch uploads up to 10 images simultaneously with progress tracking.

#### `PUT /api/v1/media/replace/:publicId`
- **Purpose**: Replaces existing Cloudinary asset and updates database metadata.

#### `DELETE /api/v1/media/:publicId`
- **Purpose**: Deletes asset from Cloudinary storage and removes database record.

---

### 7.23 Dashboard Aggregates (`/api/v1/dashboard`)

- `GET /api/v1/dashboard/overview`: High-performance aggregated KPI metric snapshot (Total PGs, Residents, Occupancy %, Revenue, Pending Dues, Open Complaints, Food Ratings).
- `GET /api/v1/dashboard/revenue`: Monthly revenue trend breakdown.
- `GET /api/v1/dashboard/occupancy`: Floor and bed capacity utilization charts.

---

### 7.24 System Settings & Admin Verification (`/api/v1/settings`)

- `GET /api/v1/settings/admin/verification-queue`: Super Admin verification queue of pending Owner KYC submissions and draft PGs.
- `POST /api/v1/settings/admin/approve-pg/:pgId`: Approves draft PG for public marketplace listing.
- `POST /api/v1/settings/account/delete`: Initiates GDPR/DPDP Act account deletion with soft-delete cascade.
- `GET /api/v1/settings/audit-logs`: Audit trail of security and system actions.

---

### 7.25 SOAP ERP Billing Service (`/soap/billing`)

- **Purpose**: Enterprise XML/WSDL billing integration for legacy accounting and ERP systems.
- **Security Middleware**: `soapBillingLimiter` (20 req / 15 min), `soapBillingAuthMiddleware` (`X-API-Key` guard), `soapXxePreFilter` (anti-XXE & DTD injection filter).
- **Operation**: `GetInvoiceDetails(invoiceNumber)` -> Returns `{ status, totalAmount, paymentMethod }`.
- **WSDL Definition**: Accessible via `GET /soap/billing?wsdl`.

---

### 7.26 System Health, Telemetry & JWKS

- `GET /health`: Comprehensive system probe returning database latency, SMTP transport health, in-memory cache metrics, uptime, and memory consumption.
- `GET /ready`: Kubernetes/Docker readiness probe checking MongoDB ping.
- `GET /live`: Liveness heartbeat probe.
- `GET /metrics`: Prometheus formatted telemetry metrics (`node_memory_rss_bytes`, `node_uptime_seconds`, etc.).
- `GET /.well-known/jwks.json`: Public RS256 RSA JSON Web Key Set for third-party microservice token verification.

---

## 8. CRUD Operation Matrix

The following matrix documents CRUD ownership and database operations across all domain models:

| Domain Module | Create (POST) | Read (GET) | Update (PUT/PATCH) | Delete (DELETE) | Primary DB Collection | Prisma Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Users / Auth** | `/auth/register` | `/auth/me` | `/auth/2fa/enable` | `/settings/account/delete` | `users` | `User` |
| **Device Security** | `/security/devices/identify` | `/security/devices` | `/security/devices/:id/trust` | `/security/devices/:id/revoke` | `user_devices` | `UserDevice` |
| **Owners** | `/owners/onboard` | `/owners/profile` | `/owners/:id/personal` | *Cascaded* | `owners` | `Owner` |
| **Properties (PG)** | `/properties` | `/properties/public` | `/owners/property/:id/building` | *Soft Delete* | `pgs` | `PG` |
| **Buildings / Floors**| `/owners/property/:id/building`| `/properties/:id` | `/owners/property/:id/building` | *Cascaded* | `buildings` / `floors` | `Building` / `Floor` |
| **Rooms** | `/owners/property/:id/rooms/batch`| `/rooms/pg/:pgId` | `/rooms/:id/convert` | *Cascaded* | `rooms` | `Room` |
| **Beds** | `/owners/property/:id/rooms/batch`| `/beds/holds` | `/beds/:id/status` | `/beds/holds/:id` | `beds` | `Bed` |
| **Residents** | `/residents/onboard` | `/residents/directory` | `/residents/:id/status` | *Soft Delete* | `residents` | `Resident` |
| **Room Transfers** | `/rooms/transfer-requests` | `/rooms/transfer-requests` | `/rooms/transfer-requests/:id/approve` | `/rooms/transfer-requests/:id/reject` | `room_transfer_requests` | `RoomTransferRequest` |
| **Payments** | `/payments/create-order` | `/payments/history` | `/payments/verify` | `/payments/:id` | `payments` | `Payment` |
| **Invoices** | *Automated on verify* | `/documents/invoice/:id` | *Immutable* | *Immutable* | `invoices` | `Invoice` |
| **Fines** | `/billing/fines` | `/billing/residents/:id/fines`| `/billing/fines/:id/waive` | *Soft Delete* | `fines` | `Fine` |
| **Complaints** | `/complaints` | `/complaints` | `/complaints/:id/status` | *Closed* | `complaints` | `Complaint` |
| **Agreements** | `/agreements/generate` | `/agreements/:id` | `/agreements/:id/sign` | *Archived* | `agreements` | `Agreement` |
| **Visitor Passes** | `/residents/portal/visitor-pass`| `/residents/portal/me` | *Automated Expiry* | *Expired* | `visitors` | `Visitor` |
| **Gate Passes** | `/residents/portal/gate-pass` | `/residents/portal/me` | *Check-in/out* | *Completed* | `check_ins` / `check_outs` | `CheckIn` / `CheckOut` |
| **Shortlists** | `/tours/shortlist/:id` | `/tours/shortlist` | *Toggle* | `/tours/shortlist/:id` | `shortlists` | `Shortlist` |
| **Tours** | `/tours` | `/tours` | `/tours/:id` | *Cancelled* | `tours` | `Tour` |
| **Applications** | `/applications` | `/applications` | `/applications/:id/status`| *Rejected* | `applications` | `Application` |
| **Chat Messages** | `/messages` | `/messages/thread/:id` | `/messages/thread` | *Retained* | `messages` | `Message` |
| **Media Records** | `/media/upload/single` | `/media/metadata/:id` | `/media/replace/:id` | `/media/:id` | `media_records` | `MediaRecord` |

---

## 9. Request Lifecycle Pipeline

Every HTTP transaction passes through a rigorous 14-stage execution sequence:

```mermaid
graph TD
    A["1. Client React UI Event"] --> B["2. Zod Client Validation & ApiClient Interceptor"]
    B --> C["3. Reverse Proxy / Render Edge TLS Termination"]
    C --> D["4. Express CORS Origin Guard"]
    D --> E["5. Helmet Security Headers & HSTS"]
    E --> F["6. Correlation ID Injection (X-Correlation-ID)"]
    F --> G["7. NoSQL MongoSanitize & HPP Parameter Pollution Guard"]
    G --> H["8. Sliding-Window Rate Limiter Engine"]
    H --> I["9. Double-Submit HMAC CSRF Validator"]
    I --> J["10. RS256 JWT Token & TokenVersion Validator"]
    J --> K["11. RBAC RoleGuard & KYC Approval Gate"]
    K --> L["12. Request Body Zod Schema Parser"]
    L --> M["13. Domain Controller & Service Transaction"]
    M --> N["14. JSON ApiResponse Envelope Serialization"]
```

1. **Client Event**: User submits form or triggers async action.
2. **Client Validation**: Zod schema verifies input types in React; `ApiClient` injects in-memory JWT, CSRF token, and Device Fingerprint.
3. **TLS Termination**: HTTPS connection terminated at Render / Cloudflare gateway.
4. **CORS Origin Check**: Validates `Origin` against whitelist (`https://ayushman-glb.github.io`, `http://localhost:5173`).
5. **Helmet**: Injects Content Security Policy, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`).
6. **Correlation ID**: Sets `req.correlationId` (`X-Correlation-ID`) for distributed tracing.
7. **NoSQL & HPP Sanitization**: Strips `$` query selectors and removes duplicate parameters.
8. **Rate Limiting**: Checks IP request counter against route limits (`loginLimiter`, `sendOtpLimiter`, etc.).
9. **CSRF Validation**: Compares `x-csrf-token` header against signed `csrf-token` cookie via `crypto.timingSafeEqual`.
10. **JWT Authentication**: Verifies RS256 signature, validates `User.tokenVersion` against cache/database.
11. **RBAC & KYC Gate**: Checks user role (`SUPER_ADMIN`, `OWNER`, `RESIDENT`) and enforces KYC approval for listing/financial operations.
12. **Zod Body Validation**: Validates request DTO schema; rejects malformed requests with `400 Bad Request`.
13. **Service & Database Execution**: Domain service executes business logic inside Prisma transaction.
14. **Standard Envelope**: Response wrapped in unified `ApiResponse` format with correlation ID.

---

## 10. Response Lifecycle & Envelope Contracts

All REST API endpoints conform to standard response envelopes.

### Success Envelope (`200 OK`, `201 Created`)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": "67b43a9b89c31e2b4f0011a1",
    "name": "Sunrise Luxury PG"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### Standard Error Envelope (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`)

```json
{
  "success": false,
  "message": "Bed 101-A is currently held by another reservation",
  "errors": [
    {
      "field": "bedId",
      "message": "Distributed lock active"
    }
  ],
  "error": {
    "code": "BED_ALREADY_LOCKED",
    "message": "Bed 101-A is currently held by another reservation",
    "action": "retry"
  }
}
```

### HTTP Status Code Mapping

| Status Code | Meaning | Typical Trigger | Recommended Client Action (`error.action`) |
| :--- | :--- | :--- | :--- |
| **`200 OK`** | Request Succeeded | Read/update operations completed. | Consume `response.data`. |
| **`201 Created`** | Resource Created | Registration, payment creation, bookings. | Navigate or refresh list. |
| **`400 Bad Request`** | Validation Failed | Zod schema rejection, malformed parameters. | Highlight form fields (`errors`). |
| **`401 Unauthorized`** | Token Expired / Invalid | Missing/expired JWT, blacklisted token. | Trigger `/auth/refresh-token` or redirect to `/auth`. |
| **`403 Forbidden`** | Permission Denied | Role mismatch, KYC pending review, CSRF failure. | Surface error modal or complete KYC. |
| **`404 Not Found`** | Resource Missing | Non-existent PG, resident, or payment ID. | Display not found screen. |
| **`409 Conflict`** | State Conflict | Duplicate email/phone, concurrent bed booking lock. | Prompt user to pick another bed / resource. |
| **`429 Too Many Req`**| Throttled | Rate limit exceeded on login/OTP/upload. | Display retry countdown timer. |
| **`500 Server Error`**| Internal Failure | Unhandled database error or external API timeout. | Retry with backoff. |

---

## 11. Authentication & Session Security Flow

RoomBae implements an enterprise-grade, XSS-resilient authentication architecture:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser (React 19)
    participant AuthServ as AuthService (In-Memory)
    participant API as Express /api/v1/auth
    participant TokenServ as JwtKeyService (RS256)
    participant DB as MongoDB Atlas

    Note over Client, API: 1. Login Phase
    Client->>API: POST /api/v1/auth/login { identifier, password, visitorId }
    API->>DB: Query User & Verify Argon2/Bcrypt Hash
    API->>TokenServ: Sign 15m RS256 JWT Access Token (kid: rb_key_1)
    API->>DB: Save Opaque SHA-256 Refresh Token (SessionFamily)
    API-->>Client: Set-Cookie: refreshToken=... (HttpOnly, Secure)<br/>Body: { accessToken: "eyJ..." }
    Client->>AuthServ: Store Access Token in In-Memory Variable

    Note over Client, API: 2. Authenticated API Call
    Client->>API: GET /api/v1/residents/directory<br/>Header: Authorization: Bearer <accessToken>
    API->>TokenServ: Verify RS256 Signature using Public Key
    API->>DB: Verify User.tokenVersion (Fast-Path Cache)
    API-->>Client: 200 OK Directory Data

    Note over Client, API: 3. Token Expiration & Silent Rotation
    Client->>API: GET /api/v1/residents/portal/me (Expired Token)
    API-->>Client: 401 Unauthorized (TOKEN_EXPIRED)
    Client->>API: POST /api/v1/auth/refresh-token (HttpOnly Cookie Attached)
    API->>DB: Lookup Refresh Token Hash & Validate Family
    API->>DB: Rotate Refresh Token (Mark old replacedBy, generate new)
    API->>TokenServ: Issue New RS256 Access Token
    API-->>Client: Set-Cookie: refreshToken=new_hash (Rotated)<br/>Body: { accessToken: "eyJ..." }
    Client->>AuthServ: Update in-memory token & replay original request
```

### Security Guarantees
- **No Token in LocalStorage**: Access tokens exist exclusively in memory, completely eliminating XSS token theft.
- **Cross-Tab Synchronization**: `BroadcastChannel("roombae-auth")` synchronizes login and logout states across multiple browser tabs without exposing token strings.
- **Refresh Token Rotation (RTR)**: Every refresh request generates a new refresh token and revokes the old one. If a revoked token is reused, the entire `SessionFamily` is marked compromised and all user sessions are immediately terminated.

---

## 12. Middleware Execution Order

The exact order of middleware registration in `backend/src/app.ts` is strictly engineered to prevent security regressions:

```text
Incoming HTTP Request
 │
 ├── 1. app.set("trust proxy", 1)                  [Proxy Header Normalization]
 ├── 2. cors(corsMiddleware)                       [CORS Origin Validation & Pre-flight]
 ├── 3. correlationIdMiddleware                    [X-Correlation-ID Tracing Injection]
 ├── 4. helmet()                                   [CSP, HSTS, X-Frame-Options, Sniff Guard]
 ├── 5. compression()                              [Gzip / Deflate Payload Compression]
 ├── 6. cookieParser()                             [Cookie Header Parsing]
 ├── 7. express.json({ limit: "10mb" })            [JSON Body Parsing]
 ├── 8. express.urlencoded({ limit: "10mb" })      [URL-Encoded Form Parsing]
 ├── 9. passport.initialize()                      [Google OAuth Passport Strategy]
 ├── 10. mongoSanitize({ replaceWith: '_' })       [NoSQL Injection Defense]
 ├── 11. hpp()                                     [HTTP Parameter Pollution Defense]
 ├── 12. idempotencyMiddleware                     [Idempotency-Key Cache Hit Check]
 ├── 13. generalLimiter                            [Global 100 req / 15 min Rate Limiting]
 ├── 14. /soap/billing Pipeline                    [Dedicated XML Parser + XXE Filter + API Key Guard]
 ├── 15. /.well-known/jwks.json Endpoint           [Public RS256 JWKS Key Publication]
 ├── 16. /health, /ready, /live, /metrics          [Telemetry & Health Probes]
 ├── 17. tenantMiddleware                          [Multi-tenant Isolation Context]
 ├── 18. Route-Specific Middlewares:
 │       ├── Rate Limiters (loginLimiter, etc.)
 │       ├── validateCsrf
 │       ├── authenticate (RS256 JWT + tokenVersion check)
 │       ├── authorize(roles...)
 │       ├── requireKycApproved
 │       └── validate(ZodSchema)
 ├── 19. Controller Execution & Business Logic
 └── 20. globalErrorHandler                        [Unified Exception Catch & Serialization]
```

---

## 13. Database Communication & Prisma ORM Layer

RoomBae communicates with **MongoDB Atlas** exclusively through the **Prisma ORM Client** (`backend/src/config/prisma.ts`), abstracted by Domain Repositories.

### Data Modeling & Relation Architecture

```mermaid
erDiagram
    User ||--o| Owner : "has one"
    User ||--o| Resident : "has one"
    User ||--o{ UserDevice : "registers"
    User ||--o{ RefreshToken : "owns"
    Owner ||--o{ PG : "owns"
    Owner ||--o| OwnerKYC : "submits"
    Owner ||--o| BankAccount : "payouts"
    PG ||--o{ Building : "contains"
    Building ||--o{ Floor : "contains"
    Floor ||--o{ Room : "contains"
    Room ||--o{ Bed : "contains"
    Bed ||--o| Resident : "assigned to"
    PG ||--o{ Resident : "houses"
    Resident ||--o{ Payment : "makes"
    Payment ||--o| Invoice : "generates"
    Resident ||--o{ Complaint : "files"
    Resident ||--o{ Agreement : "signs"
```

### Database Guarantees
- **Atomic Multi-Document Transactions**: Financial checkout operations, batch room creation, and room transfers run within `prisma.$transaction([ ... ])`.
- **Soft Deletes**: Deletion operations on `User` and `PG` set `deletedAt = new Date()`, preserving financial audit history.
- **Sparse Indexes**: Enforced via `ensureSparseIndexes.ts` on optional unique fields (`residentCode`, `googleSubId`, `aadhaarNumber`) to prevent MongoDB `null` duplicate key conflicts.

---

## 14. Socket.IO + REST Integration Architecture

RoomBae leverages a synchronized **Dual-Channel Protocol Architecture**:

| Capability | REST API (`/api/v1`) | Socket.IO Realtime (`ws://`) |
| :--- | :--- | :--- |
| **Authentication** | Login, Registration, Token Rotation | Handshake Token Auth + Event Authorization Guard |
| **State Mutation** | Creating bookings, paying rent, filing tickets | Broadcast notification to room subscribers |
| **Data Fetching** | Heavy paginated tables, analytics metrics | Instant state invalidation signal |
| **Room Multiplexing**| N/A | `pg_{pgId}`, `owner_{ownerId}`, `resident_{residentId}` |

### Real-Time Event Catalog

```mermaid
graph LR
    BE["Backend Domain Service"]
    SocketServer["Socket.IO Server"]
    OwnerChannel["owner_{ownerId} Channel"]
    ResidentChannel["resident_{residentId} Channel"]
    PGChannel["pg_{pgId} Channel"]

    BE -->|SocketServer.emitToOwner| SocketServer
    BE -->|SocketServer.emitToResident| SocketServer
    BE -->|SocketServer.emitToPg| SocketServer

    SocketServer -->|resident:status_updated| PGChannel
    SocketServer -->|bed:status_updated| PGChannel
    SocketServer -->|billing:payment_received| OwnerChannel
    SocketServer -->|transfer:requested| OwnerChannel
    SocketServer -->|notification:received| ResidentChannel
    SocketServer -->|complaint:ticket_updated| ResidentChannel
```

| Event Name | Direction | Payload Structure | Triggering REST Action |
| :--- | :--- | :--- | :--- |
| `bed:status_updated` | Server -> Client | `{ bedId, roomId, status, residentId }` | `PUT /api/v1/beds/:id/status` |
| `resident:status_updated`| Server -> Client | `{ residentId, newStatus, timestamp }` | `PATCH /api/v1/residents/:id/status` |
| `billing:payment_received`| Server -> Client | `{ paymentId, residentId, amount, status }`| `POST /api/v1/payments/verify` |
| `complaint:ticket_created`| Server -> Client | `{ ticketCode, title, priority, pgId }` | `POST /api/v1/complaints` |
| `complaint:ticket_updated`| Server -> Client | `{ id, status, resolvedAt }` | `PUT /api/v1/complaints/:id/status` |
| `room:transfer_request_updated`| Server -> Client| `{ requestId, status, residentId }` | `POST /api/v1/rooms/transfer-requests` |
| `notification:received` | Server -> Client | `{ id, title, message, type, createdAt }` | System notifications / background cron |
| `session_revoked` | Server -> Client | `{ userId, reason, timestamp }` | `POST /api/v1/auth/logout-all` |

---

## 15. Third-Party API Integrations

```mermaid
graph TD
    API["RoomBae Backend API Gateway"]
    
    subgraph Storage & Media
        Cloudinary["Cloudinary CDN"]
        ClamAV["ClamAV Antivirus Daemon"]
    end

    subgraph Payments & Financial
        Razorpay["Razorpay Payment Gateway"]
    end

    subgraph Communication & Auth
        Twilio["Twilio Programmable SMS"]
        Brevo["Brevo SMTP / Transactional Mail"]
        GoogleOAuth["Google Identity Services"]
        Fingerprint["FingerprintJS Pro"]
    end

    API -->|Images & PDF Buffers| Cloudinary
    API -->|File Stream Buffer Scan| ClamAV
    API -->|Orders & HMAC Verification| Razorpay
    API -->|SMS OTP Dispatch| Twilio
    API -->|Transactional HTML Templates| Brevo
    API -->|OAuth 2.0 OpenID Verification| GoogleOAuth
    API -->|Browser Fingerprint Validation| Fingerprint
```

### 1. Razorpay Payment Gateway
- **Order Creation**: Calls Razorpay Orders API (`POST https://api.razorpay.com/v1/orders`) with amount in paise.
- **Cryptographic Verification**: Computes `crypto.createHmac('sha256', secret).update(orderId + "|" + paymentId).digest('hex')` and validates against `razorpaySignature`.
- **Webhooks**: Verifies webhook signatures using `RAZORPAY_WEBHOOK_SECRET`.

### 2. Cloudinary Media Storage
- **Upload Pipeline**: Streams buffers via `cloudinary.uploader.upload_stream` using auto-format (`f_auto`) and quality compression (`q_auto`).
- **Asset Replacement & Deletion**: Calls `cloudinary.uploader.destroy(publicId)` on media replacement or property teardown.

### 3. Twilio SMS Gateway
- **OTP Dispatch**: Sends 6-digit verification codes using `twilio.messages.create({ from: TWILIO_PHONE_NUMBER, to, body })`.

### 4. Brevo / SMTP Email Service
- **Transactional Dispatch**: Sends responsive HTML email templates for OTP verification, rent receipts, invoices, and password resets using NodeMailer SMTP pool (`smtp.gmail.com` / `smtp-relay.brevo.com`).

### 5. FingerprintJS Device Intelligence
- **Visitor Tracking**: Ingests browser `visitorId`, compares against historical `UserDevice` telemetry, and calculates risk scores to detect account takeovers.

---

## 16. API Security Architecture

RoomBae implements defense-in-depth across 10 security vectors:

```mermaid
graph TD
    A["Double-Submit CSRF<br/>(HMAC-SHA256 Signed Tokens)"]
    B["RS256 Asymmetric JWT<br/>(15m Lifetime + Public JWKS)"]
    C["Session Revocation Engine<br/>(TokenVersion Invalidation)"]
    D["Sliding Rate Limiter<br/>(Express-Rate-Limit per Route)"]
    E["NoSQL Injection Sanitizer<br/>(express-mongo-sanitize)"]
    F["HTTP Parameter Pollution<br/>(hpp)"]
    G["Idempotency Protection<br/>(24h Request Cache)"]
    H["ClamAV Malware Scanning<br/>(Buffer Stream Inspection)"]
    I["Anti-XXE / DTD Filter<br/>(SOAP XML Pre-Filter)"]
    J["AES-256-GCM Encryption<br/>(Bank Details & KYC At Rest)"]

    A --- B --- C --- D --- E
    F --- G --- H --- I --- J
```

1. **Double-Submit CSRF**: State-mutating routes require matching `x-csrf-token` header and `csrf-token` cookie signed with `CSRF_SECRET` verified via constant-time buffer comparisons (`crypto.timingSafeEqual`).
2. **Asymmetric RS256 Signing**: Access tokens signed using RSA-2048 private key; verified using public key without exposing secrets.
3. **Multi-Device Session Revocation**: Any security event increments `User.tokenVersion`, immediately invalidating all active JWTs across devices.
4. **Rate Limiting**: Sliding-window rate limiters prevent brute-force attacks on login (10 req/15m) and OTPs (3 req/10m).
5. **Idempotency Protection**: Mutating endpoints support `Idempotency-Key` headers, caching responses for 24 hours to prevent duplicate credit card charges.
6. **Data Encryption At Rest**: Sensitive owner bank accounts and KYC documents are encrypted using AES-256-GCM authenticated encryption (`v1:<keyId>:<iv>:<tag>:<ciphertext>`).

---

## 17. Complete API Inventory Master Catalog

The following master catalog details every endpoint exposed by the RoomBae backend:

| Method | Endpoint | Primary Consumer Component | Controller & Method | Business Service | Primary DB Collection | Auth Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Root Ping / Health | Root Handler | `PathResolver` | None | No |
| `GET` | `/health` | Kubernetes / Monitoring | `app.get("/health")` | System Health Probe | `users` (Ping) | No |
| `GET` | `/ready` | Readiness Probe | `app.get("/ready")` | Database Readiness | `users` (Ping) | No |
| `GET` | `/live` | Liveness Heartbeat | `app.get("/live")` | Liveness Heartbeat | None | No |
| `GET` | `/metrics` | Prometheus Scraper | `app.get("/metrics")` | Metrics Collector | None | No (Non-Prod) |
| `GET` | `/.well-known/jwks.json` | External JWT Verifiers | `JwksService.getJwks` | `JwtKeyService` | None | No |
| `GET` | `/api/docs` | Swagger UI Explorer | Swagger UI Express | Swagger Spec | None | No (Non-Prod) |
| `GET` | `/soap/billing?wsdl` | ERP Systems / SOAP Clients | `setupSoapServer` | `BillingService` | None | No |
| `POST` | `/soap/billing` | ERP Systems / SOAP Clients | `soapServiceImplementation`| `BillingService` | `payments` | `X-API-Key` |
| `GET` | `/api/v1/auth/csrf-token` | `AuthService.bootstrapCsrf` | `generateCsrfToken` | CSRF Middleware | None | No |
| `POST` | `/api/v1/auth/register` | `RegisterForm.tsx` | `AuthController.register` | `AuthService.register` | `users`, `refresh_tokens` | No |
| `POST` | `/api/v1/auth/login` | `LoginForm.tsx` | `AuthController.login` | `AuthService.login` | `users`, `user_devices` | No |
| `POST` | `/api/v1/auth/refresh-token` | `ApiClient` / Interceptor | `AuthController.refreshToken` | `AuthService.refreshToken`| `refresh_tokens` | Cookie |
| `POST` | `/api/v1/auth/logout` | `PublicHeader.tsx` | `AuthController.logout` | `AuthService.logout` | `refresh_tokens` | Optional |
| `POST` | `/api/v1/auth/logout-all` | `DeviceManagementSection` | `AuthController.logoutAll` | `SessionRevocationService` | `users`, `refresh_tokens` | Yes |
| `GET` | `/api/v1/auth/me` | `AuthProvider.tsx` | `AuthController.me` | `AuthService.me` | `users` | Yes |
| `GET` | `/api/v1/auth/google` | `GoogleAuthButton.tsx` | `AuthController.googleLogin` | Passport Google Strategy | None | No |
| `GET` | `/api/v1/auth/google/callback`| OAuth Redirect Route | `AuthController.googleCallback`| `AuthService.generateOAuthTokens`| `users`, `refresh_tokens` | No |
| `POST` | `/api/v1/auth/send-otp` | `Auth.tsx` | `AuthController.sendOtp` | `AuthService.sendOtp` | `phone_otps` / `email_otps` | No |
| `POST` | `/api/v1/auth/verify-otp` | `Auth.tsx` | `AuthController.verifyOtp` | `AuthService.verifyOtp` | `users`, `phone_otps` | No |
| `POST` | `/api/v1/auth/phone/send-otp` | `PhoneOtpModal.tsx` | `PhoneAuthController.sendOtp` | `PhoneAuthService.sendOtp` | `phone_otps` | No |
| `POST` | `/api/v1/auth/phone/verify-otp`| `PhoneOtpModal.tsx` | `PhoneAuthController.verifyOtp`| `PhoneAuthService.verifyOtp`| `users`, `phone_otps` | No |
| `POST` | `/api/v1/auth/phone/resend-otp`| `PhoneOtpModal.tsx` | `PhoneAuthController.resendOtp`| `PhoneAuthService.resendOtp`| `phone_otps` | No |
| `GET` | `/api/v1/auth/phone/status` | `PhoneOtpModal.tsx` | `PhoneAuthController.getStatus`| `PhoneAuthService.getStatus`| `users` | No |
| `DELETE`| `/api/v1/auth/phone/remove` | Profile Settings | `PhoneAuthController.removePhone`| `PhoneAuthService.removePhone`| `users` | Yes |
| `POST` | `/api/v1/auth/email/send-otp` | Email Verification Modal | `AuthController.sendEmailOtp` | `AuthService.sendEmailVerification`| `email_otps` | No |
| `POST` | `/api/v1/auth/email/verify-otp`| Email Verification Modal | `AuthController.verifyEmailOtp`| `AuthService.verifyEmail` | `users`, `email_otps` | No |
| `POST` | `/api/v1/auth/password/send-reset`| `ForgotPasswordModal.tsx` | `AuthController.sendPasswordReset`| `AuthService.sendPasswordReset`| `password_reset_tokens` | No |
| `POST` | `/api/v1/auth/password/verify` | `ForgotPasswordModal.tsx` | `AuthController.verifyPasswordReset`| `AuthService.verifyPasswordReset`| `users`, `password_reset_tokens` | No |
| `POST` | `/api/v1/auth/2fa/enable` | `Operations.tsx` (Settings) | `AuthController.enableTwoFactor` | `AuthService.enableTwoFactor` | `users` | Yes |
| `POST` | `/api/v1/auth/2fa/verify` | `TwoFactorModal.tsx` | `AuthController.verifyTwoFactor` | `AuthService.verifyTwoFactor` | `users`, `refresh_tokens` | No |
| `POST` | `/api/v1/auth/2fa/disable` | `Operations.tsx` (Settings) | `AuthController.disableTwoFactor`| `AuthService.disableTwoFactor`| `users` | Yes |
| `POST` | `/api/v1/security/devices/identify`| `ApiClient` / On Mount | `DeviceController.identifyDevice`| `DeviceService.identifyAndEvaluateDevice`| `user_devices`, `security_audit_events` | Yes |
| `GET` | `/api/v1/security/devices` | `DeviceManagementSection` | `DeviceController.getDevices` | `DeviceService.getUserDevices` | `user_devices` | Yes |
| `PATCH` | `/api/v1/security/devices/:id/trust`| `DeviceManagementSection`| `DeviceController.trustDevice` | `DeviceService.trustDevice` | `user_devices` | Yes |
| `POST` | `/api/v1/security/devices/:id/revoke`| `DeviceManagementSection`| `DeviceController.revokeDevice`| `DeviceService.revokeDevice` | `user_devices`, `refresh_tokens` | Yes |
| `POST` | `/api/v1/security/devices/:id/block` | `AdminConsole.tsx` | `DeviceController.blockDevice` | `DeviceService.blockDevice` | `user_devices` | Yes (Admin) |
| `GET` | `/api/v1/security/devices/events` | `DeviceManagementSection` | `DeviceController.getSecurityEvents`| `DeviceService.getSecurityEvents`| `security_audit_events` | Yes |
| `POST` | `/api/v1/owners/onboard` | `OwnerOnboardingWizard` | `OwnerController.runFullOnboarding`| `OwnerOnboardingService.onboard`| `owners`, `pgs`, `buildings`, `rooms` | Yes (Owner) |
| `GET` | `/api/v1/owners/profile` | Owner Dashboard | `OwnerController.getProfile` | `OwnerService.getProfile` | `owners` | Yes (Owner) |
| `GET` | `/api/v1/owners/:ownerId/metrics`| `BentoDashboard.tsx` | `OwnerController.getMetrics` | `OwnerService.getMetrics` | `pgs`, `payments`, `complaints` | Yes (Owner) |
| `GET` | `/api/v1/owners/:ownerId/progress`| `OwnerOnboardingWizard`| `OwnerController.getProgress` | `OwnerService.getProgress` | `owners`, `pgs` | Yes (Owner) |
| `PUT` | `/api/v1/owners/:ownerId/personal`| `PersonalStep.tsx` | `OwnerController.savePersonalDetails`| `OwnerService.savePersonalDetails`| `owners` | Yes (Owner) |
| `POST` | `/api/v1/owners/:ownerId/kyc` | `KYCStep.tsx` | `OwnerController.submitKYC` | `OwnerService.submitKYC` | `owner_kycs` | Yes (Owner) |
| `PUT` | `/api/v1/owners/:ownerId/business`| `BusinessStep.tsx` | `OwnerController.saveBusinessInfo`| `OwnerService.saveBusinessInfo`| `businesses` | Yes (Owner) |
| `PUT` | `/api/v1/owners/:ownerId/bank` | `BankStep.tsx` | `OwnerController.saveBankDetails` | `OwnerService.saveBankDetails` | `bank_accounts` | Yes (Owner) |
| `POST` | `/api/v1/owners/:ownerId/property`| `PropertyStep.tsx` | `OwnerController.registerPGProperty`| `OwnerService.registerPGProperty`| `pgs` | Yes (Owner) |
| `PUT` | `/api/v1/owners/property/:pgId/building`| `BuildingStep.tsx` | `OwnerController.configureBuilding`| `OwnerService.configureBuilding`| `buildings`, `floors` | Yes (Owner) |
| `POST` | `/api/v1/owners/property/:pgId/rooms/batch`| `BatchRooms.tsx` | `OwnerController.batchCreateRooms` | `OwnerService.batchCreateRooms`| `rooms`, `beds` | Yes (Owner) |
| `GET` | `/api/v1/properties/public` | `PGListing.tsx`, `Properties.tsx`| `PropertyController.searchPublic` | `PropertyService.searchPublic` | `pgs` | No |
| `GET` | `/api/v1/properties/:id` | `PGDetails.tsx` | `PropertyController.getById` | `PropertyService.getById` | `pgs`, `buildings`, `rooms` | No |
| `POST` | `/api/v1/properties` | `AddPropertyModal.tsx` | `PropertyController.create` | `PropertyService.create` | `pgs` | Yes (Owner KYC) |
| `GET` | `/api/v1/properties/:pgId/meal-schedules`| `PGDetails.tsx` | `PropertyController.getMealSchedules`| `PropertyService.getMealSchedules`| `meal_schedules` | Yes |
| `PUT` | `/api/v1/rooms/:roomId/convert`| `RoomConversionModal.tsx`| `RoomController.convertType` | `RoomService.convertType` | `rooms`, `beds` | Yes (Owner) |
| `GET` | `/api/v1/rooms/pg/:pgId` | Room Matrix Grid | `RoomController.listByPg` | `RoomService.listByPg` | `rooms`, `beds` | Yes |
| `POST` | `/api/v1/rooms/transfer-requests`| `RoomTransferModal.tsx` | `RoomController.createTransferRequest`| `RoomService.createTransferRequest`| `room_transfer_requests` | Yes |
| `GET` | `/api/v1/rooms/transfer-requests`| `KanbanBoards.tsx` | `RoomController.listTransferRequests`| `RoomService.listTransferRequests`| `room_transfer_requests` | Yes |
| `PUT` | `/api/v1/rooms/transfer-requests/:id/approve`| `RoomTransferModal.tsx`| `RoomController.approveTransfer`| `RoomService.approveTransfer`| `room_transfer_requests`, `beds`| Yes (Owner) |
| `PUT` | `/api/v1/rooms/transfer-requests/:id/reject`| `RoomTransferModal.tsx` | `RoomController.rejectTransfer`| `RoomService.rejectTransfer` | `room_transfer_requests` | Yes (Owner) |
| `PUT` | `/api/v1/beds/:bedId/status` | `BedManagementModal.tsx`| `BedController.updateStatus` | `BedService.updateStatus` | `beds`, `bed_histories` | Yes (Owner) |
| `POST` | `/api/v1/beds/holds` | `BedHoldModal.tsx` | `BedController.createHold` | `BedService.createHold` | `bed_holds`, `beds` | Yes (Owner) |
| `DELETE`| `/api/v1/beds/holds/:holdId` | `BedHoldModal.tsx` | `BedController.releaseHold` | `BedService.releaseHold` | `bed_holds`, `beds` | Yes (Owner) |
| `GET` | `/api/v1/beds/holds` | Bed Operations View | `BedController.listHolds` | `BedService.listHolds` | `bed_holds` | Yes |
| `GET` | `/api/v1/residents/directory`| `Residents.tsx` | `ResidentController.getDirectory`| `ResidentService.getDirectory` | `residents`, `users`, `beds` | Yes (Owner) |
| `GET` | `/api/v1/residents/portal/me`| `ResidentPortal.tsx` | `ResidentController.getPortalMe` | `ResidentService.getPortalMe` | `residents`, `pgs`, `agreements` | Yes (Resident) |
| `POST` | `/api/v1/residents/onboard` | `ResidentRegister.tsx` | `ResidentController.onboard` | `ResidentService.onboard` | `residents`, `documents` | Yes |
| `POST` | `/api/v1/residents/portal/visitor-pass`| `VisitorPassModal.tsx` | `ResidentController.createVisitorPass`| `ResidentService.createVisitorPass`| `visitors` | Yes (Resident) |
| `POST` | `/api/v1/residents/portal/gate-pass`| `GatePassModal.tsx` | `ResidentController.createGatePass` | `ResidentService.createGatePass` | `check_ins`, `check_outs` | Yes (Resident) |
| `PATCH` | `/api/v1/residents/:residentId/status`| `Residents.tsx` | `ResidentController.updateStatus` | `ResidentService.updateStatus` | `residents`, `resident_status_histories`| Yes (Owner) |
| `GET` | `/api/v1/residents/:residentId/status-history`| `ResidentProfileModal.tsx`| `ResidentController.getStatusHistory`| `ResidentService.getStatusHistory`| `resident_status_histories`| Yes (Owner) |
| `GET` | `/api/v1/residents/:id` | `ResidentProfileModal.tsx`| `ResidentController.getResidentById`| `ResidentService.getResidentById`| `residents` | Yes |
| `GET` | `/api/v1/billing/fine-rules` | Fine Rules Manager | `BillingController.getFineRules` | `BillingService.getFineRules` | `fine_rules` | Yes (Owner) |
| `POST` | `/api/v1/billing/fines` | Fine Issue Dialog | `BillingController.issueFine` | `BillingService.issueFine` | `fines` | Yes (Owner) |
| `POST` | `/api/v1/billing/fines/:id/waive`| Resident Dues Table | `BillingController.waiveFine` | `BillingService.waiveFine` | `fines` | Yes (Owner) |
| `POST` | `/api/v1/payments/create-order`| `PayRentModal.tsx` | `PaymentController.createOrder` | `PaymentService.createOrder` | `payments`, `invoices` | Yes |
| `POST` | `/api/v1/payments/verify` | `RazorpayCheckout` | `PaymentController.verifyPayment` | `PaymentService.verifyPayment` | `payments`, `invoices` | Yes |
| `POST` | `/api/v1/payments/webhook` | External Razorpay Hook | `PaymentController.handleWebhook`| `PaymentService.handleWebhook` | `payments`, `payment_webhook_logs` | Webhook Sig |
| `GET` | `/api/v1/payments/history` | `Billing.tsx` | `PaymentController.getPaymentHistory`| `PaymentService.getPaymentHistory`| `payments`, `invoices` | Yes |
| `GET` | `/api/v1/payments/analytics` | `Billing.tsx` | `PaymentController.getPaymentAnalytics`| `PaymentService.getPaymentAnalytics`| `payment_analytics` | Yes |
| `GET` | `/api/v1/payments/export/csv` | `Billing.tsx` (Export CSV)| `PaymentController.exportPaymentsCsv`| `PaymentService.exportPaymentsCsv`| `payments` | Yes |
| `POST` | `/api/v1/payments/:id/refund` | Refund Dialog | `PaymentController.processRefund` | `PaymentService.processRefund` | `payments` | Yes (Owner) |
| `POST` | `/api/v1/complaints` | `Complaints.tsx` | `ComplaintController.create` | `ComplaintService.create` | `complaints` | Yes |
| `GET` | `/api/v1/complaints` | `Complaints.tsx` | `ComplaintController.list` | `ComplaintService.list` | `complaints` | Yes (Owner) |
| `PUT` | `/api/v1/complaints/:id/status`| `Complaints.tsx` | `ComplaintController.updateStatus`| `ComplaintService.updateStatus`| `complaints` | Yes (Owner) |
| `POST` | `/api/v1/agreements/generate`| Agreement Generator | `AgreementController.generate` | `AgreementService.generate` | `agreements` | Yes |
| `GET` | `/api/v1/agreements/:id` | Agreement Viewer | `AgreementController.getById` | `AgreementService.getById` | `agreements`, `signatures` | Yes |
| `POST` | `/api/v1/agreements/:id/sign`| `LeaseSignCanvas` | `AgreementController.sign` | `AgreementService.sign` | `agreements`, `signatures` | Yes |
| `GET` | `/api/v1/agreements/verify/:agreementNumber`| QR Verification Page | `AgreementController.verify` | `AgreementService.verify` | `agreements`, `verifications`| No |
| `GET` | `/api/v1/documents/invoice/:entityId`| `useDocumentDownload` | `DocumentController.downloadInvoice`| `DocumentService.downloadDocument`| `generated_documents`, `invoices`| Yes |
| `GET` | `/api/v1/documents/receipt/:entityId`| `useDocumentDownload` | `DocumentController.downloadReceipt`| `DocumentService.downloadDocument`| `generated_documents`, `payments`| Yes |
| `GET` | `/api/v1/documents/agreement/:entityId`| `useDocumentDownload` | `DocumentController.downloadAgreement`| `DocumentService.downloadDocument`| `generated_documents`, `agreements`| Yes |
| `GET` | `/api/v1/documents/kyc/:entityId`| `useDocumentDownload` | `DocumentController.downloadKyc` | `DocumentService.downloadDocument`| `generated_documents`, `owner_kycs`| Yes |
| `GET` | `/api/v1/documents/refund/:entityId`| `useDocumentDownload` | `DocumentController.downloadRefund` | `DocumentService.downloadDocument`| `generated_documents` | Yes |
| `GET` | `/api/v1/search` | `useSearch.ts` | `SearchController.search` | `SearchService.search` | `pgs`, `residents`, `rooms` | Yes |
| `GET` | `/api/v1/analytics/revenue` | `Analytics.tsx` | `AnalyticsController.getRevenue` | `AnalyticsService.getRevenue` | `payments`, `analytics` | Yes (Owner) |
| `GET` | `/api/v1/analytics/pg/:pgId` | `Analytics.tsx` | `AnalyticsController.getByPg` | `AnalyticsService.getByPg` | `analytics`, `pgs` | Yes (Owner) |
| `GET` | `/api/v1/notifications` | `useNotifications.ts` | `NotificationController.list` | `NotificationService.list` | `notifications` | Yes |
| `PUT` | `/api/v1/notifications/:id/read`| `useNotifications.ts` | `NotificationController.markRead`| `NotificationService.markRead` | `notifications` | Yes |
| `POST` | `/api/v1/marketing` | Campaign Creator | `MarketingController.create` | `MarketingService.create` | `marketing_campaigns` | Yes (Admin/Owner) |
| `POST` | `/api/v1/marketing/send` | Campaign Dispatcher | `MarketingController.send` | `MarketingService.send` | `marketing_campaigns`, `email_logs` | Yes (Admin/Owner) |
| `POST` | `/api/v1/tours/shortlist/:propertyId`| `ShortlistPage.tsx` | `ToursController.toggleShortlist` | `ToursService.toggleShortlist` | `shortlists` | Yes |
| `GET` | `/api/v1/tours/shortlist` | `ShortlistPage.tsx` | `ToursController.getShortlist` | `ToursService.getShortlist` | `shortlists`, `pgs` | Yes |
| `POST` | `/api/v1/tours` | `ToursPage.tsx` | `ToursController.requestTour` | `ToursService.requestTour` | `tours` | Yes |
| `GET` | `/api/v1/tours` | `ToursPage.tsx` | `ToursController.getTours` | `ToursService.getTours` | `tours`, `pgs` | Yes |
| `PATCH` | `/api/v1/tours/:id` | `ToursPage.tsx` | `ToursController.updateTourStatus`| `ToursService.updateTourStatus` | `tours` | Yes |
| `POST` | `/api/v1/applications` | `ApplicationPage.tsx` | `ApplicationsController.create` | `ApplicationsService.create` | `applications` | Yes |
| `GET` | `/api/v1/applications` | `ApplicationPage.tsx` | `ApplicationsController.list` | `ApplicationsService.list` | `applications`, `pgs` | Yes |
| `GET` | `/api/v1/applications/:id` | `ApplicationPage.tsx` | `ApplicationsController.getById`| `ApplicationsService.getById` | `applications`, `users` | Yes |
| `POST` | `/api/v1/applications/:id/documents`| `ApplicationPage.tsx` | `ApplicationsController.uploadDocument`| `ApplicationsService.uploadDocument`| `application_documents` | Yes |
| `PATCH` | `/api/v1/applications/:id/status`| `ApplicationPage.tsx` | `ApplicationsController.updateStatus`| `ApplicationsService.updateStatus`| `applications` | Yes (Owner) |
| `POST` | `/api/v1/applications/:id/sign-lease`| `ApplicationPage.tsx` | `ApplicationsController.signLease`| `ApplicationsService.signLease`| `lease_signatures` | Yes |
| `POST` | `/api/v1/messages/thread` | `MoveInDashboardPage.tsx`| `MessagesController.getOrCreateThread`| `MessagesService.getOrCreateThread`| `chat_threads` | Yes |
| `GET` | `/api/v1/messages/threads` | `MoveInDashboardPage.tsx`| `MessagesController.getUserThreads`| `MessagesService.getUserThreads` | `chat_threads` | Yes |
| `GET` | `/api/v1/messages/thread/:threadId`| `MoveInDashboardPage.tsx`| `MessagesController.getThreadMessages`| `MessagesService.getThreadMessages`| `messages` | Yes |
| `POST` | `/api/v1/messages` | `MoveInDashboardPage.tsx`| `MessagesController.sendMessage`| `MessagesService.sendMessage` | `messages`, `chat_threads` | Yes |
| `GET` | `/api/v1/move-in/tenant-summary`| `MoveInDashboardPage.tsx`| `MoveInController.getTenantDashboardSummary`| `MoveInService.getTenantSummary`| `move_in_infos`, `residents`| Yes (Resident) |
| `GET` | `/api/v1/move-in/:propertyId` | `MoveInDashboardPage.tsx`| `MoveInController.getMoveInInfo` | `MoveInService.getMoveInInfo` | `move_in_infos` | Yes |
| `POST` | `/api/v1/move-in/:propertyId` | Move-In Settings Modal | `MoveInController.upsertMoveInInfo`| `MoveInService.upsertMoveInInfo`| `move_in_infos` | Yes (Owner) |
| `POST` | `/api/v1/media/upload/single` | `MediaService.uploadSingle`| `MediaController.uploadSingle` | `CloudinaryService.uploadFile` | `media_records` | Yes |
| `POST` | `/api/v1/media/upload/multiple`| `MediaService.uploadMultiple`| `MediaController.uploadMultiple`| `CloudinaryService.uploadFile` | `media_records` | Yes |
| `PUT` | `/api/v1/media/replace/:publicId`| `MediaService.replaceImage`| `MediaController.replaceImage` | `CloudinaryService.replaceFile`| `media_records` | Yes |
| `DELETE`| `/api/v1/media/:publicId` | Gallery Editor | `MediaController.deleteImage` | `CloudinaryService.deleteFile` | `media_records` | Yes |
| `POST` | `/api/v1/media/bulk-delete` | Gallery Editor | `MediaController.bulkDeleteImages`| `CloudinaryService.bulkDeleteFiles`| `media_records` | Yes |
| `GET` | `/api/v1/media/metadata/:publicId`| Media Inspector | `MediaController.getMetadata` | `CloudinaryService.getAssetMetadata`| `media_records` | Yes |
| `PATCH` | `/api/v1/media/reorder` | Gallery Sorter | `MediaController.reorderImages`| `MediaRepository.updateOrder` | `media_records` | Yes |
| `POST` | `/api/v1/upload/image` | Legacy Upload | `UploadController.handleUpload`| `CloudinaryService.uploadFile` | `media_records` | Yes |
| `POST` | `/api/v1/upload/document` | Legacy Upload | `UploadController.handleUpload`| `CloudinaryService.uploadFile` | `media_records` | Yes |
| `GET` | `/api/v1/dashboard/overview` | `BentoDashboard.tsx` | `DashboardController.getOverview`| `DashboardService.getOverview` | `pgs`, `residents`, `payments` | Yes (Owner) |
| `GET` | `/api/v1/dashboard/revenue` | `Dashboard.tsx` | `DashboardController.getRevenueAnalytics`| `DashboardService.getRevenue` | `payments` | Yes (Owner) |
| `GET` | `/api/v1/dashboard/occupancy`| `Dashboard.tsx` | `DashboardController.getOccupancyAnalytics`| `DashboardService.getOccupancy`| `beds`, `rooms` | Yes (Owner) |
| `GET` | `/api/v1/settings/admin/verification-queue`| `AdminConsole.tsx` | `SettingsController.getVerificationQueue`| `SettingsService.getQueue` | `owner_kycs`, `pgs` | Yes (Admin) |
| `POST` | `/api/v1/settings/admin/approve-pg/:pgId`| `AdminConsole.tsx` | `SettingsController.approvePg` | `SettingsService.approvePg` | `pgs` | Yes (Admin) |
| `POST` | `/api/v1/settings/account/delete`| Account Settings Modal | `SettingsController.deleteAccount`| `SettingsService.deleteAccount`| `users` (Soft Delete) | Yes |
| `GET` | `/api/v1/settings/audit-logs` | Security Audit Viewer | `SettingsController.getAuditLogs`| `SettingsService.getAuditLogs` | `activity_logs` | Yes (Admin) |

---

## 18. Folder-to-Communication Architecture Mapping

```text
RoomBae/
├── frontend/src/
│   ├── app/
│   │   ├── App.tsx                    [App root, navigation state, OAuth listener, mobile modals]
│   │   ├── routes.tsx                 [Client router, RoleGuard & RouteGuard protection]
│   │   └── providers.tsx              [React context composition (Theme, Auth, Navigation)]
│   ├── features/                      [Domain-driven feature slices]
│   │   ├── auth/                      [Login, registration, 2FA, OTP verification UI]
│   │   ├── properties/                [PG listing, details, marketplace search & cards]
│   │   ├── residents/                 [Resident directory, resident portal, KYC intake]
│   │   ├── billing/                   [Payment history, Razorpay checkout, PDF downloads]
│   │   ├── complaints/                [Ticket filing, Kanban boards, room transfer actions]
│   │   ├── analytics/                 [Revenue intelligence, MRR, occupancy rate charts]
│   │   ├── search/                    [Shortlists, tours, applications, chat messaging]
│   │   ├── operations/                [Room conversion, bed matrix, visitor logs, settings]
│   │   └── settings/                  [FingerprintJS device security manager, 2FA setup]
│   ├── hooks/                         [Custom hooks: useAuth, useDocumentDownload, useRealtime]
│   ├── services/                      [Typed frontend API wrappers & fetch singleton]
│   │   ├── api.ts                     [Core ApiClient, in-memory JWT, CSRF injection, 401 retry]
│   │   ├── auth.service.ts            [Auth state management & cross-tab BroadcastChannel]
│   │   ├── fileDownload.service.ts    [Secure blob streaming with Bearer token headers]
│   │   ├── deviceIdentity.ts          [FingerprintJS visitor ID extractor]
│   │   └── socket.ts                  [Socket.IO client connection & reconnection listener]
│   └── config/                        [Dynamic environment configuration (env.ts, api.ts)]
│
└── backend/src/
    ├── app.ts                         [Express gateway setup, CORS, Helmet, security pipeline]
    ├── server.ts                      [HTTP server, cluster master, MongoDB check, SocketServer init]
    ├── container/                     [Dependency Injection container wiring services & repos]
    ├── routes/                        [Global apiRouter & static route registrations]
    ├── modules/                       [Modular Enterprise Feature Packages]
    │   ├── auth/                      [auth.routes.ts, auth.controller.ts, auth.service.ts, auth.repository.ts]
    │   ├── phone-auth/                [phoneAuth.routes.ts, phoneAuth.controller.ts, Twilio SMS engine]
    │   ├── devices/                   [device.routes.ts, device.controller.ts, DeviceFingerprintService]
    │   ├── owners/                    [owner.routes.ts, owner.controller.ts, OwnerOnboardingService]
    │   ├── properties/                [property.routes.ts, property.controller.ts, PropertyService]
    │   ├── rooms/                     [room.routes.ts, room.controller.ts, RoomService]
    │   ├── beds/                      [bed.routes.ts, bed.controller.ts, BedService]
    │   ├── residents/                 [resident.routes.ts, resident.controller.ts, ResidentService]
    │   ├── billing/                   [billing.routes.ts, billing.controller.ts, BillingService]
    │   ├── payments/                  [payment.routes.ts, payment.controller.ts, RazorpayStrategy]
    │   ├── complaints/                [complaint.routes.ts, complaint.controller.ts, ComplaintService]
    │   ├── agreements/                [agreement.routes.ts, agreement.controller.ts, PdfKitAgreementService]
    │   ├── documents/                 [documents.routes.ts, documents.controller.ts, DocumentService]
    │   ├── tours/                     [tours.routes.ts, tours.controller.ts, ToursService]
    │   ├── applications/              [applications.routes.ts, applications.controller.ts, ApplicationsService]
    │   ├── messages/                  [messages.routes.ts, messages.controller.ts, MessagesService]
    │   ├── moveIn/                    [moveIn.routes.ts, moveIn.controller.ts, MoveInService]
    │   └── marketing/                 [marketing.routes.ts, marketing.controller.ts, BrevoEmailService]
    ├── middleware/                    [Authentication, Authorization, Rate Limiting, CSRF, Idempotency]
    ├── services/security/             [RS256 JwtKeyService, JwksService, TokenVersionService, SessionRevocationService]
    ├── infrastructure/                [BcryptCryptoService, PdfKitInvoiceService, DatabaseOtpService]
    ├── socket/                        [socketServer.ts Engine.IO manager, SocketSessionService]
    └── prisma/                        [schema.prisma authoritative MongoDB data schema & models]
```

---

## 19. Environment Variable Matrix

The table below catalogs every environment variable across local development and production deployments. *(All credentials and keys are masked with `********` for security).*

| Environment Variable | Local Value (`.env.development`) | Production Value (`.env.production`) | Target Component / Consumer |
| :--- | :--- | :--- | :--- |
| `PORT` | `5000` | `5000` | `backend/src/server.ts` |
| `NODE_ENV` | `development` | `production` | Environment toggles, Swagger, Error traces |
| `CLIENT_URL` | `http://localhost:5173` | `https://ayushman-glb.github.io/PG-Management-System` | CORS Origin Whitelist |
| `FRONTEND_URL` | `http://localhost:5173` | `https://ayushman-glb.github.io/PG-Management-System` | CORS & OAuth redirect resolver |
| `API_BASE_URL` | `http://localhost:5000` | `https://pg-management-system-boxb.onrender.com` | Root API URL, Swagger, SOAP Address |
| `API_PREFIX` | `/api/v1` | `/api/v1` | Express REST router mount prefix |
| `DATABASE_URL` | `mongodb+srv://********:********@pgm.7dp53y4.mongodb.net/roombae-db?...` | `mongodb+srv://********:********@pgm.7dp53y4.mongodb.net/roombae-db?...` | Prisma ORM & MongoDB Atlas ReplicaSet |
| `JWT_SECRET` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | JWT fallback & OAuth state signing |
| `JWT_REFRESH_SECRET` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Refresh token cryptographic signing |
| `JWT_ACCESS_EXPIRATION`| `15m` | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRATION`| `7d` | `7d` | Refresh token lifespan |
| `SESSION_SECRET` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Session encryption & token secret fallback |
| `COOKIE_SECRET` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Cookie parser signed cookie secret |
| `CSRF_SECRET` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | HMAC-SHA256 Double-Submit CSRF secret |
| `PASSWORD_RESET_SECRET`| `********` *(64-hex chars)* | `********` *(64-hex chars)* | Password reset token HMAC secret |
| `EMAIL_VERIFICATION_SECRET`| `********` *(64-hex chars)* | `********` *(64-hex chars)* | Email verification OTP HMAC secret |
| `API_KEY_SECRET` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Internal API service key secret |
| `SOAP_BILLING_API_KEY`| `********` *(64-hex chars)* | `********` *(64-hex chars)* | SOAP ERP `/soap/billing` `X-API-Key` guard |
| `AES_256_KEY` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Application-level AES-256-GCM encryption |
| `ENCRYPTION_KEY` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Bank account AES-256-GCM encryption |
| `KYC_ENCRYPTION_KEY` | `********` *(64-hex chars)* | `********` *(64-hex chars)* | Aadhaar & PAN document encryption |
| `CLOUDINARY_CLOUD_NAME`| `RoomBae` | `RoomBae` | Cloudinary CDN Account Name |
| `CLOUDINARY_API_KEY` | `********` | `********` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| `********` | `********` | Cloudinary API Secret |
| `CLOUDINARY_FOLDER_PREFIX`| `RoomBae-development` | `RoomBae-Production` | Cloudinary root folder prefix |
| `RAZORPAY_KEY_ID` | `rzp_test_TQlnZDKJSAnPV0` | `rzp_live_********` | Razorpay Client ID (Frontend & Orders) |
| `RAZORPAY_KEY_SECRET` | `********` | `********` | Razorpay API Secret (HMAC verification) |
| `RAZORPAY_WEBHOOK_SECRET`| `********` | `********` | Razorpay Webhook HMAC signature key |
| `GOOGLE_CLIENT_ID` | `355023139206-********.apps.googleusercontent.com` | `355023139206-********.apps.googleusercontent.com` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET`| `********` | `********` | Google OAuth 2.0 Secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/v1/auth/google/callback` | `https://pg-management-system-boxb.onrender.com/api/v1/auth/google/callback` | Google OAuth redirect URI |
| `MAIL_HOST` | `smtp.gmail.com` | `smtp-relay.brevo.com` / `smtp.gmail.com` | SMTP Host Server |
| `MAIL_PORT` | `587` | `587` | SMTP Port |
| `MAIL_USER` | `ayushmansaha917@gmail.com` | `ayushman@globussoft.in` | SMTP Authentication User |
| `MAIL_APP_PASSWORD` | `********` | `********` | SMTP App Password |
| `TWILIO_ACCOUNT_SID` | `AC********` | `AC********` | Twilio SMS Account SID |
| `TWILIO_AUTH_TOKEN` | `********` | `********` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | `+17372508034` | `+17372508034` | Twilio Sender Phone Number |
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | `https://pg-management-system-boxb.onrender.com/api/v1` | Frontend API Target Base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | `https://pg-management-system-boxb.onrender.com` | Frontend Socket.IO Engine URL |

---

## 20. Appendix: Standards, Conventions & Formats

### 20.1 API Naming Conventions
- **Resource Naming**: Plural nouns for resource collections (`/api/v1/properties`, `/api/v1/residents`, `/api/v1/complaints`).
- **Sub-resource Nesting**: Parent-child relationship URL hierarchy (`/api/v1/agreements/resident/:residentId`, `/api/v1/properties/:pgId/meal-schedules`).
- **Actions & Commands**: Verb segments reserved for non-CRUD transactional triggers (`/generate`, `/sign`, `/verify`, `/create-order`, `/waive`, `/send-otp`).
- **Casing**: Lowercase, kebab-case for URL segments (`/visitor-pass`, `/gate-pass`, `/send-phone-otp`).

### 20.2 Pagination Contract
All paginated list endpoints return uniform metadata:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

### 20.3 Sorting & Filtering Conventions
- **Search Queries**: `?search=malhotra` or `?q=whitefield`
- **Field Filters**: `?status=ACTIVE&roomType=DOUBLE&city=Bangalore`
- **Date Ranges**: `?startDate=2026-08-01T00:00:00Z&endDate=2026-08-31T23:59:59Z`
- **Sorting**: `?sortBy=createdAt&order=desc`

### 20.4 Secure File Upload Conventions
- Form data field name for single file uploads is always `file` (`multipart/form-data`).
- Batch upload field name is `files` with a hard limit of `10` files.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `application/pdf`.
- Maximum file payload size: `10MB` (`10485760` bytes).

---

> **Document Version**: `2.4.0-enterprise`  
> **Last Verified**: `August 20, 2026`  
> **Maintainer**: RoomBae Core Architecture & Engineering Team  
