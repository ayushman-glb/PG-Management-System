# Phase 3: New REST API Specification & Architecture Design

> **Document Status**: Complete  
> **Phase**: Phase 3 — New REST API Design (spec only, no code)  
> **Target Branch**: `rewrite/api-websocket-v1`  
> **Deliverable Path**: `/docs/rewrite/03-api-design.md`  
> **Prerequisites**: [`/docs/rewrite/00-project-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/00-project-context.md), [`/docs/rewrite/01-legacy-api-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/01-legacy-api-context.md), [`/docs/rewrite/02-legacy-websocket-context.md`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/docs/rewrite/02-legacy-websocket-context.md) verified.

---

## 1. Architectural Principles & Design System

The new REST API v1 is designed according to RESTful domain-driven principles, strict multi-tenant scoping, loose coupling via TypeScript interfaces, and resilient error recovery.

### 1.1 Core API Conventions
1. **URI Versioning**: All primary resources are mounted under `/api/v1/`.
2. **Resource-Centric Naming**: Plural nouns for collections (`/properties`, `/residents`, `/rooms`, `/beds`, `/agreements`), nested paths for sub-resources (`/properties/:pgId/rooms`, `/residents/:id/status-history`).
3. **HTTP Verb Semantics**:
   - `GET`: Safe, idempotent retrieval. Supports filtering, sorting, and pagination via query parameters (`?page=1&limit=20&sort=-createdAt&status=ACTIVE&search=...`).
   - `POST`: Non-idempotent resource creation or transactional command executions.
   - `PUT`: Full-resource replacement.
   - `PATCH`: Partial attribute modification.
   - `DELETE`: Logical resource removal (soft-delete setting `deletedAt = new Date()` and `deletedBy = req.user.id`).
4. **Decoupled Architecture**:
   - Controllers depend solely on `IService` interfaces.
   - Services depend solely on `IRepository` interfaces.
   - Cross-module operations communicate through exported domain service interfaces or event emitters, never reaching directly into another module's Prisma client models.
5. **Consolidation of Legacy Duplicate Routes**:
   - `residentManagementRoutes.ts` is fully absorbed into canonical module routes (`/residents`, `/beds`, `/rooms`).
   - `saasManagementRoutes.ts` is fully absorbed into canonical module routes (`/billing`, `/search`, `/settings`).

---

## 2. Standardized Response & Error Envelopes

Every endpoint returns a predictable, type-safe JSON envelope conforming to RoomBae's `ApiResponse` schema.

### 2.1 Success Envelope (HTTP 200 OK, 201 Created)
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Emerald Heights PG",
    "status": "ACTIVE"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 2.2 Standardized Error Envelope
```json
{
  "success": false,
  "message": "Resident profile record not found",
  "errors": [],
  "error": {
    "code": "RESIDENT_PROFILE_INCOMPLETE",
    "message": "Resident profile record not found",
    "action": "complete_onboarding"
  }
}
```

### 2.3 Specific HTTP Status Code Catalog
- **200 OK**: Successful GET, PATCH, PUT, or non-creation POST.
- **201 Created**: Successful POST resource creation.
- **204 No Content**: Successful DELETE or preflight OPTIONS.
- **400 Bad Request**: Malformed JSON or generic client validation error (`code: "VALIDATION_FAILED"`).
- **401 Unauthorized**: Missing or invalid Bearer access token (`code: "TOKEN_REQUIRED"` / `"INVALID_TOKEN"`).
- **403 Forbidden**: Authenticated user lacks required RBAC role or tenant access (`code: "FORBIDDEN_RESOURCE"`).
- **404 Not Found**: Resource does not exist (`code: "NOT_FOUND"` or `"RESIDENT_PROFILE_INCOMPLETE"`).
- **409 Conflict**: State conflict, duplicate key, or concurrency lock collision (`code: "DUPLICATE_RESOURCE"` / `"BED_LOCKED"`).
- **422 Unprocessable Entity**: Zod schema validation errors with detailed field breakdown in `errors` array (`code: "UNPROCESSABLE_ENTITY"`).
- **429 Too Many Requests**: Rate limit exceeded (`code: "RATE_LIMIT_EXCEEDED"`).
- **500 Internal Server Error**: Unexpected server-side failure with correlation ID for tracing (`code: "INTERNAL_SERVER_ERROR"`).

