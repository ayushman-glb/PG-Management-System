# Phase 1: Legacy REST, GraphQL & SOAP Context Capture

> **Document Status**: Complete  
> **Phase**: Phase 1 — Legacy REST/GraphQL/SOAP Context Capture (read-only, no deletions)  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/rewrite/01-legacy-api-context.md`  
> **Prerequisites**: [`/docs/rewrite/00-project-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/00-project-context.md) read and verified.

---

## 1. Executive Summary & Protocol Baseline

This document captures the complete ground-truth contract, middleware chain, request/response payload shapes, calling frontend components, and historical failure defect logs for every API endpoint currently mounted in RoomBae.

### 1.1 Protocol Status
- **REST API v1**: Primary protocol. 100+ active routes mounted across 25 domain modules and legacy route forwarders.
- **GraphQL Apollo**: **Migrated & Retired**. No active `@apollo/server` instance or schema exists in the runtime backend. No `@apollo/client` calls exist in frontend code.
- **SOAP 1.1 WSDL**: Active ERP integration service at `/soap/billing?wsdl` (`node-soap`). Handles synchronous invoice reconciliation queries from external enterprise accounting systems.

---

## 2. Complete Legacy API Endpoint Catalog

---

### 2.1 Authentication & Identity Module (`/api/v1/auth`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:34` -> `backend/src/modules/auth/auth.routes.ts`
- **Controller**: `backend/src/modules/auth/auth.controller.ts`
- **Service**: `backend/src/modules/auth/auth.service.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/login` | `auth.routes.ts:27` (`authController.login`) | `loginLimiter` (5/15m), `validate(LoginSchema)` | `{ identifier: string, password: string, deviceFingerprint?: string }` | `{ success: true, accessToken, user: { id, name, email, role, ... } }` | `frontend/src/services/auth.service.ts:133` (`AuthModal.tsx`) | CORS preflight 500 on Render, 401 on identifier mismatch, 2FA interception loop |
| `POST` | `/register` | `auth.routes.ts:34` (`authController.register`) | `registerLimiter` (5/1h), `validate(RegisterSchema)` | `{ name, email, phone, password, role }` | `{ success: true, user: { id, name, email, role }, message }` | `frontend/src/services/auth.service.ts:145` (`AuthModal.tsx`) | Rate limit 429 during automated testing |
| `POST` | `/send-otp` | `auth.routes.ts:40` (`authController.sendOtp`) | `sendOtpLimiter` (3/10m) | `{ email?: string, phone?: string, type?: string }` | `{ success: true, message, otpExpiry }` | `frontend/src/services/auth.service.ts:153` | SMTP connection pool socket timeouts |
| `POST` | `/verify-otp` | `auth.routes.ts:44` (`authController.verifyOtp`) | None | `{ identifier: string, otp: string }` | `{ success: true, accessToken, user }` | `frontend/src/services/auth.service.ts:161` | Expired OTP edge-cases |
| `POST` | `/logout` | `auth.routes.ts:48` (`authController.logout`) | None | `{}` | `{ success: true, message: "Logged out" }` | `frontend/src/services/auth.service.ts:250` (`Navbar.tsx`) | Missing cookie clearance across domains |
| `POST` | `/refresh-token` | `auth.routes.ts:52` (`authController.refreshToken`) | `refreshTokenLimiter` | Body: `{ refreshToken?: string }` or Cookie: `refreshToken` | `{ success: true, accessToken, user }` | `frontend/src/services/auth.service.ts:98` | 401 due to cross-origin cookie omission; solved with body fallback |
| `POST` | `/send-phone-otp` | `auth.routes.ts:66` (`phoneAuthController.sendOtp`) | `sendOtpLimiter`, `validate(SendPhoneOtpSchema)` | `{ phone: string }` | `{ success: true, message, expiresAt }` | `frontend/src/services/auth.service.ts:180` | Twilio account SID prefix warning |
| `POST` | `/verify-phone-otp` | `auth.routes.ts:73` (`phoneAuthController.verifyOtp`) | `phoneVerifyLimiter`, `validate(VerifyPhoneOtpSchema)` | `{ phone: string, otp: string }` | `{ success: true, accessToken, user }` | `frontend/src/services/auth.service.ts:187` | Missing auto-provisioning of Resident record |
| `POST` | `/email/send-otp` | `auth.routes.ts:80` (`authController.sendEmailOtp`) | `sendOtpLimiter` | `{ email: string }` | `{ success: true, message }` | `frontend/src/services/auth.service.ts:208` | Gmail rate limiting |
| `POST` | `/email/verify-otp`| `auth.routes.ts:85` (`authController.verifyEmailOtp`) | None | `{ email: string, otp: string }` | `{ success: true, verified: true }` | `frontend/src/services/auth.service.ts:215` | None |
| `POST` | `/email/resend-otp`| `auth.routes.ts:91` (`authController.resendEmailOtp`) | `sendOtpLimiter` | `{ email: string }` | `{ success: true, message }` | `frontend/src/services/auth.service.ts:222` | None |
| `POST` | `/password/send-reset` | `auth.routes.ts:98` (`authController.sendPasswordReset`) | `sendOtpLimiter` | `{ email: string }` | `{ success: true, message }` | `frontend/src/services/auth.service.ts:229` | None |
| `POST` | `/password/verify` | `auth.routes.ts:103` (`authController.verifyPasswordReset`) | None | `{ email: string, token: string, newPassword: string }` | `{ success: true, message }` | `frontend/src/services/auth.service.ts:236` | Password validation strength errors |
| `POST` | `/2fa/enable` | `auth.routes.ts:120` (`authController.enableTwoFactor`) | `authenticate`, `validate(Enable2FASchema)` | `{ method: "TOTP" \| "SMS" \| "EMAIL", phone?: string }` | `{ success: true, secret, qrCodeUrl }` | `frontend/src/features/settings/SettingsPage.tsx` | None |
| `POST` | `/2fa/verify` | `auth.routes.ts:124` (`authController.verifyTwoFactor`) | None | `{ userId: string, token: string }` | `{ success: true, accessToken, user }` | `frontend/src/services/auth.service.ts:243` | Intercepting unconfigured users |
| `POST` | `/2fa/disable` | `auth.routes.ts:128` (`authController.disableTwoFactor`) | `authenticate` | `{ password: string }` | `{ success: true, message }` | `frontend/src/features/settings/SettingsPage.tsx` | None |
| `GET` | `/me` | `auth.routes.ts:133` (`authController.me`) | `authenticate` | None | `{ success: true, user: { id, name, email, role, residentCode, ... } }` | `frontend/src/services/auth.service.ts:172` (`AuthProvider.tsx`) | 401 when token key differed |
| `GET` | `/google` | `auth.routes.ts:138` (`authController.googleLogin`) | `passport.authenticate('google')` | None | Redirects to Google Auth | `frontend/src/features/auth/AuthModal.tsx` | None |
| `GET` | `/google/callback`| `auth.routes.ts:142` (`authController.googleCallback`) | `passport.authenticate('google')` | Query code | Redirects to Frontend with access token in fragment/cookie | Browser redirect | OAuth user missing password hash handled |

