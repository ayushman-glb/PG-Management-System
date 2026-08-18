# RoomBae Platform — Master Architecture & Integration Context

> **Document Status**: Production Gold Standard  
> **Phase**: Phase 11 — Final Consolidation  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/rewrite/MASTER-CONTEXT.md`  
> **Source Documents Synthesized**: `/docs/rewrite/00-project-context.md` through `/docs/rewrite/10-test-log.md`

---

## 1. Executive Summary & System Overview

**RoomBae** is an enterprise-grade multi-tenant PG (Paying Guest) and co-living property management platform designed for high-concurrency property operations, real-time tenant communications, automated billing, and secure device-aware identity management.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ROOMBAE ARCHITECTURE                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Frontend (SPA)     │ React 19 + Vite 6 + Tailwind CSS v4 + TanStack Query + Zustand   │
│  Hosting            │ GitHub Pages (https://ayushman-glb.github.io/PG-Management-System│
│  Backend (API & WS) │ Node.js (TypeScript) + Express.js + Socket.IO (Shared Port)      │
│  Backend Hosting    │ Render (https://pg-management-system-boxb.onrender.com)          │
│  Database           │ MongoDB Atlas 7.0 (Replica Set) via Prisma ORM 5.22.0            │
│  Cache & Locks      │ Redis 7.x (with seamless In-Memory fallback mode)                │
│  Protocols          │ REST API (v1 JSON) + Socket.IO (v4 WSS) + SOAP 1.1 (ERP Billing) │
│  Security           │ Argon2id, AES-256-GCM, HMAC SHA-256 JWT, FingerprintJS Device ID │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Global Compliance & Zero-Touch Environment Declaration

> [!IMPORTANT]
> **Zero-Touch Environment Policy Verification**:
> Across all 11 phases of the API and WebSocket architecture modernization, **zero environment files (`.env`, `.env.local`, `.env.production`, `.env.example`, or variants) were created, edited, opened, or logged**. All configuration variables and credentials remain untouched in their original secure environment stores.

---

## 3. Canonical REST API Specification (`/api/v1/*`)

All REST endpoints are grouped under `/api/v1/`, employ strict HTTP verb semantics, enforce multi-tenant isolation via `tenantId` and `propertyId`, and return a uniform `ApiResponse<T>` envelope.

### 3.1 Standard Response Envelope Structure
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 3.2 Complete Endpoint Catalog
| Domain Module | Method | Canonical Route | Auth | RBAC Role | Purpose & Parameters |
|---|---|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | None | Public | Register new owner or resident account |
| | `POST` | `/api/v1/auth/login` | None | Public | Authenticate via email/phone + password + FingerprintJS |
| | `GET` | `/api/v1/auth/me` | Bearer | All Roles | Retrieve authenticated profile & active session |
| | `POST` | `/api/v1/auth/refresh-token` | Bearer/Body | All Roles | Rotate access token using valid refresh token |
| | `POST` | `/api/v1/auth/logout` | Bearer | All Roles | Revoke active refresh token & session record |
| | `POST` | `/api/v1/auth/2fa/generate` | Bearer | All Roles | Generate TOTP 2FA secret and QR code URL |
| | `POST` | `/api/v1/auth/2fa/verify` | Bearer | All Roles | Verify TOTP code and enable 2FA on account |
| | `POST` | `/api/v1/auth/2fa/disable` | Bearer | All Roles | Disable 2FA with current TOTP validation |
| | `POST` | `/api/v1/auth/phone/send-otp` | None | Public | Request SMS OTP via Twilio integration |
| | `POST` | `/api/v1/auth/phone/verify-otp` | None | Public | Verify SMS OTP and issue auth tokens |
| **Devices** | `GET` | `/api/v1/security/devices` | Bearer | All Roles | List all known client devices & sessions |
| | `DELETE`| `/api/v1/security/devices/:id`| Bearer | All Roles | Remotely terminate a specific session |
| | `DELETE`| `/api/v1/security/devices/all`| Bearer | All Roles | Terminate all sessions except current device |
| **Properties** | `GET` | `/api/v1/properties` | Bearer | All Roles | List properties (`?search=&city=&page=&limit=`) |
| | `POST` | `/api/v1/properties` | Bearer | `OWNER`, `ADMIN` | Create new property profile |
| | `GET` | `/api/v1/properties/:id` | Bearer | All Roles | Retrieve single property details |
| | `PUT` | `/api/v1/properties/:id` | Bearer | `OWNER`, `ADMIN` | Full property update |
| | `DELETE`| `/api/v1/properties/:id` | Bearer | `OWNER`, `ADMIN` | Soft delete property profile |
| **Rooms** | `GET` | `/api/v1/rooms` | Bearer | All Roles | List rooms (`?propertyId=&floor=&status=`) |
| | `POST` | `/api/v1/rooms` | Bearer | `OWNER`, `ADMIN` | Create room with bed configurations |
| | `GET` | `/api/v1/rooms/:id` | Bearer | All Roles | Retrieve room details & bed occupants |
| | `PUT` | `/api/v1/rooms/:id` | Bearer | `OWNER`, `ADMIN` | Full room update |
| | `PUT` | `/api/v1/rooms/:id/convert` | Bearer | `OWNER`, `ADMIN` | Convert room sharing type (`DOUBLE`, `TRIPLE`) |
| | `DELETE`| `/api/v1/rooms/:id` | Bearer | `OWNER`, `ADMIN` | Soft delete room |
| **Beds** | `GET` | `/api/v1/beds` | Bearer | All Roles | List beds (`?roomId=&status=&available=true`) |
| | `POST` | `/api/v1/beds` | Bearer | `OWNER`, `ADMIN` | Add new bed to existing room |
| | `GET` | `/api/v1/beds/:id` | Bearer | All Roles | Retrieve bed details & resident info |
| | `PATCH` | `/api/v1/beds/:id/hold` | Bearer | `OWNER`, `ADMIN` | Temporarily hold bed with lock timeout |
| | `PATCH` | `/api/v1/beds/:id/release` | Bearer | `OWNER`, `ADMIN` | Release held bed to available inventory |
| | `DELETE`| `/api/v1/beds/:id` | Bearer | `OWNER`, `ADMIN` | Remove bed from inventory |
| **Residents** | `GET` | `/api/v1/residents` | Bearer | `OWNER`, `ADMIN` | List residents (`?propertyId=&status=&page=`) |
| | `POST` | `/api/v1/residents` | Bearer | `OWNER`, `ADMIN` | Check-in & onboard new resident |
| | `GET` | `/api/v1/residents/portal/me`| Bearer | `RESIDENT` | Resident portal profile, room & dues |
| | `GET` | `/api/v1/residents/:id` | Bearer | All Roles | Retrieve single resident record |
| | `PATCH` | `/api/v1/residents/:id/status` | Bearer | `OWNER`, `ADMIN` | Update resident status (`ACTIVE`, `NOTICE`, `LEFT`) |
| | `POST` | `/api/v1/residents/:id/transfer` | Bearer | `OWNER`, `ADMIN` | Transfer resident to a new bed/room |
| | `DELETE`| `/api/v1/residents/:id` | Bearer | `OWNER`, `ADMIN` | Check-out and archive resident |
| **Billing** | `GET` | `/api/v1/billing/invoices` | Bearer | All Roles | List invoices (`?residentId=&status=&month=`) |
| | `POST` | `/api/v1/billing/invoices` | Bearer | `OWNER`, `ADMIN` | Generate monthly rental invoice |
| | `GET` | `/api/v1/billing/invoices/:id` | Bearer | All Roles | Retrieve single invoice details |
| | `POST` | `/api/v1/billing/invoices/generate-monthly` | Bearer | `OWNER`, `ADMIN` | Bulk monthly billing trigger |
| **Payments** | `POST` | `/api/v1/payments/create-order` | Bearer | `RESIDENT`, `OWNER` | Create Razorpay payment order |
| | `POST` | `/api/v1/payments/verify` | Bearer | `RESIDENT`, `OWNER` | Verify Razorpay HMAC signature & receipt |
| | `POST` | `/api/v1/payments/webhook` | None | Razorpay Signature | Razorpay payment capture webhook |
| | `POST` | `/api/v1/payments/:id/refund` | Bearer | `OWNER`, `ADMIN` | Issue refund on transaction |
| **Complaints** | `GET` | `/api/v1/complaints` | Bearer | All Roles | List complaints (`?propertyId=&status=`) |
| | `POST` | `/api/v1/complaints` | Bearer | `RESIDENT` | Lodge maintenance/service complaint |
| | `GET` | `/api/v1/complaints/:id` | Bearer | All Roles | Retrieve complaint timeline & photos |
| | `PATCH` | `/api/v1/complaints/:id/status` | Bearer | `OWNER`, `ADMIN` | Update complaint status (`RESOLVED`, etc.) |
| **Documents** | `GET` | `/api/v1/documents/:id/download` | Bearer | All Roles | Download buffered binary PDF |
| **Dashboard** | `GET` | `/api/v1/dashboard/overview` | Bearer | `OWNER`, `ADMIN` | Summary metrics: occupancy, dues, stats |
| **Settings** | `GET` | `/api/v1/settings/audit-logs` | Bearer | `ADMIN`, `OWNER` | Multi-tenant audit trail logs |
| | `GET` | `/api/v1/settings/admin/verification-queue` | Bearer | `ADMIN` | Super Admin PG owner KYC approval queue |
| **Media** | `POST` | `/api/v1/media/upload` | Bearer | All Roles | Upload image assets to Cloudinary CDN |
| **Probes** | `GET` | `/health` | None | Public | System status, DB ping, Redis status |
| | `GET` | `/ready` | None | Public | Kubernetes/Render traffic readiness probe |
| | `GET` | `/live` | None | Public | Liveness probe |
| **SOAP** | `GET/POST`| `/soap/billing?wsdl` | None | Public/SOAP | SOAP 1.1 ERP Billing integration |

---

## 4. Real-Time WebSocket Architecture & Event Specification

The Socket.IO engine binds directly to the primary HTTP server on the root path `/socket.io/`, sharing ports and TCP listeners.

### 4.1 Handshake Sequence & CORS Origin Normalization
1. **Transport Upgrade**: Client initiates HTTP GET to `/socket.io/?EIO=4&transport=polling` with `Origin: https://ayushman-glb.github.io`.
2. **Origin Verification**: Server parses `new URL(origin).origin.toLowerCase()`. Browsers never pass subpaths in the `Origin` header (RFC 6454); this normalization ensures instant handshake approval.
3. **Handshake Authentication**: The socket connection is authenticated via `socket.handshake.auth.token` (or `socket.handshake.headers.authorization`). Invalid or missing tokens return `Authentication failed [Handshake]: Token required`.
4. **Protocol Switch**: Returns `101 Switching Protocols`, transitioning to bidirectional WebSocket frames with heartbeat ping/pong (25s interval, 20s timeout).

### 4.2 Real-Time Event Catalog
| Event Channel | Direction | Target Room / Scope | Payload Schema | Functional Trigger |
|---|---|---|---|---|
| `bed:updated` | Server ➔ Client | `pg_{propertyId}` | `{ bedId, roomId, status, isOccupied, updatedAt }` | Bed allocation, hold, release |
| `room:updated` | Server ➔ Client | `pg_{propertyId}` | `{ roomId, roomNumber, totalBeds, availableBeds, type }` | Room conversion, bed changes |
| `resident:checked-in` | Server ➔ Client | `pg_{propertyId}` | `{ residentId, name, roomNumber, bedNumber, checkInDate }` | New resident check-in |
| `resident:checked-out`| Server ➔ Client | `pg_{propertyId}` | `{ residentId, name, roomNumber, checkOutDate }` | Resident departure |
| `resident:status-changed`| Server ➔ Client| `resident_{residentId}`, `pg_{propertyId}` | `{ residentId, status, updatedAt }` | Status transition (`NOTICE`, `ACTIVE`) |
| `complaint:created` | Server ➔ Client | `pg_{propertyId}` | `{ complaintId, title, category, priority, residentName }` | Resident lodges complaint |
| `complaint:updated` | Server ➔ Client | `pg_{propertyId}`, `resident_{residentId}` | `{ complaintId, status, resolutionNotes, updatedBy }` | Staff updates complaint status |
| `complaint:sla-escalated`| Server ➔ Client| `pg_{propertyId}` | `{ complaintId, title, daysPending, escalatedAt }` | Background SLA worker trigger |
| `invoice:created` | Server ➔ Client | `resident_{residentId}` | `{ invoiceId, invoiceNumber, amount, dueDate, month }` | Monthly billing generation |
| `invoice:paid` | Server ➔ Client | `resident_{residentId}`, `pg_{propertyId}` | `{ invoiceId, transactionId, amountPaid, paidAt }` | Successful payment capture |
| `payment:success` | Server ➔ Client | `resident_{residentId}` | `{ paymentId, orderId, amount, receiptUrl }` | Razorpay webhook verification |
| `security:session-revoked`| Server ➔ Client| `user_{userId}` | `{ sessionId, reason, timestamp }` | Remote session kill / anomaly |
| `notification:new` | Server ➔ Client | `user_{userId}` | `{ id, type, title, message, createdAt }` | In-app notification broadcast |
| `join:pg` | Client ➔ Server | Server Router | `{ propertyId }` | Client joins property room |
| `leave:pg` | Client ➔ Server | Server Router | `{ propertyId }` | Client leaves property room |
| `auth:refresh-socket-token`| Client ➔ Server| Server Router | `{ token }` | Client updates token mid-session |

---

## 5. FingerprintJS & Device Security Architecture

RoomBae incorporates zero-friction client device fingerprinting to prevent account hijacking, credential stuffing, and session sharing.

```
Client (Browser)
  ├── 1. Generate Visitor ID via @fingerprintjs/fingerprintjs
  ├── 2. Attach `X-Visitor-Id` & `User-Agent` to all Axios REST requests
  └── 3. Send `visitorId` in Socket.IO handshake auth
          │
          ▼
Backend Express Pipeline
  ├── 1. `deviceIdentityMiddleware` extracts `visitorId`, IP, and user-agent
  ├── 2. `DeviceService` computes Trust Score (0–100) based on historical presence
  ├── 3. Impossible Travel / Anomaly Detection: triggers 401 on suspicious geo-jump
  └── 4. Active Session Registry in MongoDB & Redis for instant remote termination
```

---

## 6. Architectural Decisions & Rationale

1. **Dependency Inversion & Loose Coupling**:
   - Every module follows `Controller ➔ Interface ➔ Service ➔ Interface ➔ Repository`. No controller directly references Prisma, and no module imports another module's internal Prisma models.
2. **Shared Express + Socket.IO Port Binding**:
   - The HTTP server instance is created once (`http.createServer(app)`) and shared with Socket.IO (`SocketServer.init(httpServer)`), avoiding port fragmentation on Render.
3. **MongoDB Partial Indexing**:
   - Replaced MongoDB compound unique constraints with partial/sparse unique indexes (`ensureSparseIndexes()`) allowing multiple soft-deleted records (`deletedAt: null`).
4. **Buffered Binary PDF Streaming**:
   - PDFKit document generators buffer binary output in memory via `Buffer.concat` before setting headers, preventing chunk-encoding termination errors.
5. **Multi-Channel Token Resolution**:
   - Auth middleware inspects `Authorization: Bearer <token>`, `req.cookies.token`, and `req.body.token`, with frontend fallback support for legacy token key names.

---

## 7. Retired Surfaces & Technical Rationale

| Retired Surface | Location | Technical Rationale |
|---|---|---|
| Duplicate Forwarder Routes | `backend/src/routes/residentManagementRoutes.ts`, `saasManagementRoutes.ts`, etc. | Redundant alias files bypassed middleware chains and created inconsistent route resolution. |
| Obsolete Controllers | `backend/src/controllers/*` (12 legacy files) | Replaced by domain module controllers in `backend/src/modules/*/`. |
| GraphQL Apollo Server | Previously unmounted | Fully retired in favor of typed REST v1 and Socket.IO; verified zero frontend calls. |

---

## 8. Failure Catalog & Resolution Summary

All 8 historical failures (`FAIL-01` through `FAIL-08`) and 6 intermediate defects (`DEF-01` through `DEF-06`) were resolved and verified with 100% pass rates across 3 testing tiers.

| Issue Code | Description | Root Cause | Permanent Resolution |
|---|---|---|---|
| `FAIL-01` | CORS 500 on OPTIONS login | Uncaught error callback in CORS | CORS registered 1st; `callback(null, false)` with 204 |
| `FAIL-02` | 401s on `/auth/me` & refresh | Missing token header normalization | Multi-channel dual-bearer resolver + key fallback |
| `FAIL-03` | `getPortalMe` missing profile | Relational error on null bed | Null-safe resident bootstrap without bed dependency |
| `FAIL-04` | Socket.IO 400 handshake error | Subpath origin string mismatch | RFC 6454 `new URL(origin).origin` normalization |
| `FAIL-05` | Redis TLS startup crash | Unhandled `rediss://` TLS config | Protocol parser with automatic In-Memory fallback |
| `FAIL-06` | Infinite 2FA login loop | Inconditional 2FA challenge | Gated strictly behind `isTwoFactorEnabled === true` |
| `FAIL-07` | PDFKit premature stream close | Pipe stream closed before flush | Buffered binary in-memory `Buffer.concat` streaming |
| `FAIL-08` | Gmail SMTP socket timeout | Synchronous blocking mail send | Non-blocking async queue with background worker |
| `DEF-01` | `PATCH /residents/:id/status` | Unhandled Prisma P2025 | Added `findUnique` pre-check returning `404 Not Found` |
| `DEF-02` | `PUT /rooms/:id/convert` | Raw string cast to Prisma enum | Added `RoomType` enum whitelist returning `400 Bad Request` |

---

## 9. Test Verification & Build Integrity Metrics

- **Tier 1 (Isolated Unit Tests)**: 13 Suites | 98/98 Tests Passed (100%)
- **Tier 2 (Grouped Integration Flows)**: 7 Suites | 48/48 Tests Passed (100%)
- **Tier 3 (Full End-to-End System Regression)**: 23 Suites | 167/167 Tests Passed (100%)
- **Frontend Vite Production Bundle**: `tsc -b && vite build` built in 566ms with 0 type errors.
- **Backend TypeScript Build**: `npm run build` compiled with 0 errors.

---

## 10. Known Limitations, Non-Goals & Recommended Follow-Ups

1. **Non-Goals**:
   - GraphQL re-introduction (REST v1 + Socket.IO fully covers all client requirements).
   - Third-party OAuth providers beyond Google (architecture is ready via Passport strategy pattern).
2. **Recommended Follow-Ups**:
   - Set up GitHub Actions CI/CD to run `npx jest` and `npm run build` on pull requests to `main`.
   - Configure Redis cluster replication in production Render dashboard when horizontal scaling is required.