---

## 3. Written Mitigations for Legacy Failures

| Failure Ref | Legacy Defect | Architectural Mitigation in New Design |
|---|---|---|
| **FAIL-01** | CORS preflight 500 on OPTIONS login | Registered `app.options("*", corsMiddleware)` first; normalized origin comparison; returned `callback(null, false)` with `204 No Content`. |
| **FAIL-02** | 401s on `/auth/me` & `/auth/refresh-token` | Supported dual transmission: `Authorization: Bearer <token>` in header and `{ refreshToken }` in request body alongside fallback cookie parser. |
| **FAIL-03** | `getPortalMe` 404 crash on null relation | Refactored `getPortalData` to create base resident document without nested null relation includes; added `ensureUserProfile` to login pipeline; returned distinguishable error code `RESIDENT_PROFILE_INCOMPLETE`. |
| **FAIL-04** | Socket.IO handshake 400 on Render | Normalized all allowed origins (`new URL(origin).origin.toLowerCase()`), explicitly permitting `https://ayushman-glb.github.io`; added query token fallback. |
| **FAIL-05** | Redis TLS connection startup crash | Implemented protocol-aware connection parser, `isRedisReady()` verification, and resilient in-memory fallback stores. |
| **FAIL-06** | 2FA interception login loop | Strictly gated 2FA challenges behind `user.isTwoFactorEnabled === true`. |
| **FAIL-07** | PDFKit stream premature close | Buffered PDF binary output in memory (`Buffer.concat`) before piping to client response stream. |
| **FAIL-08** | Gmail SMTP socket timeout | Implemented asynchronous non-blocking background queue with in-memory fallback verification. |

---

## 4. Module-by-Module REST API Specification

---

### 4.1 Authentication & Identity Module (`/api/v1/auth`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/login` | `loginLimiter`, `validate(LoginSchema)` | Public | `{ identifier: string, password: string, deviceFingerprint?: string }` | `{ accessToken: string, user: UserProfile, requires2FA?: boolean, tempToken?: string }` |
| `POST` | `/register` | `registerLimiter`, `validate(RegisterSchema)` | Public | `{ name, email, phone, password, role: Role }` | `{ user: UserProfile, message: string }` |
| `POST` | `/send-otp` | `sendOtpLimiter` | Public | `{ email?: string, phone?: string, type?: "REGISTRATION" \| "LOGIN" \| "RESET" }` | `{ message: string, otpExpiry: string }` |
| `POST` | `/verify-otp` | `validate(VerifyOtpSchema)` | Public | `{ identifier: string, otp: string }` | `{ accessToken: string, user: UserProfile }` |
| `POST` | `/logout` | `authenticate` | User Scoped | `{}` | `{ message: "Logged out successfully" }` |
| `POST` | `/refresh-token` | `refreshTokenLimiter` | Public (Header/Body/Cookie) | `{ refreshToken?: string }` | `{ accessToken: string, user: UserProfile }` |
| `POST` | `/phone/send-otp` | `sendOtpLimiter`, `validate(SendPhoneOtpSchema)` | Public | `{ phone: string }` | `{ message: string, expiresAt: string }` |
| `POST` | `/phone/verify-otp`| `phoneVerifyLimiter`, `validate(VerifyPhoneOtpSchema)` | Public | `{ phone: string, otp: string }` | `{ accessToken: string, user: UserProfile }` |
| `POST` | `/email/send-otp` | `sendOtpLimiter` | Public | `{ email: string }` | `{ message: string }` |
| `POST` | `/email/verify-otp`| None | Public | `{ email: string, otp: string }` | `{ verified: boolean }` |
| `POST` | `/password/send-reset` | `sendOtpLimiter` | Public | `{ email: string }` | `{ message: string }` |
| `POST` | `/password/verify` | `validate(PasswordResetSchema)` | Public | `{ email: string, token: string, newPassword: string }` | `{ message: "Password reset successful" }` |
| `POST` | `/2fa/enable` | `authenticate`, `validate(Enable2FASchema)` | User Scoped | `{ method: "TOTP" \| "SMS" \| "EMAIL", phone?: string }` | `{ secret: string, qrCodeUrl?: string }` |
| `POST` | `/2fa/verify` | `validate(Verify2FASchema)` | Public (tempToken) | `{ userId: string, token: string }` | `{ accessToken: string, user: UserProfile }` |
| `POST` | `/2fa/disable`| `authenticate` | User Scoped | `{ password: string }` | `{ message: "2FA disabled" }` |
| `GET` | `/me` | `authenticate` | User Scoped | None | `{ user: UserProfile }` |
| `GET` | `/google` | `passport.authenticate('google')` | Public | None | Redirects to Google OAuth |
| `GET` | `/google/callback` | `passport.authenticate('google')` | Public | Query code | Redirects to Frontend with token |