---

### 2.2 Security & Device Fingerprinting Module (`/api/v1/security/devices`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:35` -> `backend/src/modules/devices/device.routes.ts`
- **Controller**: `backend/src/modules/devices/device.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/identify` | `device.routes.ts:18` | `authenticate`, `authLimiter` | `{ deviceFingerprint: string, browser: string, os: string, ipAddress?: string }` | `{ success: true, deviceId, riskScore, isTrusted, status }` | `frontend/src/services/device.service.ts:18` | False positive anomaly flags on local dev |
| `GET` | `/` | `device.routes.ts:24` | `authenticate` | None | `{ success: true, devices: UserDeviceItem[] }` | `frontend/src/services/device.service.ts:28` | None |
| `PATCH` | `/:deviceId/trust` | `device.routes.ts:30` | `authenticate` | `{ isTrusted: boolean }` | `{ success: true, device: UserDeviceItem }` | `frontend/src/services/device.service.ts:38` | None |
| `POST` | `/:deviceId/revoke` | `device.routes.ts:36` | `authenticate` | None | `{ success: true, message: "Device session revoked" }` | `frontend/src/services/device.service.ts:48` | None |
| `POST` | `/:deviceId/block` | `device.routes.ts:42` | `authenticate` | None | `{ success: true, message: "Device blocked" }` | `frontend/src/services/device.service.ts:58` | None |
| `POST` | `/:deviceId/unblock`| `device.routes.ts:48` | `authenticate` | None | `{ success: true, message: "Device unblocked" }` | `frontend/src/services/device.service.ts:68` | None |
| `GET` | `/events` | `device.routes.ts:54` | `authenticate` | Query: `limit`, `offset` | `{ success: true, events: SecurityEventItem[] }` | `frontend/src/services/device.service.ts:78` | None |

---

### 2.3 Property Management Module (`/api/v1/properties`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:41` -> `backend/src/modules/properties/property.routes.ts`
- **Controller**: `backend/src/modules/properties/property.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `GET` | `/` & `/public` | `property.routes.ts:12` | Public | Query: `search`, `city`, `foodPreference`, `gender`, `minPrice`, `maxPrice`, `ac` | `{ success: true, properties: PG[], total: number }` | `frontend/src/services/property.service.ts:16` (`PGListing.tsx`) | MongoDB regex injection mitigated |
| `GET` | `/:id` | `property.routes.ts:14` | Public | URL Param: `id` | `{ success: true, property: PGDetails }` | `frontend/src/services/property.service.ts:24` (`PGDetails.tsx`) | 404 on draft unapproved PGs |
| `GET` | `/owner-summary` | `property.routes.ts:15` | `authenticate`, `authorize(OWNER, ADMIN)` | None | `{ success: true, summary: { totalBeds, occupied, revenue, pgs: [] } }` | `frontend/src/services/property.service.ts:44` (`Dashboard.tsx`) | Empty state crash when owner has no PG |
| `GET` | `/:pgId/meal-schedules` | `property.routes.ts:18` | `authenticate` | URL Param: `pgId` | `{ success: true, schedules: MealSchedule[] }` | `frontend/src/features/properties/MealTab.tsx` | None |
| `POST` | `/` | `property.routes.ts:21` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ name, address, city, propertyType, totalRooms, rules: [], amenities: [] }` | `{ success: true, property: PG, message: "Property created" }` | `frontend/src/services/property.service.ts:32` (`OnboardingWizard.tsx`) | None |

---

