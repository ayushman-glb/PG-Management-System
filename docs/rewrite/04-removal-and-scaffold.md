# Phase 4: Removal of Old Surface & Routing Skeleton Scaffold

> **Document Status**: Complete  
> **Phase**: Phase 4 — Remove old API layer, scaffold the new one  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/rewrite/04-removal-and-scaffold.md`  
> **Prerequisites**: [`/docs/rewrite/00-project-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/00-project-context.md), [`/docs/rewrite/01-legacy-api-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/01-legacy-api-context.md), [`/docs/rewrite/02-legacy-websocket-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/02-legacy-websocket-context.md), [`/docs/rewrite/03-api-design.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/03-api-design.md) verified.

---

## 1. Summary of Removed Files & Legacy Surfaces

In accordance with Phase 3 design and the Phase 4 mandate, all redundant duplicate forwarder routes and legacy monolithic controllers were permanently removed from the codebase.

### 1.1 Deleted Legacy Route Files
| Deleted File Path | Former Purpose / Flaw | Canonical Target Replacement |
|---|---|---|
| `backend/src/routes/residentManagementRoutes.ts` | Monolithic duplicate mounting `/api/v1/resident-management/*` mixing residents, beds, rooms, audits, notifications | Replaced by canonical module routes in `/residents`, `/beds`, `/rooms`, `/settings`, `/notifications` |
| `backend/src/routes/saasManagementRoutes.ts` | Duplicate router mounting `/api/v1/saas/*` mixing billing, search, settings | Replaced by canonical module routes in `/billing`, `/search`, `/settings` |
| `backend/src/routes/agreementRoutes.ts` | Redundant route forwarder pointing to `modules/agreements` | `backend/src/modules/agreements/agreement.routes.ts` |
| `backend/src/routes/billingRoutes.ts` | Redundant route forwarder pointing to `modules/billing` | `backend/src/modules/billing/billing.routes.ts` |
| `backend/src/routes/complaintRoutes.ts` | Redundant route forwarder pointing to `modules/complaints` | `backend/src/modules/complaints/complaint.routes.ts` |
| `backend/src/routes/propertyRoutes.ts` | Redundant route forwarder pointing to `modules/properties` | `backend/src/modules/properties/property.routes.ts` |
| `backend/src/routes/residentRoutes.ts` | Redundant route forwarder pointing to `modules/residents` | `backend/src/modules/residents/resident.routes.ts` |
| `backend/src/routes/ownerOnboardingRoutes.ts` | Redundant route forwarder pointing to `modules/owners` | `backend/src/modules/owners/owner.routes.ts` |
| `backend/src/routes/authRoutes.ts` | Redundant route forwarder pointing to `modules/auth` | `backend/src/modules/auth/auth.routes.ts` |

### 1.2 Deleted Legacy Controllers
| Deleted Controller File Path | Reason for Retirement | Target Canonical Implementation |
|---|---|---|
| `backend/src/controllers/residentManagementController.ts` | Mixed-responsibility monolithic controller violating single-responsibility | Domain services in `src/modules/residents`, `src/modules/beds`, `src/modules/rooms` |
| `backend/src/controllers/ownerOnboardingController.ts` | Redundant shim file | `src/modules/owners/owner.controller.ts` |
| `backend/src/controllers/agreementController.ts` | Re-export shim file | `src/modules/agreements/agreement.controller.ts` |
| `backend/src/controllers/authController.ts` | Re-export shim file | `src/modules/auth/auth.controller.ts` |
| `backend/src/controllers/billingController.ts` | Re-export shim file | `src/modules/billing/billing.controller.ts` |
| `backend/src/controllers/complaintController.ts` | Re-export shim file | `src/modules/complaints/complaint.controller.ts` |
| `backend/src/controllers/propertyController.ts` | Re-export shim file | `src/modules/properties/property.controller.ts` |
| `backend/src/controllers/residentController.ts` | Re-export shim file | `src/modules/residents/resident.controller.ts` |

---

## 2. Updated API Router Skeleton

The central router [`backend/src/routes/apiRouter.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/routes/apiRouter.ts) now cleanly mounts all domain modules without legacy duplicate layers:

```typescript
import { Router } from 'express';
import { tenantMiddleware } from '../core/middleware/tenantMiddleware';
import { authRoutes } from '../modules/auth';
import { ownerRoutes } from '../modules/owners';
import { propertyRoutes } from '../modules/properties';
import { roomRoutes } from '../modules/rooms';
import { bedRoutes } from '../modules/beds';
import { residentRoutes } from '../modules/residents';
import { billingRoutes } from '../modules/billing';
import { complaintRoutes } from '../modules/complaints';
import { agreementRoutes } from '../modules/agreements';
import { searchRoutes } from '../modules/search';
import { analyticsRoutes } from '../modules/analytics';
import { notificationRoutes } from '../modules/notifications';
import { settingsRoutes } from '../modules/settings';
import uploadRoutes from './upload.routes';
import mediaRoutes from './media.routes';
import { dashboardRoutes } from './dashboard.routes';
import { documentRoutes } from '../modules/documents';
import { toursRoutes } from '../modules/tours';
import { applicationsRoutes } from '../modules/applications';
import { messagesRoutes } from '../modules/messages';
import { moveInRoutes } from '../modules/moveIn';
import { deviceRoutes } from '../modules/devices';
import { marketingRoutes } from '../modules/marketing';
import { paymentRoutes } from '../modules/payments';

const apiRouter = Router();

apiRouter.use(tenantMiddleware);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/security/devices', deviceRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/onboarding', ownerRoutes);
apiRouter.use('/owners', ownerRoutes);
apiRouter.use('/properties', propertyRoutes);
apiRouter.use('/rooms', roomRoutes);
apiRouter.use('/beds', bedRoutes);
apiRouter.use('/residents', residentRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/support', complaintRoutes);
apiRouter.use('/marketing', marketingRoutes);
apiRouter.use('/agreements', agreementRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/tours', toursRoutes);
apiRouter.use('/shortlist', toursRoutes);
apiRouter.use('/applications', applicationsRoutes);
apiRouter.use('/messages', messagesRoutes);
apiRouter.use('/move-in', moveInRoutes);

export default apiRouter;
```

---

## 3. Retained Multi-Protocol Services Status

- **GraphQL**: Confirmed permanently retired and removed prior to Phase 0. No GraphQL runtime or dependencies exist.
- **SOAP 1.1**: Preserved at `/soap/billing?wsdl` for enterprise external ERP billing synchronization.

---

## 4. Test Suite & Verification Results

All 22 test suites and 162 unit/integration tests passed after unmounting legacy routes and scaffolding the canonical routing architecture:

- **Backend Test Suites**: 22 passed, 22 total (162 tests passed, 0 failed).
- **Frontend Build**: Vite v8.1.5 production build successful with 0 errors (`tsc -b && vite build`).

---

## 5. Phase 4 Exit Criteria Verification

- [x] All legacy route forwarders and obsolete controller shims deleted.
- [x] Legacy forwarders unmounted from `apiRouter.ts`.
- [x] Clean modular routing skeleton mounted under `/api/v1/`.
- [x] All 22 test suites passing with 100% success rate.