---

### 4.2 Security & Device Fingerprinting Module (`/api/v1/security/devices`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/identify` | `authenticate`, `authLimiter` | User Scoped | `{ deviceFingerprint: string, browser: string, os: string }` | `{ deviceId: string, riskScore: number, isTrusted: boolean, status: string }` |
| `GET` | `/` | `authenticate` | User Scoped | None | `{ devices: UserDeviceItem[] }` |
| `PATCH` | `/:deviceId/trust` | `authenticate` | User Scoped | `{ isTrusted: boolean }` | `{ device: UserDeviceItem }` |
| `POST` | `/:deviceId/revoke` | `authenticate` | User Scoped | None | `{ message: "Device session revoked" }` |
| `POST` | `/:deviceId/block` | `authenticate` | User Scoped | None | `{ message: "Device blocked" }` |
| `POST` | `/:deviceId/unblock` | `authenticate` | User Scoped | None | `{ message: "Device unblocked" }` |
| `GET` | `/events` | `authenticate` | User Scoped | `?page=1&limit=20` | `{ events: SecurityEventItem[] }` |

---

### 4.3 Owner Onboarding & Profile Module (`/api/v1/owners`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/` | `authenticate`, `authorize(SUPER_ADMIN, ADMIN)` | System | `?page=1&limit=20&status=PENDING` | `{ owners: Owner[], total: number }` |
| `GET` | `/profile` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner Scoped | None | `{ owner: OwnerProfile, pgs: PG[], subscription: Subscription }` |
| `POST` | `/onboard` | `authenticate`, `authorize(OWNER)` | Owner Scoped | `{ step: number, data: object }` (10-Step Wizard) | `{ owner: OwnerProfile, currentStep: number, completed: boolean }` |
| `GET` | `/:id` | `authenticate`, `authorize(OWNER, SUPER_ADMIN, ADMIN)` | Owner Scoped | URL Param: `id` | `{ owner: OwnerProfile }` |

---

### 4.4 Property & Accommodation Hierarchy Module (`/api/v1/properties`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/` | Public | Global | `?search=&city=&gender=&foodPreference=&ac=&minPrice=&maxPrice=&page=1&limit=20` | `{ properties: PGCard[], total: number }` |
| `GET` | `/public` | Public | Global | Alias for `GET /` | `{ properties: PGCard[], total: number }` |
| `GET` | `/:id` | Public | Property Scoped | URL Param: `id` | `{ property: PGDetails, rooms: Room[], amenities: string[] }` |
| `GET` | `/owner-summary` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner Scoped | None | `{ totalBeds: number, occupiedBeds: number, totalRevenue: number, pgs: PGSummary[] }` |
| `POST` | `/` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner Scoped | `{ name: string, address: string, city: string, propertyType: PropertyType, rules: string[], amenities: string[] }` | `{ property: PG, message: "Property created" }` |
| `GET` | `/:pgId/meal-schedules` | `authenticate` | `pgId` Scoped | URL Param: `pgId` | `{ schedules: MealSchedule[] }` |

---

