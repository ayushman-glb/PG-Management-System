# Phase 1 Execution Report — REST Auth Surface Audit

**Phase Scope:** Discovery audit of the REST authentication surface (signup, login, OTP/verification, refresh, logout, RBAC) for PG Owner, Resident, and Admin roles.  
**Execution Timestamp:** 2026-08-12  
**Current Repository Commit HEAD:** `76d10426eb45e47417d21632e093b6a4caf61819`

---

## 1. Commit & Build Verification (Step 0)

- **Local Git HEAD:** `76d10426eb45e47417d21632e093b6a4caf61819`
- **Backend Build (`prisma generate && tsc -p tsconfig.build.json`):** ✅ Succeeded with 0 compilation errors.
- **Frontend Build (`tsc -b && vite build`):** ✅ Succeeded with 0 compilation errors.
- **Automated Test Suite:** ✅ 49/49 tests passing across 7 test suites (including CORS preflight verification).

---

## 2. Comprehensive REST Auth Surface Map

| Endpoint | Method | Rate Limiter | Validation Schema | Controller Method | Service Method | Protected By |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | `loginLimiter` (5 req / 15m) | `LoginSchema` | `AuthController.login` ([auth.controller.ts:14](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L14)) | `AuthService.login` ([auth.service.ts:278](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L278)) | None (Public) |
| `/api/v1/auth/register` | `POST` | `registerLimiter` (5 req / 1h) | `RegisterSchema` | `AuthController.register` ([auth.controller.ts:73](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L73)) | `AuthService.register` ([auth.service.ts:365](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L365)) | None (Public) |
| `/api/v1/auth/send-otp` | `POST` | `sendOtpLimiter` (3 req / 10m) | None | `AuthController.sendOtp` ([auth.controller.ts:101](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L101)) | `AuthService.sendOtp` ([auth.service.ts:421](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L421)) | None (Public) |
| `/api/v1/auth/verify-otp` | `POST` | None | None | `AuthController.verifyOtp` ([auth.controller.ts:107](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L107)) | `AuthService.verifyOtp` ([auth.service.ts:432](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L432)) | None (Public) |
| `/api/v1/auth/logout` | `POST` | None | None | `AuthController.logout` ([auth.controller.ts:121](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L121)) | `AuthService.logout` ([auth.service.ts:173](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L173)) | None (Public / Cookie) |
| `/api/v1/auth/refresh-token` | `POST` | None | None | `AuthController.refreshToken` ([auth.controller.ts:197](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L197)) | `AuthService.refreshToken` ([auth.service.ts:98](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L98)) | None (Cookie / Header) |
| `/api/v1/auth/send-phone-otp` | `POST` | `sendOtpLimiter` (3 req / 10m) | `SendPhoneOtpSchema` | `AuthController.sendPhoneOtp` ([auth.controller.ts:150](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L150)) | `AuthService.sendPhoneOtp` ([auth.service.ts:464](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L464)) | None (Public) |
| `/api/v1/auth/verify-phone-otp` | `POST` | `phoneVerifyLimiter` (10 req / 15m) | `VerifyPhoneOtpSchema` | `AuthController.verifyPhoneOtp` ([auth.controller.ts:156](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L156)) | `AuthService.verifyPhoneOtp` ([auth.service.ts:484](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L484)) | None (Public) |
| `/api/v1/auth/send-email-verification` | `POST` | None | None | `AuthController.sendEmailVerification` ([auth.controller.ts:162](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L162)) | `AuthService.sendEmailVerification` ([auth.service.ts:507](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L507)) | None (Public) |
| `/api/v1/auth/verify-email` | `POST` | None | None | `AuthController.verifyEmail` ([auth.controller.ts:168](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L168)) | `AuthService.verifyEmail` ([auth.service.ts:534](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L534)) | None (Public) |
| `/api/v1/auth/me` | `GET` | `generalLimiter` (100 req / 15m) | None | `AuthController.me` ([auth.controller.ts:214](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L214)) | `AuthService.me` ([auth.service.ts:609](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L609)) | `authenticate` ([authMiddleware.ts:21](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/authMiddleware.ts#L21)) |
| `/api/v1/auth/google` | `GET` | None | None | `AuthController.googleLogin` ([auth.controller.ts:232](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L232)) | Passport Google OAuth Strategy ([passport.ts](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/passport.ts)) | None (Redirect) |
| `/api/v1/auth/google/callback` | `GET` | None | None | `AuthController.googleCallback` ([auth.controller.ts:263](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L263)) | Passport Google OAuth Strategy ([passport.ts](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/passport.ts)) | None (OAuth Code) |
| `/api/v1/auth/2fa/enable` | `POST` | None | `Enable2FASchema` | `AuthController.enableTwoFactor` ([auth.controller.ts:174](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L174)) | `AuthService.enableTwoFactor` ([auth.service.ts:559](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L559)) | `authenticate` |
| `/api/v1/auth/2fa/verify` | `POST` | None | None | `AuthController.verifyTwoFactor` ([auth.controller.ts:184](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L184)) | `AuthService.verifyTwoFactor` ([auth.service.ts:574](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L574)) | `authenticate` |

---

## 3. Request / Response Shapes & Role Parameter Handling

- **Frontend Login Payload:** Sent via `authService.login` ([auth.service.ts (frontend):101](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/frontend/src/services/auth.service.ts#L101)):
  ```json
  {
    "identifier": "user@example.com",
    "password": "Password123!",
    "visitorId": "fingerprint_hash_string",
    "deviceLabel": "Chrome on Windows"
  }
  ```
- **Backend Login Processing:** Accepted by `AuthController.login` ([auth.controller.ts:15](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L15)). Reads `identifier`, `email`, or `residentCode` from body.
- **Frontend Signup Payload:** Sent via `Auth.tsx` ([Auth.tsx:419](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/frontend/src/features/auth/pages/Auth.tsx#L419)):
  ```json
  {
    "name": "Full Name",
    "email": "user@example.com",
    "password": "Password123!",
    "role": "OWNER",
    "phone": "+919876543210"
  }
  ```
- **Backend Signup Processing & Role Assignment:**
  - `RegisterSchema` ([auth.dto.ts:20](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.dto.ts#L20)): Validates `role: z.enum(['OWNER', 'RESIDENT']).optional()`.
  - `AuthService.register` ([auth.service.ts:376](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L376)): Enforces role server-side via:
    ```typescript
    const forcedRole = (data.role && (data.role === Role.OWNER || data.role === Role.RESIDENT)) ? data.role : Role.RESIDENT;
    ```
    If `ADMIN` or `SUPER_ADMIN` is passed by a client, `RegisterSchema` rejects the request with a `400 Bad Request`.

---

## 4. Prisma Schema User & Role Model Mapping

- **`User` Model:** Defined in `prisma/schema.prisma` ([lines 265-312](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L265-L312)). Field `role Role @default(PUBLIC)`.
- **`Role` Enum:** Defined in `prisma/schema.prisma` ([lines 14-22](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L14-L22)):
  ```prisma
  enum Role {
    SUPER_ADMIN
    ADMIN
    OWNER
    MANAGER
    STAFF
    RESIDENT
    PUBLIC
  }
  ```
- **"Resident" vs "Tenant" Confirmation:**
  - The database enum and code refer to room occupants strictly as `RESIDENT`.
  - There is **no `TENANT` value** in the `Role` enum in `schema.prisma`. "Resident" in the UI maps 1:1 to `RESIDENT` in the backend database and API.

---

## 5. Express Request & AuthRequest Typing Setup

- **Global Express Declaration:** Defined in `src/types/express.d.ts` ([lines 3-19](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/types/express.d.ts#L3-L19)) augmenting global `Express.User` and `Express.Request`.
- **Include Target:** Included in `tsconfig.json` ([line 14](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/tsconfig.json#L14)) via `"include": ["src/**/*", "prisma/**/*"]`.
- **Local Module Interface:** `authMiddleware.ts` ([lines 17-19](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/authMiddleware.ts#L17-L19)) exports `interface AuthRequest extends Request { user?: AuthUserPayload; }`.
- **Audit Finding:** All authenticated route controllers across `src/modules/*` import `AuthRequest` from `authMiddleware.ts`. However, to prevent future TS build regressions in new files, `express.d.ts` should be kept in sync with `AuthUserPayload`.

---

## 6. Security Controls Audit

1. **Rate Limiting:**
   - Global rate limiter: `generalLimiter` (100 requests per 15 mins; [rateLimiter.ts:18](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts#L18)).
   - Login rate limiter: `loginLimiter` (5 requests per 15 mins per IP; [rateLimiter.ts:24](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts#L24)).
   - Register rate limiter: `registerLimiter` (5 requests per 1 hour per IP; [rateLimiter.ts:30](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts#L30)).
   - Send OTP rate limiter: `sendOtpLimiter` (3 requests per 10 mins per IP; [rateLimiter.ts:36](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts#L36)).
   - Verify Phone OTP rate limiter: `phoneVerifyLimiter` (10 requests per 15 mins per IP; [rateLimiter.ts:42](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts#L42)).
2. **Password Hashing:** Implemented in `BcryptCryptoService.ts` using `bcrypt` with 10 salt rounds.
3. **JWT Token Management:** Signed in `TokenService.ts` with `env.JWT_SECRET` (access token, 15m expiration) and `env.JWT_REFRESH_SECRET` (refresh token, 7d expiration). Access tokens contain `id`, `email`, `role`, `residentCode`, `sessionId`, and `tokenVersion`.
4. **Refresh Token Storage & Rotation:** Stored as SHA-256 hashes in `RefreshToken` table ([schema.prisma:314](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L314)). Rotated upon every refresh call ([auth.service.ts:154](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L154)). If a revoked token is presented, `AuthService.refreshToken` triggers full family revocation ([auth.service.ts:132](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L132)).
5. **CORS Allowlist & Helmet Config:** Hoisted as middleware #1 in [app.ts:25-76](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/app.ts#L25-L76). Parses URL origins (`new URL(origin).origin`) and uses `callback(null, false)` for invalid origins to avoid triggering 500 error handlers. Helmet is configured with `crossOriginResourcePolicy: { policy: "cross-origin" }`.
6. **Device Fingerprinting & Anomaly Detection:** Evaluated via `Container.deviceService.identifyAndEvaluateDevice` ([auth.controller.ts:36](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L36)). Evaluates FingerprintJS `visitorId`, IP, and user-agent against `UserDevice` records. If device status is `BLOCKED`, the request is denied with HTTP 403 Forbidden ([auth.controller.ts:42](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.controller.ts#L42)).

---

## 7. Public Admin Creation Check

- **Can an Admin account be created via any public-facing endpoint?** **NO.**
- `RegisterSchema` ([auth.dto.ts:20](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.dto.ts#L20)) restricts input roles to `'OWNER'` or `'RESIDENT'`. `AuthService.register` ([auth.service.ts:376](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L376)) forces role assignment to `OWNER` or `RESIDENT`.
- Admin accounts are seeded strictly via CLI seed scripts (`scripts/seedMasterDatabase.ts` and `prisma/seed.ts`).

---

## 8. Status of Previously Reported Bugs

1. **(a) Frontend firing multiple duplicate login requests on a single submit:**  
   - **Status:** **RESOLVED.**
   - **Explanation:** Fixed by resolving the OPTIONS 500 preflight error in `app.ts` and adding `refreshPromise` deduplication in `AuthService` ([auth.service.ts:160-184](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/frontend/src/services/auth.service.ts#L160-L184)).
2. **(b) Post-login dashboard showing the same profile regardless of role:**  
   - **Status:** **STILL HAPPENING.**
   - **Explanation:** In `frontend/src/components/layouts/DashboardLayout.tsx` line 332, the user avatar badge is hardcoded as `<Avatar name="Rajesh Kumar" initials="RK" size="sm" />` instead of binding to `{user?.name}` from the `useAuth()` hook.

---

## 9. Exact Failed Login Responses & Status Codes

- **(a) Non-existent Email Login:**
  - **Status Code:** `401 Unauthorized` ([auth.service.ts:290](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L290))
  - **Response Body:**
    ```json
    {
      "success": false,
      "message": "We couldn't find an account with these details. Would you like to sign up instead?",
      "error": {
        "code": "ACCOUNT_NOT_FOUND_OR_INVALID",
        "details": [],
        "action": "login"
      }
    }
    ```
- **(b) Existing Email + Wrong Password Login:**
  - **Status Code:** `401 Unauthorized` ([auth.service.ts:313](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L313))
  - **Response Body:**
    ```json
    {
      "success": false,
      "message": "We couldn't find an account with these details. Would you like to sign up instead?",
      "error": {
        "code": "ACCOUNT_NOT_FOUND_OR_INVALID",
        "details": [],
        "action": "login"
      }
    }
    ```
- **Anti-Enumeration Finding:** Non-existent emails and incorrect passwords return identical response status codes (401), error messages, and error codes. Neither leaks account existence.

---

## 10. Summary & Open Follow-up Items

- **GraphQL & SOAP Auth Parity:** Explicitly out of scope for this pass; needs equivalent audit/parity in future passes.
- **Frontend Dashboard Avatar:** Open UI issue in `DashboardLayout.tsx` (line 332) hardcoding "Rajesh Kumar" needs binding to `useAuth()` context in the UI phase.
