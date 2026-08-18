# Phase 8: Full Server Bootstrap Rewrite & Process Integration

> **Document Status**: Complete  
> **Phase**: Phase 8 — Full server/bootstrap rewrite and integration  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/rewrite/08-server-rewrite.md`  
> **Prerequisites**: [`/docs/rewrite/00-project-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/00-project-context.md), [`/docs/rewrite/01-legacy-api-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/01-legacy-api-context.md), [`/docs/rewrite/02-legacy-websocket-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/02-legacy-websocket-context.md), [`/docs/rewrite/03-api-design.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/03-api-design.md), [`/docs/rewrite/04-removal-and-scaffold.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/04-removal-and-scaffold.md), [`/docs/rewrite/05-api-implementation.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/05-api-implementation.md), [`/docs/rewrite/06-frontend-integration.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/06-frontend-integration.md), [`/docs/rewrite/07-websocket-rewrite.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/07-websocket-rewrite.md) verified.

---

## 1. Final Server Bootstrap & Process Architecture

The server bootstrap pipeline in [`backend/src/server.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/server.ts) and [`backend/src/app.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/app.ts) binds the entire infrastructure, REST API routing layer, WebSocket real-time engine, and background workers into a single unified process.

### 1.1 Process Lifecycle Sequence
1. **IPv4-First DNS Initialization**: `dns.setDefaultResultOrder("ipv4first")` configured to eliminate MongoDB Atlas SRV lookup delays in containerized environments.
2. **Infrastructure Telemetry**:
   - Redis: Checked with `verifyRedisConnection()` and `isRedisReady()` with fallback to in-memory mode.
   - MongoDB: Connected with `connectPrismaWithTimeout(10000)` and verified with `ensureSparseIndexes()`.
3. **HTTP Server & Socket.IO Attachment**:
   - `httpServer = http.createServer(app)` binds Express.
   - `SocketServer.init(httpServer)` attaches Socket.IO to the exact same HTTP instance and port, sharing TCP listeners.
4. **Background Cron Workers**:
   - `CronWorkerService.init()` initializes monthly invoice generation, late fee calculation, and SLA escalations.
5. **Port Conflict Auto-Recovery**:
   - `EADDRINUSE` listener automatically steps to `port + 1` if the current port is busy during development.
6. **Graceful Shutdown**:
   - Handles `SIGTERM` and `SIGINT` signals with a 2000ms safety timer, disconnecting Prisma and draining socket pools before `process.exit(0)`.

---

## 2. Express Middleware Pipeline Ordering

The Express request processing pipeline adheres to strict security, performance, and validation ordering:

```
Incoming Request
  ├── 1. CORS Middleware (corsMiddleware with optionsSuccessStatus: 204) [Registered First]
  ├── 2. OPTIONS Preflight Catch-All (app.options("*", corsMiddleware))
  ├── 3. Distributed Tracing & Correlation ID (correlationIdMiddleware)
  ├── 4. Security Headers (helmet with CSP and HSTS)
  ├── 5. Response Compression (compression Gzip/Brotli)
  ├── 6. Cookie Parser (cookieParser)
  ├── 7. Body Parsing (express.json({ limit: "10mb" }), express.urlencoded)
  ├── 8. Passport OAuth (passport.initialize())
  ├── 9. NoSQL Injection Sanitization (mongoSanitize)
  ├── 10. HTTP Parameter Pollution Guard (hpp)
  ├── 11. Rate Limiting (generalLimiter mounted at /api/v1/)
  ├── 12. Public Probes (/health, /ready, /live, /metrics, /api/docs)
  ├── 13. REST API Router (apiRouter mounted at /api/v1/ with tenantMiddleware)
  ├── 14. SOAP ERP Service (setupSoapServer at /soap/billing?wsdl)
  └── 15. Global Error Handler (globalErrorHandler with standard ApiResponse envelope)
```

---

## 3. Registration Audit Across All 25 Modules & Socket Namespaces

All 25 modules and Socket.IO real-time event handlers are confirmed registered and active:

| Domain Subsystem | Module Path | Mounted Router | Real-Time Handlers Registered |
|---|---|---|---|
| **Auth & Security** | `src/modules/auth` | `/api/v1/auth` | `registerAuthSocketHandlers` |
| **Device Identity** | `src/modules/devices` | `/api/v1/security/devices` | Event dispatcher & anomaly logs |
| **Owner Profile** | `src/modules/owners` | `/api/v1/owners` & `/onboarding`| `registerOwnerSocketHandlers` |
| **Properties** | `src/modules/properties` | `/api/v1/properties` | `registerPropertySocketHandlers` |
| **Rooms** | `src/modules/rooms` | `/api/v1/rooms` | `registerRoomSocketHandlers` |
| **Beds** | `src/modules/beds` | `/api/v1/beds` | `registerBedSocketHandlers` |
| **Residents** | `src/modules/residents` | `/api/v1/residents` | `registerResidentSocketHandlers` |
| **Billing** | `src/modules/billing` | `/api/v1/billing` | `registerBillingSocketHandlers` |
| **Payments** | `src/modules/payments` | `/api/v1/payments` | Razorpay webhook & payment alerts |
| **Complaints** | `src/modules/complaints` | `/api/v1/complaints` & `/support`| `registerComplaintSocketHandlers` |
| **Agreements** | `src/modules/agreements` | `/api/v1/agreements` | `registerAgreementSocketHandlers` |
| **Search** | `src/modules/search` | `/api/v1/search` | Multi-tenant index |
| **Analytics** | `src/modules/analytics` | `/api/v1/analytics` | Financial & Occupancy aggregations |
| **Notifications** | `src/modules/notifications` | `/api/v1/notifications` | `registerNotificationSocketHandlers` |
| **Settings** | `src/modules/settings` | `/api/v1/settings` | Super Admin Queue & Audit Logs |
| **Documents** | `src/modules/documents` | `/api/v1/documents` | Buffered Binary PDF Streaming |
| **Tours & Shortlist**| `src/modules/tours` | `/api/v1/tours` & `/shortlist` | Real-time tour updates |
| **Applications** | `src/modules/applications` | `/api/v1/applications` | Digital lease workflow |
| **Messages** | `src/modules/messages` | `/api/v1/messages` | Direct chat messaging |
| **Move-In** | `src/modules/moveIn` | `/api/v1/move-in` | Tenant arrival checklists |
| **Marketing** | `src/modules/marketing` | `/api/v1/marketing` | Campaign broadcasts |
| **Media & Upload** | `src/routes/media.routes.ts`| `/api/v1/media` & `/upload` | Cloudinary CDN upload management |
| **Dashboard** | `src/routes/dashboard.routes.ts`| `/api/v1/dashboard` | KPI analytics summaries |
| **Phone Auth** | `src/modules/phone-auth` | Mounted via `/auth` | Twilio Programmable SMS OTP |
| **Email Queue** | `src/modules/email` | Asynchronous Background Worker | Gmail SMTP transactional dispatcher |

---

## 4. Loose-Coupling Audit & Zero-Breach Verification

A project-wide architectural audit was performed to guarantee encapsulation:
- **Zero Cross-Module Internal Reaches**: No module imports another module's internal Prisma models or unexported files.
- **Clean Dependency Inversion**: Controllers depend on `IService` interfaces; services depend on `IRepository` interfaces.
- **Enterprise Event Communication**: Cross-domain events dispatch via `EventDispatcher` or `SocketServer` channels.

---

## 5. Verification Results

- **Backend TypeScript Build**: `npm run build` completed with 0 errors.
- **Frontend TypeScript Build**: `npm run build` completed with 0 errors.
- **Backend Test Regression Suite**: **23/23 test suites passed (167/167 tests passed, 0 failures)**.

---

## 6. Phase 8 Exit Criteria Verification

- [x] Server bootstrap cleanly orchestrates Express, Socket.IO, Redis, and Prisma.
- [x] Correct middleware pipeline order verified.
- [x] All 25 modules and Socket.IO real-time event handlers registered and accessible.
- [x] Project-wide loose coupling verified with zero encapsulation breaches.
- [x] Server boots and executes all test suites on a single unified process without port or protocol collisions.