### 4.5 Room Inventory & Allocation Module (`/api/v1/rooms`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/pg/:pgId` | `authenticate` | `pgId` Scoped | URL Param: `pgId`, `?floor=&type=` | `{ rooms: RoomDetail[] }` |
| `PUT` | `/:roomId/convert` | `authenticate`, `authorize(OWNER, ADMIN)` | Room Scoped | `{ newType: RoomType, capacity: number }` | `{ room: Room, message: "Room type converted" }` |
| `POST` | `/transfer-requests` | `authenticate`, `authorize(RESIDENT)` | Resident Scoped | `{ targetRoomId: string, targetBedId?: string, reason: string }` | `{ request: RoomTransferRequest }` |
| `GET` | `/transfer-requests` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=&status=PENDING&page=1&limit=20` | `{ requests: RoomTransferRequest[], total: number }` |
| `PUT` | `/transfer-requests/:id/approve` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ remarks?: string }` | `{ request: RoomTransferRequest }` |
| `PUT` | `/transfer-requests/:id/reject` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ rejectionReason: string }` | `{ request: RoomTransferRequest }` |
| `POST` | `/transfer-requests/:id/complete` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | None | `{ message: "Room transfer executed" }` |

---

### 4.6 Bed Inventory & Concurrency Management Module (`/api/v1/beds`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `PUT` | `/:bedId/status` | `authenticate`, `authorize(OWNER, ADMIN)` | Bed Scoped | `{ status: BedStatus, remarks?: string }` | `{ bed: Bed, message: "Bed status updated" }` |
| `POST` | `/holds` | `authenticate`, `authorize(OWNER, ADMIN)` | Bed Scoped | `{ bedId: string, reason: BedHoldReason, durationHours: number, notes?: string }` | `{ hold: BedHold, expiresAt: string }` |
| `DELETE` | `/holds/:holdId` | `authenticate`, `authorize(OWNER, ADMIN)` | Hold Scoped | URL Param: `holdId` | `{ message: "Bed hold released" }` |
| `GET` | `/holds` | `authenticate` | `tenantId`/PG | `?pgId=&status=ACTIVE&page=1&limit=20` | `{ holds: BedHold[], total: number }` |

---

### 4.7 Resident Portal & Tenant Management Module (`/api/v1/residents`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/portal/me` | `authenticate`, `authorize(RESIDENT)` | Resident Scoped | None | `{ profile: ResidentProfile, wifiCredentials, roommates: [], payments: [], complaints: [], visitorPasses: [], gatePasses: [], agreements: [], documents: [] }` |
| `GET` | `/directory` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=&search=&status=&page=1&limit=20` | `{ residents: ResidentDirectoryItem[], total: number }` |
| `GET` | `/profile` | `authenticate` | Resident Scoped | None | `{ resident: ResidentProfile }` |
| `POST` | `/onboard` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ name, email, phone, pgId, roomId, bedId, rentAmount, securityDeposit, moveInDate }` | `{ resident: Resident, residentCode: string, tempPassword?: string }` |
| `PATCH` | `/:residentId/status` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ status: ResidentStatus, reason?: string }` | `{ resident: Resident, message: "Status updated" }` |
| `GET` | `/:residentId/status-history` | `authenticate` | `tenantId`/PG | URL Param: `residentId` | `{ history: ResidentStatusHistory[] }` |
| `POST` | `/visitor-pass` | `authenticate`, `authorize(RESIDENT)` | Resident Scoped | `{ visitorName, visitorPhone, visitDate, durationHours, purpose }` | `{ pass: Visitor }` |
| `POST` | `/gate-pass` | `authenticate`, `authorize(RESIDENT)` | Resident Scoped | `{ fromDate, toDate, reason, emergencyContact }` | `{ pass: LeaveApplication }` |
| `POST` | `/meal-skip` | `authenticate`, `authorize(RESIDENT)` | Resident Scoped | `{ skipDate: string, mealType: "BREAKFAST" \| "LUNCH" \| "DINNER" }` | `{ message: "Meal skip recorded" }` |
| `GET` | `/:id` | `authenticate` | `tenantId`/PG | URL Param: `id` | `{ resident: ResidentDetail }` |

---

### 4.8 Billing, Invoicing & Penalty Module (`/api/v1/billing`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/fine-rules` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=` | `{ fineRules: FineRule[] }` |
| `POST` | `/fine-rules` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ pgId, fineType: FineType, calculationType: FineCalculationType, amount, gracePeriodDays }` | `{ fineRule: FineRule }` |
| `POST` | `/fines` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ residentId, fineRuleId?, amount, reason }` | `{ fine: Fine }` |
| `POST` | `/fines/:fineId/waive` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ reason?: string }` | `{ fine: Fine, message: "Fine waived" }` |
| `GET` | `/residents/:residentId/fines` | `authenticate` | Resident Scoped | URL Param: `residentId` | `{ fines: Fine[] }` |
| `GET` | `/invoices/:paymentId/pdf` | `authenticate` | Payment Scoped | URL Param: `paymentId` | Binary PDF stream (`application/pdf`) |
| `GET` | `/receipts/:paymentId/pdf` | `authenticate` | Payment Scoped | URL Param: `paymentId` | Binary PDF stream (`application/pdf`) |
| `POST` | `/send-receipt` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ paymentId: string, email: string }` | `{ message: "Receipt dispatched" }` |
| `POST` | `/send-invoice` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ invoiceId: string, email: string }` | `{ message: "Invoice dispatched" }` |

