# RoomBae — Full-Stack Authentication, Multi-Step Signup & Onboarding System Architecture

This document serves as the single source of truth for RoomBae's end-to-end **Authentication (AuthN)**, **Authorization (AuthZ)**, **Multi-Step Signup Wizard**, **KYC Onboarding**, **Session Management**, **Database Layer**, **Resilience Fallbacks**, and **Scalability Engineering**.

---

## 1. System Architecture Blueprint

RoomBae uses a **Zero-Trust, Microservice-Ready Monolith** architecture built on TypeScript, React 18, Express, Prisma ORM, MongoDB Atlas, Redis, and Cloudinary.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND CLIENT (React 18 + Vite)                      │
│   - Multi-Step Registration Wizard (Zod + Framer Motion)                                │
│   - LocalStorage State Recovery (`roombae_incomplete_signup`)                          │
│   - In-Memory Access Token Storage + HTTP-Only Cookie Session                          │
│   - Device Fingerprinting (FingerprintJS)                                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / REST (/api/v1/auth/*)
                                            │ WebSocket (Socket.IO Real-Time)
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             BACKEND API GATEWAY & CORE (Express 4 + TypeScript)         │
│   ├── Security Middleware (Helmet, CORS, HPP, XSS-Clean, Mongo-Sanitize)               │
│   ├── Distributed Rate Limiting (`express-rate-limit` + Redis Store)                   │
│   ├── Authentication Middleware (`authMiddleware.ts` + `tokenBlacklistService`)         │
│   ├── Route Cache Middleware (`cacheMiddleware.ts` with X-Cache Telemetry)             │
│   └── Dependency Injection Container (`Container.authService`, `Container.userRepo`)   │
└───────────────────────┬───────────────────────────┬────────────────────────────────────┘
                        │                           │
         ┌──────────────▼──────────────┐   ┌────────▼────────────────┐
         │     MONGODB ATLAS (Prisma 6)│   │       REDIS (v6 / In-Mem)│
         │ - User & Profile Tables     │   │ - Route JSON Cache       │
         │ - RefreshToken Session Hash │   │ - Distributed Rate Limits│
         │ - Owner KYC & Bank Records  │   │ - SHA-256 Hashed OTPs    │
         │ - Device & Security Logs    │   │ - JWT Token Blacklist    │
         │ - Sparse / Compound Indexes │   │ - Socket.IO Pub/Sub Bus  │
         └──────────────┬──────────────┘   └────────┬─────────────────┘
                        │                           │
                        └─────────────┬─────────────┘
                                      │
         ┌────────────────────────────▼─────────────────────────────┐
         │               EXTERNAL CLOUD INTEGRATIONS                │
         │ - Cloudinary: KYC Document & Avatar Storage (CDN)        │
         │ - Google OAuth 2.0: Single Sign-On (SSO)                 │
         │ - Nodemailer + Gmail OAuth2: Transactional Email OTP     │
         │ - Twilio / Mock SMS: Phone Number OTP Verification       │
         └──────────────────────────────────────────────────────────┘
```

---

## 2. Full-Stack Technology Stack

| Layer | Technologies & Libraries | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion | Multi-step interactive wizards, responsive validation, live timer counters, KYC drag-and-drop file uploaders |
| **Frontend State & Networking** | Custom `authService`, Native Fetch wrapper, LocalStorage draft engine | Bearer token injection, transparent 401 refresh retry queue, draft caching |
| **Backend API** | Node.js (v20+), Express 4, TypeScript, Zod | Controller-Service-Repository architecture, request validation, cryptographic token handling |
| **Primary Database** | MongoDB Atlas, Prisma ORM (v6.19.3) | Relational modeling, partial/sparse indexes, atomic updates, audit event logs |
| **Cache & Real-Time** | Redis (v6/v4 client), Socket.IO with Redis Adapter | Sub-millisecond route caching, rate limiting, pub/sub multi-instance websocket sync |
| **Asset Storage** | Cloudinary SDK | Secure cloud storage for KYC Aadhaar, PAN, trade licenses, profile avatars |
| **Communication** | Twilio SMS API, Nodemailer with Gmail OAuth2 | Dual-channel OTP verification for Indian phone numbers (`+91`) and email |

---

## 3. Multi-Step Signup Wizard (Detailed Step-by-Step Flow)

```
[ Step 1: Role Selection ] ──► [ Step 2: Personal Info & OTPs ] ──► [ Step 3: KYC & Financials ] ──► [ Account Activated ]
         │                                   │                                    │
         └─► (Or Google SSO) ────────────────┴────────────────────────────────────┘
```

### Step 1: Role Selection & OAuth Entrypoint
1. **Account Type Selection:** The user chooses their intended account role:
   - **`RESIDENT` (🏠 Resident):** Tenants seeking or occupying PG rooms/beds.
   - **`OWNER` (🏢 PG Owner):** Property managers, landlords, and hostel operators.
2. **Alternative — Google OAuth 2.0 Single Sign-On:**
   - User clicks **"Continue with Google"**.
   - Initiates redirect to `GET /api/v1/auth/google?role=RESIDENT|OWNER`.
   - On successful Google consent callback, backend upserts user with `authProvider = "GOOGLE"`, marks `emailVerified = true`, and auto-creates their linked Owner or Resident profile.

### Step 2: Personal Identity & Contact Verification
- **Demographic Fields:**
  - Full Name (validated against `^[a-zA-Z\s'.]+$`, minimum 2 chars)
  - Date of Birth (`dob`) with client-side live age calculation
  - Gender (`MALE`, `FEMALE`, `OTHER`)
  - Address (`City`, `State`, `Pincode` with 6-digit Indian PIN regex `/^\d{6}$/`)
- **Contact Details & Dual-Channel Verification:**
  - **Phone Number:** 10-digit Indian mobile number (`+91`).
    - Clicking **Verify** sends a 6-digit OTP via SMS (`POST /api/v1/auth/phone/send-otp`).
    - User enters code into modal (`POST /api/v1/auth/phone/verify-otp`).
    - Verified status locks the phone input and renders a `PhoneVerifiedBadge`.
  - **Email Address:** Standard RFC 5322 email string.
    - Transactional verification via Nodemailer (`POST /api/v1/auth/email/send-otp`).
    - User verifies via modal (`POST /api/v1/auth/email/verify-otp`).
- **Password Strength Contract:**
  - Minimum 8 characters, uppercase (`[A-Z]`), lowercase (`[a-z]`), digit (`[0-9]`), and special character (`[!@#$%^&*...]`).
  - Confirmed via matching `confirmPassword`.

### Step 3: Role-Specific KYC & Financial Onboarding

#### For Residents (`RESIDENT`):
1. **Aadhaar Document Upload:** Front/back PDF or image uploaded directly to Cloudinary.
2. **Digital Signature Upload:** Signature scan for rental agreements.
3. **Permanent Address & Emergency Contact:** Full residential address, landmark, emergency contact phone.

#### For PG Owners (`OWNER`):
1. **Identity & Business Documents:**
   - Aadhaar Scan (PDF)
   - PAN Card Scan (PDF)
   - Business Trade License / Property Tax Receipt (PDF)
2. **Settlement Bank Account Details (Encrypted Server-Side):**
   - Account Holder Name
   - Bank Name (e.g. HDFC, ICICI, SBI)
   - Account Number + Confirmation
   - IFSC Code (validated against `/^[A-Z]{4}0[A-Z0-9]{6}$/`)
   - UPI ID (e.g. `owner@okhdfcbank`)

### Step 4: Final Submission & Account Provisioning
1. User accepts Terms & Conditions (`agreeTerms = true`).
2. Frontend sends complete payload to `POST /api/v1/auth/register`.
3. Backend:
   - Hashes password using **Bcrypt** (cost factor 12).
   - Creates `User` record in MongoDB.
   - Automatically provisions associated `Owner` or `Resident` profile record.
   - Creates a new session in `RefreshToken` (storing `sha256(rawRefreshToken)`).
   - Returns `201 Created` with `accessToken` in JSON response and sets `refreshToken` in an **`httpOnly; Secure; SameSite=Lax`** cookie.
   - Clears incomplete draft in `localStorage`.

---

## 4. Incomplete Signup Recovery & Draft Resilience

To avoid data loss from connectivity drops or browser reloads during the multi-step flow:

1. **Auto-Save Engine:**
   - Every input change in `Auth.tsx` is automatically debounced and saved into `localStorage.setItem("roombae_incomplete_signup", JSON.stringify(draft))`.
2. **Draft Detection on Boot:**
   - When the user opens the signup screen, `useEffect` checks for `roombae_incomplete_signup`.
   - If an unsubmitted registration exists, an **"Incomplete Signup Progress Found!"** banner appears.
3. **Resume / Discard Actions:**
   - **Resume Button:** Restores role, current wizard step, personal details, verified status badges, uploaded Cloudinary document URLs, and bank details in one click.
   - **Discard Button:** Purges the draft from `localStorage`.

---

## 5. Unified Login & Multi-Identifier Authentication

RoomBae provides a single, high-convenience login endpoint accepting multiple identifiers:

```
                      ┌──► Email Address (user@example.com)
Login Identifier ─────┼──► 10-Digit Mobile Phone (9876543210)
                      └──► Resident Code (RES-BLR-1042)
```

### 1. Password Login Flow (`POST /api/v1/auth/login`)
1. **Identifier Resolution:** [`AuthRepository.findByIdentifier`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.repository.ts#L18-L40) executes a case-insensitive MongoDB query across `email`, `phone`, and `residentCode`.
2. **Credential Check:** Verifies password hash using Bcrypt.
3. **Account State:** Verifies `accountStatus === "ACTIVE"`.
4. **Device Intelligence Evaluation:**
   - Reads `X-Visitor-Id` from request headers (generated via FingerprintJS).
   - Looks up or creates a `UserDevice` record.
   - If device is marked `BLOCKED`, responds `403 Forbidden`.
   - Records device trust level and logs a `SecurityAuditEvent`.
5. **Session Generation:**
   - Signs Access Token (15m expiry) with `JWT_SECRET`.
   - Signs Refresh Token (7d or 30d expiry) with `JWT_REFRESH_SECRET`.
   - Hashes refresh token with SHA-256 and persists in `RefreshToken` collection + Redis cache.
   - Writes `RefreshToken` to `httpOnly` cookie and returns `accessToken` + `user` profile in response body.

### 2. Passwordless OTP Login (`POST /api/v1/auth/send-otp` & `/verify-otp`)
- Allows residents and owners to log in directly via SMS or Email OTP without entering a password.

### 3. Two-Factor Authentication (2FA TOTP)
- For administrative or high-security accounts, login generates a short-lived `preAuthToken` (5-minute TTL) and returns `requiresTwoFactor: true`.
- User completes login by submitting their 6-digit Google Authenticator TOTP to `POST /api/v1/auth/2fa/verify`.

---

## 6. Session Lifecycle & Token Security Architecture

RoomBae strictly adheres to the **IETF RFC 6749 & OWASP Token Best Practice Guidelines**:

```
┌─────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Token Type              │ Storage & Delivery Specification                                       │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Access Token**        │ - Expiration: 15 Minutes (configurable via `JWT_ACCESS_EXPIRATION`)    │
│                         │ - Delivery: JSON Response body only (`accessToken`)                    │
│                         │ - Storage: Held in-memory by React client; sent via `Authorization: Bearer` │
│                         │ - Validation: Verified by `authMiddleware.ts` against `JWT_SECRET`     │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Refresh Token**       │ - Expiration: 7 Days (30 Days if `rememberMe = true`)                  │
│                         │ - Delivery: `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite` │
│                         │ - Storage: Browser HTTP-Only Cookie store (Never exposed to JS/DOM)   │
│                         │ - Server Storage: `sha256(rawRefreshToken)` stored in MongoDB & Redis  │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Rotation & Revoke**   │ - Each `/refresh-token` call revokes the old token and issues a new pair│
│                         │ - Detects token reuse: revokes ALL user sessions if old token re-sent   │
│                         │ - Logout blacklists access token in Redis (`jwt:blacklist:<token>`)    │
└─────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Database Persistence & Model Schemas

### MongoDB Atlas Collections (Prisma Models)

```prisma
model User {
  id                 String          @id @default(auto()) @map("_id") @db.ObjectId
  email              String          @unique
  passwordHash       String?
  name               String
  residentCode       String?
  googleSubId        String?         
  avatarUrl          String?
  role               Role            @default(PUBLIC)
  phone              String?
  phoneVerified      Boolean         @default(false)
  emailVerified      Boolean         @default(false)
  accountStatus      String          @default("ACTIVE")
  tokenVersion       Int             @default(0)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  ownerProfile       Owner?
  residentProfile    Resident?
  refreshTokens      RefreshToken[]
  userDevices        UserDevice[]
  securityAuditEvents SecurityAuditEvent[]

  @@index([residentCode])
  @@index([phone])
}

model RefreshToken {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  userId    String    @db.ObjectId
  user      User      @relation(fields: [userId], references: [id])
  tokenHash String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  revokedAt DateTime?
  ipAddress String?
  userAgent String?

  @@index([userId])
}

model OtpToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  phone     String?
  email     String?
  otp       String   // SHA-256 hashed
  purpose   String   // PHONE_VERIFICATION, EMAIL_VERIFICATION, PASSWORD_RESET
  attempts  Int      @default(0)
  verified  Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## 8. API Contract & Endpoints Reference

All endpoints are prefixed with `/api/v1/auth`:

| Method & Route | Access Level | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `POST /register` | Public | `{ name, email, password, role, phone, residentCode? }` | Registers new user, hashes password, returns access token + sets refresh cookie |
| `POST /login` | Public | `{ identifier, password, rememberMe?, visitorId? }` | Authenticates via email/phone/code + password |
| `GET /me` | Bearer Token | — | Returns authenticated user identity, role, and linked profile |
| `POST /refresh-token` | Refresh Cookie | — | Rotates refresh token, returns new 15-minute `accessToken` |
| `POST /logout` | Refresh Cookie | — | Revokes session hash in DB/cache, blacklists access token, clears cookie |
| `POST /phone/send-otp` | Public | `{ phone, purpose? }` | Generates and sends SMS OTP via Twilio |
| `POST /phone/verify-otp` | Public | `{ phone, otp, purpose? }` | Verifies SMS OTP hash and marks phone verified |
| `POST /email/send-otp` | Public | `{ email, name? }` | Generates and sends 6-digit email OTP via Nodemailer |
| `POST /email/verify-otp` | Public | `{ email, otp }` | Verifies email OTP hash and marks email verified |
| `POST /password/send-reset` | Public | `{ email }` | Sends password reset OTP to email |
| `POST /password/verify` | Public | `{ email, otp, newPassword }` | Verifies reset code and updates `passwordHash` |
| `GET /google` | Public | Query: `?role=RESIDENT\|OWNER` | Initiates Google OAuth 2.0 flow |
| `GET /google/callback` | Public | OAuth code + state | Completes Google OAuth sign-in and redirects to client |

---

## 9. Fault Tolerance, Fallbacks & System Resilience

The system guarantees **high availability and zero-crash degradation**:

```
┌───────────────────────┬───────────────────────────────────┬──────────────────────────────────────────┐
│ Component Failure     │ Fallback Behavior                 │ User Impact                              │
├───────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ **Redis Offline**     │ In-Memory Map Fallback            │ All caching, rate-limiting, and tokens   │
│                       │ (`cache.service.ts`)              │ work seamlessly in memory. No downtime.  │
├───────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ **Redis OTP Offline** │ MongoDB Fallback                  │ OTPs automatically stored/verified in    │
│                       │ (`OtpToken` collection)           │ MongoDB `OtpToken` table.                │
├───────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ **SMS API Outage**    │ Email Fallback                    │ If phone SMS fails, OTP is routed to     │
│                       │ (`RedisOtpService.ts`)            │ the verified email address on record.    │
├───────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ **Client Disconnect** │ LocalStorage Draft Engine         │ Incomplete signup restored in 1-click on │
│                       │ (`roombae_incomplete_signup`)     │ next browser launch.                     │
└───────────────────────┴───────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 10. Security & Cryptography Standards

1. **Field-Level Encryption (AES-256-GCM):**
   - Bank account numbers, Aadhaar numbers, and PAN numbers are encrypted at rest using AES-256-GCM with dynamic initialization vectors (`iv:authTag:ciphertext`).
2. **Password Hashing:**
   - Passwords hashed with **Bcrypt** (cost factor 12) or **Argon2id**.
3. **Secret Token Hashing:**
   - Refresh tokens and OTPs are **never stored raw in any database or cache**. Only `sha256(token)` is persisted.
4. **Header Security:**
   - `Helmet` sets strict HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
   - `CORS` configured with explicit allowed origins.
   - `MongoSanitize` and `xss-clean` prevent injection attacks.
