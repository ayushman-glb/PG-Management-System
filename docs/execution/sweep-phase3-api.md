# Sweep Phase 3 Execution Report — API Surface Layer

**Phase Scope:** REST controllers, SOAP WSDL services, rate limiting coverage, parameter validation, and connection pool optimization.  
**Execution Timestamp:** 2026-08-13  
**Status:** COMPLETE & VERIFIED  

> [!NOTE]
> **Architectural Note regarding GraphQL**: Per project directive (`--important graphql is removed ...do not test that`), the GraphQL service surface has been removed from scope and is no longer exposed or tested in this application.

---

## 1. Executive Summary

Phase 3 conducted a comprehensive defect sweep across the active API surface layer (REST & SOAP):
- **Rate Limiting Coverage on SOAP Endpoint**: Identified that the SOAP WSDL service mounted at `/soap/billing` was sitting outside `env.API_PREFIX` (`/api/v1`) and bypassed `generalLimiter`. Updated `app.ts` to explicitly apply `generalLimiter` to `/soap/billing`.
- **SOAP Service Parameter Handling**: Enhanced `GetInvoiceDetails` in `backend/src/services/soapService.ts` with safe parameter parsing (`args && typeof args.invoiceNumber === "string"`), preventing unhandled `TypeError` exceptions on malformed SOAP XML body requests.
- **Database Connection Pool Exhaustion Fix**: Eliminated duplicate `new PrismaClient()` instantiations across 10 controllers/routes (`dashboard.controller.ts`, `ownerOnboardingController.ts`, `saasManagementRoutes.ts`, `search.controller.ts`, `settings.controller.ts`, `room.controller.ts`, `owner.controller.ts`, `analytics.controller.ts`, `notification.controller.ts`, `bed.controller.ts`), replacing them with the centralized `prisma` singleton.
- **Consistent Error Response Format**: Confirmed REST error handling formats responses as `{ success: false, message: "...", error: "..." }` with standardized HTTP status codes (400, 401, 403, 404, 409, 429, 500).

---

## 2. Defects Identified & Fixes Applied

### 1. `backend/src/app.ts`
- **Defect**: Rate limiting middleware (`generalLimiter`) was registered under `env.API_PREFIX` (`/api/v1`). The SOAP ERP endpoint at `/soap/billing` bypassed rate limiting.
  - **Fix**: Added `app.use("/soap/billing", generalLimiter);` before route registration.

### 2. `backend/src/services/soapService.ts`
- **Defect**: SOAP handler `GetInvoiceDetails` accessed `args.invoiceNumber` directly. A missing or non-string argument in a SOAP envelope caused a Node process thread error.
  - **Fix**: Implemented safe string parameter extraction `const invNum = (args && typeof args.invoiceNumber === "string") ? args.invoiceNumber.trim() : "";`.

### 3. Database Connection Pool Optimization (10 API Modules)
- **Defect**: 10 separate API modules instantiated `new PrismaClient()` directly instead of consuming the central Prisma singleton, exhausting database connection limits to MongoDB Atlas under concurrent requests.
  - **Fix**: Replaced all duplicate instantiations with `import { prisma } from '../config/prisma'`.

---

## 3. Real CLI Test Execution Output

```text
> roombae-backend@1.0.0 test:integration
> jest src/__tests__/integration --detectOpenHandles src/__tests__/integration/apiSweep.test.ts

PASS src/__tests__/integration/apiSweep.test.ts (6.899 s)
  ● Console

    console.log
      ✅ Cloudinary SDK initialized [Cloud: test_cloud, Environment Prefix: RoomBae-test]
    console.log
      [INFO] [2026-08-13T10:58:30.526Z] ✅ SOAP ERP Billing WSDL service initialized at /soap/billing?wsdl

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        10.252 s
Ran all test suites matching src/__tests__/integration|src/__tests__/integration/apiSweep.test.ts.
```