---

### 4.9 Payment Gateway & Fintech Module (`/api/v1/payments`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/create-order` | `authenticate` | User / PG Scoped | `{ amount: number, currency?: "INR", invoiceId?: string, paymentType: "RENT" \| "DEPOSIT" \| "FINE" }` | `{ orderId: string, keyId: string, amount: number, currency: "INR" }` |
| `POST` | `/verify` | `authenticate` | User / PG Scoped | `{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }` | `{ payment: Payment, invoice: Invoice }` |
| `POST` | `/webhook` | Razorpay Signature Guard | Webhook | Razorpay Webhook Event Body | `{ status: "ok" }` |
| `GET` | `/history` | `authenticate` | User Scoped | `?page=1&limit=20&status=&residentId=` | `{ payments: PaymentItem[], total: number }` |
| `GET` | `/analytics` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=&period=monthly` | `{ totalCollected, pendingDues, collectionRate, trends: [] }` |
| `GET` | `/export/csv` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=&startDate=&endDate=` | CSV Data Stream (`text/csv`) |
| `GET` | `/:id` | `authenticate` | Payment Scoped | URL Param: `id` | `{ payment: PaymentDetail }` |
| `POST` | `/:id/refund` | `authenticate`, `authorize(OWNER, ADMIN)` | Payment Scoped | `{ amount?: number, reason: string }` | `{ refund: object, message: "Refund initiated" }` |

---

### 4.10 Complaints & Ticketing Module (`/api/v1/complaints` & `/api/v1/support`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/` | `authenticate` | `tenantId`/PG | `{ title, description, category, priority: Priority, pgId, images?: string[] }` | `{ complaint: Complaint }` |
| `GET` | `/` | `authenticate` | `tenantId`/PG | `?pgId=&status=&priority=&page=1&limit=20` | `{ complaints: ComplaintItem[], total: number }` |
| `PATCH` | `/:id/status` | `authenticate`, `authorize(OWNER, ADMIN, STAFF)` | `tenantId`/PG | `{ status: TicketStatus, resolutionNotes?: string }` | `{ complaint: Complaint }` |
| `POST` | `/send-reply` | `authenticate` | Ticket Scoped | `{ complaintId: string, message: string }` | `{ reply: ComplaintReply }` |

---

### 4.11 Digital Agreements & Contracts Module (`/api/v1/agreements`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `{ residentId, pgId, rentAmount, securityDeposit, durationMonths, terms: string[] }` | `{ agreement: Agreement }` |
| `GET` | `/resident/:residentId` | `authenticate` | Resident Scoped | URL Param: `residentId` | `{ agreements: Agreement[] }` |
| `GET` | `/:id` | `authenticate` | Agreement Scoped | URL Param: `id` | `{ agreement: AgreementDetail }` |
| `POST` | `/:id/sign` | `authenticate` | Signer Scoped | `{ signatureBase64: string, signerRole: "RESIDENT" \| "OWNER" }` | `{ agreement: Agreement, pdfUrl: string }` |
| `GET` | `/:id/pdf` | `authenticate` | Agreement Scoped | URL Param: `id` | Binary PDF Stream (`application/pdf`) |

---