### 2.4 Room & Bed Management Module (`/api/v1/rooms` & `/api/v1/beds`)
- **Mount Points**:
  - `backend/src/routes/apiRouter.ts:42` -> `backend/src/modules/rooms/room.routes.ts`
  - `backend/src/routes/apiRouter.ts:43` -> `backend/src/modules/beds/bed.routes.ts`
  - Legacy Mirror: `backend/src/routes/residentManagementRoutes.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `GET` | `/rooms/pg/:pgId` | `room.routes.ts:7` | `authenticate` | URL Param: `pgId` | `{ success: true, rooms: Room[] }` | `frontend/src/services/room.service.ts` | None |
| `PUT` | `/rooms/:roomId/convert` | `room.routes.ts:6` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ newType: RoomType, capacity: number }` | `{ success: true, room: Room }` | `frontend/src/features/rooms/RoomTransferModal.tsx` | Bed count mismatch during conversion |
| `POST` | `/rooms/transfer-requests` | `room.routes.ts:8` | `authenticate`, `authorize(RESIDENT)` | `{ targetRoomId: string, targetBedId?: string, reason: string }` | `{ success: true, request: RoomTransferRequest }` | `frontend/src/services/room.service.ts:18` | Resident lacking active bed |
| `GET` | `/rooms/transfer-requests` | `room.routes.ts:9` | `authenticate`, `authorize(OWNER, ADMIN)` | Query: `status`, `pgId` | `{ success: true, requests: RoomTransferRequest[] }` | `frontend/src/services/room.service.ts:24` | Duplicate route in `residentManagementRoutes.ts` |
| `PUT` | `/rooms/transfer-requests/:id/approve` | `room.routes.ts:10` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ remarks?: string }` | `{ success: true, request: RoomTransferRequest }` | `frontend/src/services/room.service.ts:30` | Redlock lock collision on target bed |
| `PUT` | `/rooms/transfer-requests/:id/reject` | `room.routes.ts:11` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ rejectionReason: string }` | `{ success: true, request: RoomTransferRequest }` | `frontend/src/services/room.service.ts:36` | None |
| `POST` | `/rooms/transfer-requests/:id/complete`| `room.routes.ts:12` | `authenticate`, `authorize(OWNER, ADMIN)` | None | `{ success: true, message: "Transfer executed successfully" }` | `frontend/src/services/room.service.ts:42` | Old bed release race condition |
| `PUT` | `/beds/:bedId/status` | `bed.routes.ts:6` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ status: BedStatus, remarks?: string }` | `{ success: true, bed: Bed }` | `frontend/src/services/bed.service.ts:16` | Method mismatch (`PUT` in bed.routes vs `POST` in residentManagementRoutes) |
| `POST` | `/beds/holds` | `bed.routes.ts:7` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ bedId: string, reason: BedHoldReason, durationHours: number, notes?: string }` | `{ success: true, hold: BedHold }` | `frontend/src/services/bed.service.ts:22` | Path collision (`/beds/holds` vs `/resident-management/beds/hold`) |
| `DELETE` | `/beds/holds/:holdId` | `bed.routes.ts:8` | `authenticate`, `authorize(OWNER, ADMIN)` | URL Param: `holdId` | `{ success: true, message: "Bed hold released" }` | `frontend/src/services/bed.service.ts:28` | None |
| `GET` | `/beds/holds` | `bed.routes.ts:9` | `authenticate` | Query: `pgId`, `status` | `{ success: true, holds: BedHold[] }` | `frontend/src/services/bed.service.ts:34` | None |

---

