# Master Test Plan — RoomBae Enterprise Multi-Tenant Platform

> **Document Status**: Production Ready  
> **Phase**: Phase 1 — Comprehensive QA & Test Automation Plan  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/testing/MASTER-TEST-PLAN.md`  
> **Author**: Autonomous Senior QA + Test Automation Engineer

---

## 1. Test Architecture & Layer Hierarchy

This test plan provides complete verification across nine testing layers (A through I), specifically mapped to the concrete files, modules, and business rules of the RoomBae codebase.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROOMBAE TEST PLAN MATRIX                        │
├────────────────────────────────────────────────────────────────────────┤
│  Layer A: Static Analysis & Security Auditing                          │
│  Layer B: Unit Testing (Logic & Component Isolation)                   │
│  Layer C: Integration Testing (Seams, DB, Cache, WS, 3rd-Party)        │
│  Layer D: System & End-to-End Testing (Full User Journeys)             │
│  Layer E: API Contract & Routing Semantics (25 Modules)                │
│  Layer F: Security & Device-Fingerprint Session Enforcement            │
│  Layer G: Non-Functional Testing (Perf, Reliability, A11y)             │
│  Layer H: Infrastructure, Probes & Graceful Shutdown                   │
│  Layer I: Permanent Regression Safety Net                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Layer Specifications

### Layer A: Static Analysis & Schema Integrity (No Execution)
- **A.1 Backend Type-Checking**: `npm run typecheck` (`tsc --noEmit -p tsconfig.json` & `tsconfig.build.json`).
- **A.2 Frontend Type-Checking**: `npm run lint` (`tsc -b` in `/frontend`).
- **A.3 Prisma Schema Contract Review**:
  - Verify all 36 models in [`backend/prisma/schema.prisma`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma) match repository queries.
  - Verify compound indexes (`@@unique([userId, visitorIdHash])`, `@@index([residentCode])`).
- **A.4 API Payload Schema Review**:
  - Verify all Zod DTO schemas in `src/modules/*/dto/` match frontend contract interfaces in `frontend/src/types/`.

---

### Layer B: Unit Testing (Smallest Units, Fully Isolated)
| Target File / Module | Tested Logic & Invariants | Test File Location |
|---|---|---|
| `src/modules/auth/auth.dto.ts` | Zod schemas: email format, strong password, phone OTP | `src/__tests__/unit/auth.dto.test.ts` |
| `src/utils/cryptoService.ts` | Argon2id hashing, timing-safe compare, AES-256-GCM | `src/__tests__/unit/crypto.test.ts` |
| `src/utils/tokenService.ts` | JWT HMAC SHA-256 signing, expiration, claim decoding | `src/__tests__/unit/jwtTokenService.test.ts` |
| `src/modules/devices/device.riskEngine.ts` | Anomaly calculation, device trust level transitions | `src/__tests__/unit/deviceAnomaly.test.ts` |
| `src/modules/payments/payment.service.ts` | Razorpay webhook HMAC SHA-256 validation | `src/__tests__/unit/paymentSystem.test.ts` |
| `src/modules/phone-auth/twilio.service.ts`| OTP generation, expiry calculation, lockout | `src/__tests__/unit/phoneAuth.test.ts` |
| `src/modules/email/email.queue.ts` | Async non-blocking mail queue state machine | `src/__tests__/unit/gmailEmailService.test.ts` |
| `src/middleware/rateLimiter.ts` | Burst rate limiter counters and key extraction | `src/__tests__/unit/rateLimiter.test.ts` |

---

### Layer C: Integration Testing (Seams & Infrastructure)
- **C.1 API ↔ Service ↔ Prisma DB**:
  - `src/__tests__/unit/databaseSweep.test.ts`: Foreign-key cascade safety, null-safe profile bootstrapping.
- **C.2 Redis Cache & Cluster Fallback**:
  - `src/__tests__/unit/redisDevPipeline.test.ts`: Redis SET/GET/DEL, TTL expiration, seamless fallback to in-memory `MemoryStore`.
- **C.3 Background Cron Workers**:
  - `src/__tests__/unit/backendSweep.test.ts`: `CronWorkerService` monthly rent invoice generation, late fine calculation, complaint SLA auto-escalation.
- **C.4 WebSocket Real-Time Engine**:
  - `src/__tests__/unit/websocketSuite.test.ts`: Socket.IO handshake auth, origin normalization (`https://ayushman-glb.github.io`), room join (`pg_*`, `resident_*`, `user_*`), event broadcasting.
- **C.5 Third-Party Integrations**:
  - Mocked endpoints for Razorpay, Twilio, Gmail SMTP, and Cloudinary.

---

### Layer D: System & End-to-End Testing (Full Stack Journeys)
- **Journey 1 (Resident Onboarding & Portal)**:
  - Register Resident ➔ Verify Contact ➔ Login ➔ View Assigned Bed & Rent Due ➔ Lodge Complaint ➔ Pay Invoice.
- **Journey 2 (PG Owner Operations & KYC)**:
  - Register Owner ➔ Complete Profile ➔ Create Property ➔ Add Rooms & Beds ➔ Check-in Resident ➔ Convert Room Sharing Type ➔ Review Dashboard Analytics.
- **Journey 3 (Real-Time Synchronized State)**:
  - Owner updates bed status (`HOLD`) ➔ Server persists to DB and emits `bed:updated` ➔ Resident client receives event and live-updates UI without reload.

---

### Layer E: API Contract & Route Semantics
- Enforce strict HTTP verb rules across all 25 modules:
  - `GET` for idempotent reads with pagination (`?page=&limit=`).
  - `POST` for resource creation (`201 Created`).
  - `PUT` for full replacements.
  - `PATCH` for partial state updates.
  - `DELETE` for soft deletes.
  - Rejection of invalid verbs with `405 Method Not Allowed`.
  - Rejection of malformed bodies with `400 Bad Request` or `422 Unprocessable Entity`.
  - Multi-tenant scoping with `403 Forbidden` on cross-tenant access.

---

### Layer F: Security & Project-Specific Session Enforcement

#### F.1 Standard Security Gates
- **AuthN / AuthZ**: Strict password validation, account lockout after failed attempts, role permissions.
- **Token Security**: Blacklisting on logout, refresh token rotation, replay detection.
- **Injection & Payload Protection**: `mongoSanitize` against NoSQL injection, `hpp` against parameter pollution, `xss-clean` sanitization, strict MIME file validation.

#### F.2 Project-Specific Device-Fingerprinting & Session Rules
1. **Same-Credential, Same-Instant Multi-Device Login Attempts**:
   - High-concurrency test: Simultaneous login attempts from 5 distinct device visitor IDs using the same credentials within a 1-second window.
   - Requirement: Account-level serialization/rate-limiting via atomic lock; all attempts recorded in audit history.
2. **Concurrent Session Cap (1 Desktop + 1 Mobile Max)**:
   - Device Category Classification: Extracted from user-agent and visitor fingerprint (`DESKTOP`, `MOBILE`, `TABLET`).
   - Forced-Logout Semantics: When a user logs in on a second device of the *same* category, the prior session in that category is terminated immediately:
     - Refresh token revoked in DB and Redis.
     - WebSocket server emits `security:session-revoked` to `user_{userId}` with `sessionId`.
     - Active socket for the terminated session is disconnected.
     - Subsequent API requests from the old session return `401 Unauthorized`.
   - Non-Conflicting Multi-Device: 1 active Desktop session + 1 active Mobile session remain simultaneously valid.
3. **Append-Only Login & Device History Persistence**:
   - Every login attempt (Success, Failed, Blocked, Forced-Logout) creates a permanent record in `LoginHistory` and `SecurityAuditEvent`.
   - Forced-logout events logged with distinct metadata linking the incoming and evicted session IDs.
4. **Abuse-Path Protection**:
   - Replayed/tampered fingerprint payloads rejected or flagged with elevated risk score.
   - Forced-logout DoS rate-limiting: Abuse attempts to repeatedly evict a target account are bounded and flagged as `SUSPICIOUS_LOGIN`.

---

### Layer G: Non-Functional Testing
- **Performance & Latency Baseline**:
  - Verify `/health`, `/ready`, `/api/v1/properties`, and `/api/v1/auth/login` achieve <50ms response latency under local test harness.
- **Reliability & Graceful Degradation**:
  - Test server behavior when Redis is stopped: system automatically degrades to `MemoryStore` without crash or data loss.
  - Test server behavior when MongoDB latency spikes: probes return `503 Service Unavailable` cleanly without socket hanging.
- **Memory & Resource Leak Testing**:
  - 1,000 rapid sequential requests to verify heap stabilization and zero event listener leaks.
- **Accessibility & Frontend UI**:
  - Check keyboard navigation, ARIA labels, and contrast across all dashboard views.

---

### Layer H: Infrastructure & Deployment Probes
- **Startup / Shutdown Lifecycle**:
  - Node DNS `ipv4first` configuration verified.
  - `SIGTERM` / `SIGINT` signal trapping cleanly closes Socket.IO and Prisma within 2,000ms.
- **Probes**:
  - `/health` (Deep health check: DB, Redis, SMTP, memory).
  - `/ready` (Readiness check for traffic ingress).
  - `/live` (Liveness check).
  - `/metrics` (Prometheus metrics in non-production).

---

### Layer I: Regression Safety Net
- Permanent test cases maintained in `backend/src/__tests__/regression/` mapping to `FAIL-01` through `FAIL-08` and `DEF-01` through `DEF-06`.

---

## 3. Execution Schedule & Gates

```
Phase 2 Execution Pipeline:
1. Isolate (Unit Tests - Layer B) ➔ 100% Pass Gate
2. Pairwise Merge (Integration Tests - Layer C) ➔ 100% Pass Gate
3. Subsystem Merge (Security & Session Rules - Layer F) ➔ 100% Pass Gate
4. Full System (End-to-End & Non-Functional - Layers D, E, G, H, I) ➔ 100% Clean Single Pass
```