### 4.12 Centralized Documents Module (`/api/v1/documents`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/invoice/:entityId` | `authenticate` | User / Entity | URL Param: `entityId` | `{ url: string, documentKey: string, status: string }` |
| `GET` | `/receipt/:entityId` | `authenticate` | User / Entity | URL Param: `entityId` | `{ url: string, documentKey: string, status: string }` |
| `GET` | `/agreement/:entityId`| `authenticate` | User / Entity | URL Param: `entityId` | `{ url: string, documentKey: string, status: string }` |
| `GET` | `/kyc/:entityId` | `authenticate` | User / Entity | URL Param: `entityId` | `{ url: string, documentKey: string, status: string }` |
| `GET` | `/status/:documentKey`| `authenticate` | User / Entity | URL Param: `documentKey` | `{ status: "READY" \| "PROCESSING" \| "FAILED" }` |

---

### 4.13 Tours, Shortlists & Applications Module (`/api/v1/tours` & `/api/v1/applications`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/shortlist/:propertyId` | `authenticate` | User Scoped | URL Param: `propertyId` | `{ isShortlisted: boolean }` |
| `GET` | `/shortlist` | `authenticate` | User Scoped | None | `{ items: Shortlist[] }` |
| `POST` | `/tours` | `authenticate` | User Scoped | `{ propertyId: string, requestedSlot: string, notes?: string }` | `{ tour: Tour }` |
| `GET` | `/tours` | `authenticate` | User / Owner | `?pgId=&status=` | `{ tours: Tour[] }` |
| `PATCH` | `/tours/:id` | `authenticate` | User / Owner | `{ status: string, ownerNotes?: string }` | `{ tour: Tour }` |
| `POST` | `/applications` | `authenticate` | User Scoped | `{ propertyId, requestedRoomType, moveInDate, emergencyContact }` | `{ application: Application }` |
| `GET` | `/applications` | `authenticate` | User / Owner | `?pgId=&status=` | `{ applications: Application[] }` |
| `GET` | `/applications/:id` | `authenticate` | User / Owner | URL Param: `id` | `{ application: ApplicationDetail }` |
| `PATCH` | `/applications/:id/status` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner Scoped | `{ status: string, remarks?: string }` | `{ application: Application }` |
| `POST` | `/applications/:id/sign-lease` | `authenticate` | User Scoped | `{ signatureData: string, agreementId: string }` | `{ leaseSignature: LeaseSignature }` |

---

### 4.14 In-App Messages & Move-In Management (`/api/v1/messages` & `/api/v1/move-in`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/messages/thread` | `authenticate` | User Scoped | `{ pgId: string, participantId?: string }` | `{ thread: ChatThread }` |
| `GET` | `/messages/threads` | `authenticate` | User Scoped | None | `{ threads: ChatThreadItem[] }` |
| `GET` | `/messages/thread/:threadId` | `authenticate` | User Scoped | URL Param: `threadId` | `{ messages: Message[] }` |
| `POST` | `/messages` | `authenticate` | User Scoped | `{ threadId: string, content: string }` | `{ message: Message }` |
| `GET` | `/move-in/tenant-summary` | `authenticate` | Resident Scoped | None | `{ activeApplication, pendingTours: [], shortlistCount, moveInStatus }` |
| `GET` | `/move-in/:propertyId` | `authenticate` | User Scoped | URL Param: `propertyId` | `{ moveInInfo: MoveInInfo }` |
| `POST` | `/move-in/:propertyId` | `authenticate` | User Scoped | `{ checklistCompleted: boolean, items: string[], arrivalTime: string }` | `{ moveInInfo: MoveInInfo }` |

---

### 4.15 Media Uploads & Cloudinary CDN (`/api/v1/media` & `/api/v1/upload`)

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `POST` | `/upload` | `authenticate`, Multer | User Scoped | Multipart `file` | `{ url: string, publicId: string, format: string, bytes: number }` |
| `POST` | `/upload/kyc` | `authenticate`, Multer | User Scoped | Multipart `document` | `{ secureUrl: string, documentType: string }` |
| `POST` | `/media/upload` | `authenticate`, Multer | Owner / Admin | Multipart `file`, `{ pgId, tag }` | `{ image: MediaRecord }` |
| `POST` | `/media/bulk-upload` | `authenticate`, Multer | Owner / Admin | Multipart `files` array | `{ images: MediaRecord[] }` |
| `DELETE` | `/media/:publicId` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner / Admin | URL Param: `publicId` | `{ message: "Image deleted" }` |
| `POST` | `/media/bulk-delete` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner / Admin | `{ publicIds: string[] }` | `{ deletedCount: number }` |
| `PATCH` | `/media/reorder` | `authenticate`, `authorize(OWNER, ADMIN)` | Owner / Admin | `{ imageOrders: { id: string, order: number }[] }` | `{ message: "Reordered successfully" }` |