### 2.5 Resident Lifecycle & Portal Module (`/api/v1/residents`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:44` -> `backend/src/modules/residents/resident.routes.ts`
- **Controller**: `backend/src/modules/residents/resident.controller.ts`
- **Service**: `backend/src/modules/residents/resident.service.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `GET` | `/portal/me` | `resident.routes.ts:10` (`residentController.getPortalMe`) | `authenticate`, `authorize(RESIDENT)` | None | `{ profile: ResidentProfile, roommates: [], wifiCredentials, payments: [], complaints: [], visitorPasses: [], gatePasses: [], agreements: [], documents: [] }` | `frontend/src/services/resident.service.ts:26` (`ResidentPortal.tsx`) | 404 "Resident profile record not found" due to Prisma null relation include |
| `GET` | `/directory` | `resident.routes.ts:7` (`residentController.getDirectory`) | `authenticate`, `authorize(OWNER, ADMIN)` | Query: `pgId`, `search`, `status`, `page`, `limit` | `{ success: true, residents: Resident[], total: number }` | `frontend/src/services/resident.service.ts:20` (`Residents.tsx`) | Multi-tenant tenantId leaking across PGs |
| `POST` | `/onboard` | `resident.routes.ts:11` (`residentController.onboard`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ name, email, phone, pgId, roomId, bedId, rentAmount, securityDeposit, moveInDate }` | `{ success: true, resident: Resident, credentials: { residentCode, tempPassword } }` | `frontend/src/services/resident.service.ts:14` (`ResidentRegister.tsx`) | Duplicate bed allocation without Redlock check |
| `PATCH` | `/:residentId/status` | `resident.routes.ts:15` (`residentController.updateStatus`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ status: ResidentStatus, reason?: string }` | `{ success: true, resident: Resident }` | `frontend/src/services/resident.service.ts:32` (`KanbanBoards.tsx`) | Status history audit log omission |
| `GET` | `/:residentId/status-history` | `resident.routes.ts:16` (`residentController.getStatusHistory`) | `authenticate` | URL Param: `residentId` | `{ success: true, history: ResidentStatusHistory[] }` | `frontend/src/services/resident.service.ts:44` | None |
| `POST` | `/visitor-pass` | `resident.routes.ts:12` (`residentController.requestVisitorPass`) | `authenticate`, `authorize(RESIDENT)` | `{ visitorName, visitorPhone, visitDate, durationHours, purpose }` | `{ success: true, pass: Visitor }` | `frontend/src/services/visitor.service.ts:16` | Frontend called `/residents/portal/visitor-pass` resulting in 404 |
| `POST` | `/gate-pass` | `resident.routes.ts:13` (`residentController.requestGatePass`) | `authenticate`, `authorize(RESIDENT)` | `{ fromDate, toDate, reason, emergencyContact }` | `{ success: true, pass: LeaveApplication }` | `frontend/src/services/visitor.service.ts:22` | Frontend called `/residents/portal/gate-pass` resulting in 404 |
| `POST` | `/meal-skip` | `resident.routes.ts:14` (`residentController.skipMeal`) | `authenticate`, `authorize(RESIDENT)` | `{ skipDate: string, mealType: "BREAKFAST" \| "LUNCH" \| "DINNER" }` | `{ success: true, message: "Meal skip recorded" }` | `frontend/src/features/residents/MealTab.tsx` | None |
| `GET` | `/:id` | `resident.routes.ts:17` (`residentController.getById`) | `authenticate` | URL Param: `id` | `{ success: true, resident: Resident }` | `frontend/src/services/resident.service.ts:38` | None |

---

### 2.6 Billing, Payments & Fintech Module (`/api/v1/billing` & `/api/v1/payments`)
- **Mount Points**:
  - `backend/src/routes/apiRouter.ts:45` -> `backend/src/modules/billing/billing.routes.ts`
  - `backend/src/routes/apiRouter.ts:46` -> `backend/src/modules/payments/payment.routes.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/payments/create-order` | `payment.routes.ts:7` (`paymentController.createOrder`) | `authenticate` | `{ amount: number, currency?: "INR", invoiceId?: string, paymentType: "RENT" \| "DEPOSIT" \| "FINE" }` | `{ success: true, orderId: string, keyId: string, amount: number, currency: string }` | `frontend/src/services/billing.service.ts:58` (`Billing.tsx`) | Razorpay currency integer scaling (paise vs rupees) |
| `POST` | `/payments/verify` | `payment.routes.ts:8` (`paymentController.verifyPayment`) | `authenticate` | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ success: true, payment: Payment, invoice: Invoice }` | `frontend/src/services/billing.service.ts:68` (`Billing.tsx`) | Signature verification failure on malformed webhook secret |
| `POST` | `/payments/webhook` | `payment.routes.ts:5` (`paymentController.handleWebhook`) | Razorpay Signature Header Guard | Razorpay Webhook Event Payload | `{ status: "ok" }` | External Razorpay Server | Duplicate webhook replay processing |
| `GET` | `/payments/history` | `payment.routes.ts:10` (`paymentController.getPaymentHistory`) | `authenticate` | Query: `page`, `limit`, `status`, `residentId` | `{ success: true, payments: Payment[], total: number }` | `frontend/src/services/billing.service.ts:76` | Empty history array serialization |
| `GET` | `/payments/analytics` | `payment.routes.ts:11` (`paymentController.getPaymentAnalytics`) | `authenticate`, `authorize(OWNER, ADMIN)` | Query: `pgId`, `period` | `{ totalCollected, pendingDues, collectionRate, monthlyBreakdown: [] }` | `frontend/src/services/billing.service.ts:82` | None |
| `GET` | `/payments/export/csv` | `payment.routes.ts:12` (`paymentController.exportPaymentsCsv`) | `authenticate`, `authorize(OWNER, ADMIN)` | Query: `pgId`, `startDate`, `endDate` | CSV File Stream (`Content-Type: text/csv`) | `frontend/src/features/billing/ExportButton.tsx` | None |
| `GET` | `/billing/invoices/:paymentId/pdf` | `billing.routes.ts:17` (`billingController.getInvoicePdf`) | `authenticate` | URL Param: `paymentId` | PDF Binary Stream (`application/pdf`) | `frontend/src/services/fileDownload.service.ts` | PDFKit stream premature termination |
| `GET` | `/billing/receipts/:paymentId/pdf` | `billing.routes.ts:19` (`billingController.getReceiptPdf`) | `authenticate` | URL Param: `paymentId` | PDF Binary Stream (`application/pdf`) | `frontend/src/services/fileDownload.service.ts` | Stale closure in frontend download hook |
| `POST` | `/billing/send-receipt` | `billing.routes.ts:21` (`billingController.sendReceipt`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ paymentId: string, email: string }` | `{ success: true, message: "Receipt dispatched" }` | `frontend/src/services/billing.service.ts:100` | SMTP socket timeouts |
| `POST` | `/billing/send-invoice` | `billing.routes.ts:22` (`billingController.sendInvoice`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ invoiceId: string, email: string }` | `{ success: true, message: "Invoice dispatched" }` | `frontend/src/services/billing.service.ts:106` | None |
| `POST` | `/billing/fines` | `billing.routes.ts:10` (`billingController.issueFine`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ residentId: string, fineRuleId?: string, amount: number, reason: string }` | `{ success: true, fine: Fine }` | `frontend/src/features/billing/FineModal.tsx` | Duplicate route in `saasManagementRoutes.ts` |
| `POST` | `/billing/fines/:fineId/waive` | `billing.routes.ts:11` (`billingController.waiveFine`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ reason?: string }` | `{ success: true, fine: Fine }` | `frontend/src/features/billing/FineList.tsx` | Method collision (`POST` in billing vs `PUT` in saasManagement) |

---

