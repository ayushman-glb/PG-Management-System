# Phase 6: Frontend API Rewire & Tier-2 Integration Verification

> **Document Status**: Complete  
> **Phase**: Phase 6 — Rewire the frontend to the new REST endpoints  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/rewrite/06-frontend-integration.md`  
> **Prerequisites**: [`/docs/rewrite/00-project-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/00-project-context.md), [`/docs/rewrite/01-legacy-api-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/01-legacy-api-context.md), [`/docs/rewrite/02-legacy-websocket-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/02-legacy-websocket-context.md), [`/docs/rewrite/03-api-design.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/03-api-design.md), [`/docs/rewrite/04-removal-and-scaffold.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/04-removal-and-scaffold.md), [`/docs/rewrite/05-api-implementation.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/05-api-implementation.md) verified.

---

## 1. Summary of Frontend Rewiring Across Feature Areas

Every frontend service, feature component, and API constant was audited and updated from legacy duplicate paths (`/resident-management/*`, `/saas/*`) to canonical resource-based endpoints under `/api/v1/`.

### 1.1 Detailed Per-File Endpoint Transition Matrix
| Frontend File Path | Feature Area | Legacy Endpoint Called | New Canonical REST Endpoint | HTTP Verb & Status |
|---|---|---|---|---|
| `frontend/src/services/bed.service.ts` | Bed Inventory | `POST /resident-management/beds/status` | `PUT /beds/:bedId/status` | `PUT` (200 OK) |
| `frontend/src/services/bed.service.ts` | Bed Holds | `POST /resident-management/beds/hold` | `POST /beds/holds` | `POST` (200 OK) |
| `frontend/src/services/bed.service.ts` | Bed Holds | `DELETE /resident-management/beds/hold/:id` | `DELETE /beds/holds/:id` | `DELETE` (200 OK) |
| `frontend/src/services/bed.service.ts` | Bed Holds | `GET /resident-management/beds/holds` | `GET /beds/holds` | `GET` (200 OK) |
| `frontend/src/services/resident.service.ts` | Resident Lifecycle | `POST /resident-management/status` | `PATCH /residents/:residentId/status` | `PATCH` (200 OK) |
| `frontend/src/services/resident.service.ts` | Resident Audits | `GET /resident-management/status/history/:id`| `GET /residents/:residentId/status-history` | `GET` (200 OK) |
| `frontend/src/services/room.service.ts` | Room Transfers | `POST /resident-management/transfers/request`| `POST /rooms/transfer-requests` | `POST` (201 Created) |
| `frontend/src/services/room.service.ts` | Room Transfers | `GET /resident-management/transfers` | `GET /rooms/transfer-requests` | `GET` (200 OK) |
| `frontend/src/services/room.service.ts` | Room Transfers | `POST /resident-management/transfers/:id/approve` | `PUT /rooms/transfer-requests/:id/approve` | `PUT` (200 OK) |
| `frontend/src/services/room.service.ts` | Room Transfers | `POST /resident-management/transfers/:id/reject` | `PUT /rooms/transfer-requests/:id/reject` | `PUT` (200 OK) |
| `frontend/src/services/room.service.ts` | Room Transfers | `POST /resident-management/transfers/:id/complete`| `POST /rooms/transfer-requests/:id/complete` | `POST` (200 OK) |
| `frontend/src/components/AuditLogDrawer.tsx` | Platform Telemetry | `GET /resident-management/audit-logs` | `GET /settings/audit-logs` | `GET` (200 OK) |
| `frontend/src/features/dashboard/pages/AdminConsole.tsx` | Super Admin Console | `GET /saas/admin/metrics` | `GET /dashboard/overview` | `GET` (200 OK) |
| `frontend/src/features/dashboard/pages/AdminConsole.tsx` | Verification Queue | `GET /saas/admin/verification-queue` | `GET /settings/admin/verification-queue` | `GET` (200 OK) |
| `frontend/src/features/rooms/components/RoomConversionModal.tsx` | Room Inventory | `POST /resident-management/rooms/convert` | `PUT /rooms/:roomId/convert` | `PUT` (200 OK) |
| `frontend/src/constants/api.ts` | Centralized Constants | All legacy enum mappings | Updated to canonical paths | Constant Table (200 OK) |

---

## 2. Multi-Protocol & Client State Verification

- **Centralized API Client (`api.ts`)**: Base URL wired to `env.API_URL` (`/api/v1/`), with automatic token refresh interception and multi-key fallback (`roombae_access_token`, `accessToken`, `token`).
- **Zustand & TanStack Query Hooks**: All queries (`useQuery`, `useMutation`) dispatch to updated `apiClient` methods.
- **GraphQL / Apollo**: Confirmed retired; frontend state uses React Query + Zustand stores with zero GraphQL dependencies.

---

## 3. Tier-2 Grouped Integration Test Results

Grouped workflows were executed against the backend to verify multi-step end-to-end cycles:

1. **Owner Registration ➔ Login ➔ Property Creation ➔ Overview Dashboard**:
   - `POST /auth/register` (Owner) ➔ `201 Created`
   - `POST /auth/login` ➔ `200 OK` (Tokens returned)
   - `GET /auth/me` ➔ `200 OK` (Profile verified)
   - `GET /dashboard/overview` ➔ `200 OK`
2. **Resident Onboarding ➔ Portal Load ➔ Passes & Meal Skips**:
   - `POST /residents/onboard` ➔ `201 Created`
   - `GET /residents/portal/me` ➔ `200 OK` (`RESIDENT_PROFILE_INCOMPLETE` prevented)
   - `POST /residents/portal/visitor-pass` ➔ `201 Created`
   - `POST /residents/meal-skip` ➔ `200 OK`
3. **Complaint Submission ➔ List Retrieval ➔ SLA Status Update**:
   - `POST /complaints` ➔ `201 Created`
   - `GET /complaints` ➔ `200 OK`
   - `PATCH /complaints/:id/status` ➔ `200 OK`
4. **Billing Order Creation ➔ Razorpay Signature Verification ➔ PDF Stream**:
   - `POST /payments/create-order` ➔ `201 Created` (Order ID + GST calculation)
   - `POST /payments/verify` ➔ `200 OK` (Marked PAID)
   - `GET /billing/invoices/:paymentId/pdf` ➔ `200 OK` (Buffered binary stream)

**Integration Test Suite**: `PASS src/__tests__/integration/authIntegration.test.ts`, `PASS src/__tests__/integration/apiSweep.test.ts` (17/17 tests passed).  
**Frontend Production Build**: `tsc -b && vite build` built in 436ms with 0 type errors.

---

## 4. Phase 6 Exit Criteria Verification

- [x] Every feature area rewired to canonical `/api/v1/` endpoints.
- [x] Zero references to legacy `/resident-management` or `/saas` paths remain in frontend.
- [x] Tier-2 grouped integration tests executed and passing with 100% success rate.
- [x] Frontend builds cleanly with zero TypeScript or Vite bundle errors.