---

### 4.16 Dashboard, Analytics, Notifications, Settings & Search

| Method | Path | Auth / Guards | Tenant / Role Scope | Request Body / Query Params | Response Data Shape |
|---|---|---|---|---|---|
| `GET` | `/dashboard/overview` | `authenticate` | `tenantId`/Owner | `?pgId=` | `{ totalRevenue, totalBeds, occupiedBeds, pendingDues, activeComplaints, quickStats }` |
| `GET` | `/dashboard/revenue` | `authenticate` | `tenantId`/Owner | `?period=monthly` | `{ totalRevenue, monthlyTrends: [], distribution: [] }` |
| `GET` | `/dashboard/occupancy` | `authenticate` | `tenantId`/Owner | `?pgId=` | `{ totalCapacity, occupied, available, occupancyRate }` |
| `GET` | `/analytics/occupancy` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=` | `{ occupancyHistory: [], currentRate }` |
| `GET` | `/analytics/financials` | `authenticate`, `authorize(OWNER, ADMIN)` | `tenantId`/PG | `?pgId=&year=` | `{ grossRevenue, netIncome, outstandingFines }` |
| `GET` | `/notifications` | `authenticate` | User Scoped | `?unreadOnly=true` | `{ notifications: NotificationItem[] }` |
| `PUT` | `/notifications/:id/read` | `authenticate` | User Scoped | URL Param: `id` | `{ message: "Marked read" }` |
| `GET` | `/settings/admin/verification-queue` | `authenticate`, `authorize(SUPER_ADMIN)` | System | None | `{ queue: OwnerVerificationItem[] }` |
| `POST` | `/settings/admin/approve-pg/:pgId` | `authenticate`, `authorize(SUPER_ADMIN)` | System | URL Param: `pgId` | `{ message: "PG approved and live" }` |
| `POST` | `/settings/account/delete` | `authenticate` | User Scoped | `{ password, otpConfirmation, reason }` | `{ message: "Account soft-deleted" }` |
| `GET` | `/search` | Public | Global / `tenantId` | `?q=&pgId=` | `{ results: { residents: [], rooms: [], payments: [], properties: [] } }` |

---

### 4.17 Infrastructure Probes & External SOAP ERP Integration

| Protocol / Method | Path | Auth / Guards | Purpose | Response Shape |
|---|---|---|---|---|
| `GET` | `/health` | Public | Deep system health probe | `{ success: true, status: "UP", redis, database, smtp, services }` |
| `GET` | `/ready` | Public | Render / Kubernetes readiness probe | `{ status: "READY", database: "CONNECTED", redis: "CONNECTED" }` |
| `GET` | `/live` | Public | Fast container liveness check | `{ status: "ALIVE", timestamp: string }` |
| `GET` | `/metrics` | Non-prod only | Prometheus metrics text stream | Metric gauge & counter records |
| `GET` | `/api/docs` & `/api/docs.json` | Non-prod only | Swagger UI OpenAPI specification | Interactive OpenAPI 3.0 specs |
| `SOAP / POST` | `/soap/billing` (`?wsdl`) | Public WSDL | Synchronous ERP invoice queries | XML SOAP 1.1 Envelope with `GetInvoiceDetailsResponse` |

---

## 5. Phase 3 Exit Criteria Verification

- [x] Every module's endpoints fully specified with correct HTTP methods.
- [x] Standard `ApiResponse` success and error envelopes defined with distinguishable codes.
- [x] Query parameters for filtering, sorting, and pagination documented.
- [x] Legacy route forwarders (`residentManagementRoutes`, `saasManagementRoutes`) absorbed into canonical REST modules.
- [x] Every historical failure from Phase 1 has a documented architectural mitigation.