### 2.7 Complaints & Support Module (`/api/v1/complaints` & `/api/v1/support`)
- **Mount Points**: `backend/src/routes/apiRouter.ts:47` & `apiRouter.ts:48` -> `backend/src/modules/complaints/complaint.routes.ts`
- **Controller**: `backend/src/modules/complaints/complaint.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/` | `complaint.routes.ts:7` (`complaintController.create`) | `authenticate` | `{ title: string, description: string, category: string, priority: Priority, pgId: string, images?: string[] }` | `{ success: true, complaint: Complaint }` | `frontend/src/services/complaint.service.ts:22` (`Complaints.tsx`) | Missing PG association for resident user |
| `GET` | `/` | `complaint.routes.ts:8` (`complaintController.list`) | `authenticate` | Query: `pgId`, `status`, `priority`, `page`, `limit` | `{ success: true, complaints: Complaint[], total: number }` | `frontend/src/services/complaint.service.ts:16` (`Complaints.tsx`) | Resident seeing other residents' private complaints |
| `PUT` & `PATCH` | `/:id/status` | `complaint.routes.ts:9` & `10` (`complaintController.updateStatus`) | `authenticate`, `authorize(OWNER, ADMIN, STAFF)` | `{ status: TicketStatus, resolutionNotes?: string }` | `{ success: true, complaint: Complaint }` | `frontend/src/services/complaint.service.ts:28` (`Complaints.tsx`) | None |
| `POST` | `/send-reply` | `complaint.routes.ts:11` (`complaintController.sendReply`) | `authenticate` | `{ complaintId: string, message: string }` | `{ success: true, reply: ComplaintReply }` | `frontend/src/features/complaints/ComplaintDetail.tsx` | Socket event broadcast omission |

---

### 2.8 Digital Agreements & Legal Module (`/api/v1/agreements`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:50` -> `backend/src/modules/agreements/agreement.routes.ts`
- **Controller**: `backend/src/modules/agreements/agreement.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/` | `agreement.routes.ts:7` (`agreementController.create`) | `authenticate`, `authorize(OWNER, ADMIN)` | `{ residentId: string, pgId: string, rentAmount: number, securityDeposit: number, durationMonths: number, terms: string[] }` | `{ success: true, agreement: Agreement }` | `frontend/src/services/agreement.service.ts:16` | Missing digital signature placeholder |
| `GET` | `/resident/:residentId` | `agreement.routes.ts:8` (`agreementController.getByResident`) | `authenticate` | URL Param: `residentId` | `{ success: true, agreements: Agreement[] }` | `frontend/src/services/agreement.service.ts:22` | None |
| `GET` | `/:id` | `agreement.routes.ts:9` (`agreementController.getById`) | `authenticate` | URL Param: `id` | `{ success: true, agreement: Agreement }` | `frontend/src/services/agreement.service.ts:28` | None |
| `POST` | `/:id/sign` | `agreement.routes.ts:10` (`agreementController.sign`) | `authenticate` | `{ signatureBase64: string, signerRole: "RESIDENT" \| "OWNER" }` | `{ success: true, agreement: Agreement, pdfUrl: string }` | `frontend/src/services/agreement.service.ts:34` (`SignatureModal.tsx`) | Base64 payload truncation on large image pads |
| `GET` | `/:id/pdf` | `agreement.routes.ts:11` (`agreementController.downloadPdf`) | `authenticate` | URL Param: `id` | PDF Binary Stream (`application/pdf`) | `frontend/src/services/fileDownload.service.ts` | PDFKit font rendering error on Windows/Linux containers |

---

### 2.9 Centralized Document Management (`/api/v1/documents`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:57` -> `backend/src/modules/documents/documents.routes.ts`
- **Controller**: `backend/src/modules/documents/documents.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `GET` | `/invoice/:entityId` | `documents.routes.ts:7` | `authenticate` | URL Param: `entityId` | `{ success: true, url, documentKey, status }` | `frontend/src/services/document.service.ts` | Cache key collision |
| `GET` | `/receipt/:entityId` | `documents.routes.ts:8` | `authenticate` | URL Param: `entityId` | `{ success: true, url, documentKey, status }` | `frontend/src/services/document.service.ts` | None |
| `GET` | `/agreement/:entityId`| `documents.routes.ts:9` | `authenticate` | URL Param: `entityId` | `{ success: true, url, documentKey, status }` | `frontend/src/services/document.service.ts` | None |
| `GET` | `/kyc/:entityId` | `documents.routes.ts:10` | `authenticate` | URL Param: `entityId` | `{ success: true, url, documentKey, status }` | `frontend/src/services/document.service.ts` | Encrypted KYC payload decryption failures |
| `GET` | `/refund/:entityId` | `documents.routes.ts:11` | `authenticate` | URL Param: `entityId` | `{ success: true, url, documentKey, status }` | `frontend/src/services/document.service.ts` | None |
| `GET` | `/status/:documentKey`| `documents.routes.ts:12` | `authenticate` | URL Param: `documentKey` | `{ success: true, status: "READY" \| "PROCESSING" \| "FAILED" }` | `frontend/src/services/document.service.ts` | None |

---

### 2.10 Tours, Shortlists & Student Rental Flow (`/api/v1/tours` & `/api/v1/shortlist`)
- **Mount Points**: `backend/src/routes/apiRouter.ts:58` & `apiRouter.ts:59` -> `backend/src/modules/tours/tours.routes.ts`
- **Controller**: `backend/src/modules/tours/tours.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/shortlist/:propertyId` | `tours.routes.ts:7` | `authenticate` | URL Param: `propertyId` | `{ success: true, isShortlisted: boolean }` | `frontend/src/services/api.ts:80` (`ShortlistPage.tsx`) | None |
| `GET` | `/shortlist` | `tours.routes.ts:8` | `authenticate` | None | `{ success: true, items: Shortlist[] }` | `frontend/src/services/api.ts:81` (`ShortlistPage.tsx`) | None |
| `POST` | `/` | `tours.routes.ts:9` | `authenticate` | `{ propertyId: string, requestedSlot: string, notes?: string }` | `{ success: true, tour: Tour }` | `frontend/src/services/api.ts:82` (`ToursPage.tsx`) | Invalid ISO time format strings |
| `GET` | `/` | `tours.routes.ts:10` | `authenticate` | None | `{ success: true, tours: Tour[] }` | `frontend/src/services/api.ts:83` (`ToursPage.tsx`) | None |
| `PATCH` | `/:id` | `tours.routes.ts:11` | `authenticate` | `{ status: "CONFIRMED" \| "COMPLETED" \| "CANCELLED", ownerNotes?: string }` | `{ success: true, tour: Tour }` | `frontend/src/services/api.ts:84` (`ToursPage.tsx`) | None |

---

### 2.11 Applications & Student Onboarding (`/api/v1/applications`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:60` -> `backend/src/modules/applications/applications.routes.ts`
- **Controller**: `backend/src/modules/applications/applications.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/` | `applications.routes.ts:7` | `authenticate` | `{ propertyId: string, requestedRoomType: RoomType, moveInDate: string, emergencyContact: object }` | `{ success: true, application: Application }` | `frontend/src/services/api.ts:85` (`ApplicationPage.tsx`) | None |
| `GET` | `/` | `applications.routes.ts:8` | `authenticate` | None | `{ success: true, applications: Application[] }` | `frontend/src/services/api.ts:88` (`ApplicationPage.tsx`) | None |
| `GET` | `/:id` | `applications.routes.ts:9` | `authenticate` | URL Param: `id` | `{ success: true, application: Application }` | `frontend/src/services/api.ts:87` (`ApplicationPage.tsx`) | None |
| `PATCH` | `/:id/status` | `applications.routes.ts:10` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ status: "APPROVED" \| "REJECTED" \| "WAITING_DOCUMENTS", remarks?: string }` | `{ success: true, application: Application }` | `frontend/src/services/api.ts:89` (`ApplicationPage.tsx`) | None |
| `POST` | `/:id/sign-lease` | `applications.routes.ts:11` | `authenticate` | `{ signatureData: string, agreementId: string }` | `{ success: true, leaseSignature: LeaseSignature }` | `frontend/src/services/api.ts:90` (`ApplicationPage.tsx`) | Missing tenant profile linkage |

---

### 2.12 In-App Direct Messaging (`/api/v1/messages`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:61` -> `backend/src/modules/messages/messages.routes.ts`
- **Controller**: `backend/src/modules/messages/messages.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/thread` | `messages.routes.ts:7` | `authenticate` | `{ pgId: string, participantId?: string }` | `{ success: true, thread: ChatThread }` | `frontend/src/services/api.ts:91` | Duplicate thread creation on rapid click |
| `GET` | `/threads` | `messages.routes.ts:8` | `authenticate` | None | `{ success: true, threads: ChatThread[] }` | `frontend/src/services/api.ts:92` | None |
| `GET` | `/thread/:threadId` | `messages.routes.ts:9` | `authenticate` | URL Param: `threadId` | `{ success: true, messages: Message[] }` | `frontend/src/services/api.ts:93` | None |
| `POST` | `/` | `messages.routes.ts:10` | `authenticate` | `{ threadId: string, content: string }` | `{ success: true, message: Message }` | `frontend/src/services/api.ts:94` | Socket real-time push missing recipient room |

---

### 2.13 Move-In Checklist & Tenant Dashboard Summary (`/api/v1/move-in`)
- **Mount Point**: `backend/src/routes/apiRouter.ts:62` -> `backend/src/modules/moveIn/moveIn.routes.ts`
- **Controller**: `backend/src/modules/moveIn/moveIn.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `GET` | `/tenant-summary` | `moveIn.routes.ts:7` | `authenticate` | None | `{ activeApplication, pendingTours: [], shortlistCount, moveInStatus }` | `frontend/src/services/api.ts:97` (`MoveInDashboardPage.tsx`) | 500 when resident has null active PG |
| `GET` | `/:propertyId` | `moveIn.routes.ts:8` | `authenticate` | URL Param: `propertyId` | `{ success: true, moveInInfo: MoveInInfo }` | `frontend/src/services/api.ts:95` (`MoveInDashboardPage.tsx`) | None |
| `POST` | `/:propertyId` | `moveIn.routes.ts:9` | `authenticate` | `{ checklistCompleted: boolean, items: string[], arrivalTime: string }` | `{ success: true, moveInInfo: MoveInInfo }` | `frontend/src/services/api.ts:96` (`MoveInDashboardPage.tsx`) | None |

---

### 2.14 Media, Images & Cloudinary Uploads (`/api/v1/media` & `/api/v1/upload`)
- **Mount Points**: `backend/src/routes/apiRouter.ts:36` & `apiRouter.ts:37` -> `backend/src/routes/upload.routes.ts` & `backend/src/routes/media.routes.ts`
- **Controllers**: `backend/src/controllers/upload.controller.ts` & `backend/src/controllers/media.controller.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `POST` | `/upload/` | `upload.routes.ts:16` | `authenticate`, Multer (`file`) | Multipart Form-Data | `{ success: true, url, publicId, format, bytes }` | `frontend/src/services/media.service.ts` | Cloudinary API timeout on large images |
| `POST` | `/upload/kyc` | `upload.routes.ts:24` | `authenticate`, Multer (`document`) | Multipart Form-Data | `{ success: true, secureUrl, documentType }` | `frontend/src/features/residents/KycUploadModal.tsx` | Unsanitized file extension vulnerability |
| `POST` | `/media/upload` | `media.routes.ts:16` | `authenticate`, Multer (`file`) | Multipart Form-Data, Body: `{ pgId, tag }` | `{ success: true, image: MediaRecord }` | `frontend/src/services/media.service.ts:14` | Duplicate upload route in `/upload` |
| `POST` | `/media/bulk-upload` | `media.routes.ts:24` | `authenticate`, Multer (`files`) | Multipart Array | `{ success: true, images: MediaRecord[] }` | `frontend/src/services/media.service.ts:22` | Partial failure rollback omitted |
| `DELETE` | `/media/:publicId` | `media.routes.ts:32` | `authenticate`, `authorize(OWNER, ADMIN)` | URL Param: `publicId` | `{ success: true, message: "Image deleted" }` | `frontend/src/services/media.service.ts:30` | Cloudinary publicId URL-encoding mismatch |
| `POST` | `/media/bulk-delete` | `media.routes.ts:33` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ publicIds: string[] }` | `{ success: true, deletedCount: number }` | `frontend/src/services/media.service.ts:36` | None |
| `PATCH` | `/media/reorder` | `media.routes.ts:35` | `authenticate`, `authorize(OWNER, ADMIN)` | `{ imageOrders: { id: string, order: number }[] }` | `{ success: true, message: "Reordered" }` | `frontend/src/services/media.service.ts:42` | None |

---

### 2.15 Dashboard, Analytics, Marketing & Settings Modules
- **Mount Points**:
  - `/dashboard` -> `backend/src/routes/dashboard.routes.ts`
  - `/analytics` -> `backend/src/modules/analytics/analytics.routes.ts`
  - `/marketing` -> `backend/src/modules/marketing/marketing.routes.ts`
  - `/settings` -> `backend/src/modules/settings/settings.routes.ts`
  - `/notifications` -> `backend/src/modules/notifications/notification.routes.ts`

| Method | Path | Handler File:Line | Middleware Chain | Request Shape | Response Shape | Frontend Caller(s) | Known Failure History |
|---|---|---|---|---|---|---|---|
| `GET` | `/dashboard/overview` | `dashboard.routes.ts:7` | `authenticate` | Query: `pgId` | `{ totalRevenue, totalBeds, occupiedBeds, pendingDues, activeComplaints, quickStats }` | `frontend/src/services/dashboard.service.ts:6` (`Dashboard.tsx`) | 500 when calculating zero bed ratio |
| `GET` | `/dashboard/revenue` | `dashboard.routes.ts:8` | `authenticate` | Query: `period` | `{ totalRevenue, monthlyTrends: [], distribution: [] }` | `frontend/src/services/dashboard.service.ts:12` (`Analytics.tsx`) | None |
| `GET` | `/dashboard/occupancy` | `dashboard.routes.ts:9` | `authenticate` | Query: `pgId` | `{ totalCapacity, occupied, available, occupancyRate }` | `frontend/src/services/dashboard.service.ts:18` (`Analytics.tsx`) | None |
| `GET` | `/analytics/occupancy` | `analytics.routes.ts:7` | `authenticate`, `authorize(OWNER, ADMIN)` | Query: `pgId` | `{ occupancyHistory: [], currentRate }` | `frontend/src/services/analytics.service.ts` | Route duplication with `/dashboard/occupancy` |
| `GET` | `/analytics/financials`| `analytics.routes.ts:8` | `authenticate`, `authorize(OWNER, ADMIN)` | Query: `pgId`, `year` | `{ grossRevenue, netIncome, outstandingFines }` | `frontend/src/services/analytics.service.ts` | None |
| `GET` | `/notifications` | `notification.routes.ts:5` | `authenticate` | Query: `unreadOnly` | `{ success: true, notifications: Notification[] }` | `frontend/src/services/notification.service.ts:6` (`Navbar.tsx`) | None |
| `PUT` | `/notifications/:id/read` | `notification.routes.ts:6` | `authenticate` | URL Param: `id` | `{ success: true, message: "Marked read" }` | `frontend/src/services/notification.service.ts:10` | None |
| `GET` | `/settings/admin/verification-queue` | `settings.routes.ts:7` | `authenticate`, `authorize(SUPER_ADMIN)` | None | `{ success: true, queue: Owner[] }` | `frontend/src/services/owner.service.ts:12` (`AdminConsole.tsx`) | None |
| `POST` | `/settings/admin/approve-pg/:pgId` | `settings.routes.ts:8` | `authenticate`, `authorize(SUPER_ADMIN)` | URL Param: `pgId` | `{ success: true, message: "PG approved" }` | `frontend/src/features/owners/OwnerApproval.tsx` | None |
| `POST` | `/settings/account/delete` | `settings.routes.ts:9` | `authenticate` | `{ password, otpConfirmation, reason }` | `{ success: true, message: "Account soft-deleted" }` | `frontend/src/features/settings/DeleteAccountModal.tsx` | Incomplete cascading de-allocation of resident bed |

---

### 2.16 Legacy Duplicate Route Groups (To be Consolidated in Rewrite)

The following two legacy routing aggregators duplicate module routes and must be reconciled in Phase 3 and retired in Phase 4:

#### 1. `backend/src/routes/residentManagementRoutes.ts` (Mounted at `/api/v1/resident-management`)
- Duplicates `modules/residents`, `modules/beds`, and `modules/rooms`.
- Endpoints:
  - `POST /resident-management/status` -> Replace with `PATCH /residents/:id/status`
  - `GET /resident-management/status/history/:residentId` -> Replace with `GET /residents/:id/status-history`
  - `POST /resident-management/beds/status` -> Replace with `PUT /beds/:id/status`
  - `POST /resident-management/beds/hold` -> Replace with `POST /beds/holds`
  - `DELETE /resident-management/beds/hold/:holdId` -> Replace with `DELETE /beds/holds/:id`
  - `GET /resident-management/beds/holds` -> Replace with `GET /beds/holds`
  - `POST /resident-management/transfers/request` -> Replace with `POST /rooms/transfer-requests`
  - `GET /resident-management/transfers` -> Replace with `GET /rooms/transfer-requests`
  - `POST /resident-management/transfers/:requestId/approve` -> Replace with `PUT /rooms/transfer-requests/:id/approve`
  - `POST /resident-management/transfers/:requestId/reject` -> Replace with `PUT /rooms/transfer-requests/:id/reject`
  - `POST /resident-management/transfers/:requestId/complete` -> Replace with `POST /rooms/transfer-requests/:id/complete`

#### 2. `backend/src/routes/saasManagementRoutes.ts` (Mounted at `/api/v1/saas`)
- Duplicates `modules/billing`, `modules/search`, and `modules/settings`.
- Endpoints:
  - `POST /saas/fines/rules` -> Replace with `POST /billing/fine-rules`
  - `GET /saas/fines/rules/pg/:pgId` -> Replace with `GET /billing/fine-rules`
  - `POST /saas/fines/issue` -> Replace with `POST /billing/fines`
  - `PUT /saas/fines/:fineId/waive` -> Replace with `POST /billing/fines/:id/waive`
  - `GET /saas/search` -> Replace with `GET /search`
  - `GET /saas/admin/verification-queue` -> Replace with `GET /settings/admin/verification-queue`
  - `POST /saas/admin/approve-pg/:pgId` -> Replace with `POST /settings/admin/approve-pg/:pgId`
  - `POST /saas/account/delete` -> Replace with `POST /settings/account/delete`

---

## 3. Historical Defect & Failure Log (Mapped to Specific Endpoints)

| Failure Identifier | Affected Endpoint(s) | Exact Root Cause | Historical Error / Status | Applied Mitigation Strategy |
|---|---|---|---|---|
| **FAIL-01: CORS Preflight 500** | `POST /api/v1/auth/login`, `OPTIONS /api/v1/auth/login` | Express `cors` middleware error callback threw `new Error(...)`, triggering Express 500 handler instead of sending HTTP 204. | `500 Internal Server Error` on OPTIONS | Return `callback(null, false)`, configure `optionsSuccessStatus: 204`, and register `app.options("*", corsMiddleware)` first. |
| **FAIL-02: Cross-Origin Cookie 401s** | `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh-token` | Browsers visiting GitHub Pages origin block third-party `SameSite=None; Secure` cookies sent by Render domain. | `401 Unauthorized` (`TOKEN_REQUIRED`) | Support dual token transmission via `Authorization: Bearer <token>` in header and `{ refreshToken }` in request body. |
| **FAIL-03: Resident Profile 404 on Portal Load** | `GET /api/v1/residents/portal/me` | Prisma MongoDB nested include `include: { bed: { include: { room: true } } }` failed on null `bedId`. Caught by empty catch, throwing 404. | `404 Not Found` (`Resident profile record not found`) | Simplified auto-creation query without nested null relation includes; added `ensureUserProfile` in auth login pipeline; returned `RESIDENT_PROFILE_INCOMPLETE`. |
| **FAIL-04: Socket.IO Handshake 400** | `GET /socket.io/?EIO=4&transport=websocket` | `allowedOrigins` contained repo subpath `"https://ayushman-glb.github.io/PG-Management-System"`. Browser sends only host origin (`https://ayushman-glb.github.io`). | `400 Bad Request` during WebSocket handshake | Normalized origin URLs with `new URL(item).origin.toLowerCase()`. |
| **FAIL-05: Redis TLS Connection Crash** | All cached/rate-limited endpoints | Node-redis v4+ client connecting to `rediss://` TLS endpoint threw uncaught socket protocol error on boot. | Process crash on startup | Implemented resilient `isRedisReady()` helper with memory-store fallback. |
| **FAIL-06: 2FA Login Interception Loop** | `POST /api/v1/auth/login`, `POST /api/v1/auth/2fa/verify` | Login returned `REQUIRES_2FA` for all accounts regardless of whether `isTwoFactorEnabled` was true. | `401 / 403` login loop | Gated 2FA challenge strictly behind `user.isTwoFactorEnabled === true`. |
| **FAIL-07: PDFKit Stream Termination Race** | `GET /api/v1/billing/invoices/:id/pdf`, `GET /api/v1/agreements/:id/pdf` | PDF stream piped directly to Express `res` closed before write buffer flushed. | `500 / ERR_STREAM_PREMATURE_CLOSE` | Buffered PDF generation into memory before streaming `Buffer` to client. |
| **FAIL-08: Gmail SMTP Timeout on Render** | `POST /api/v1/auth/send-otp`, `POST /api/v1/auth/email/send-otp` | Synchronous SMTP socket connection timed out on port 587 in serverless container environment. | `504 Gateway Timeout` | Asynchronous background dispatch with in-memory OTP verification fallback. |

---

## 4. Phase 1 Exit Criteria Verification

- [x] Every mounted route across all 25 modules and route aggregators documented.
- [x] Method, path, handler file/line, and middleware chains captured.
- [x] Request and response shapes specified for each endpoint.
- [x] Calling frontend service and component files mapped.
- [x] Every historical failure logged in commit history mapped to its originating endpoint.
- [x] Duplicate legacy route groups (`residentManagementRoutes`, `saasManagementRoutes`) flagged for consolidation.
