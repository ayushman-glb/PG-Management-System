# RoomBae — Centralized Authentication & Authorization Architecture

This document outlines RoomBae's hybrid authentication architecture combining Firebase Phone Authentication, Google OAuth 2.0 Sign-In, and Node.js JWT Access & Refresh Token Sessions.

---

## 1. Authentication Architecture Overview

```
Frontend Client (React)
   │
   ├─► Firebase Web SDK (Phone Auth SMS OTP / Google Sign-In)
   │      │
   │      └─► Obtains Firebase ID Token
   │
   ▼
Express Backend (/api/v1/auth/firebase-login or /auth/google)
   │
   ├─► Firebase Admin SDK (firebaseAdmin.auth().verifyIdToken)
   │
   ├─► User Lookup / Upsert in MongoDB
   │
   └─► Session Tokens Generation:
          ├── Access Token (JWT, 15m expiration, Bearer Header)
          └── Refresh Token (JWT, 7d expiration, HTTP-Only Cookie)
```

---

## 2. Shared Service Parity (REST ↔ GraphQL)

Both REST controllers and GraphQL resolvers delegate directly to `Container.authService` without duplicated logic:

| Operation | REST Endpoint | GraphQL Mutation | Shared Handler Method |
| :--- | :--- | :--- | :--- |
| **Phone / Firebase Login** | `POST /api/v1/auth/firebase-login` | `mutation { firebaseLogin }` | `authService.phoneVerify(idToken)` |
| **Email Login** | `POST /api/v1/auth/login` | `mutation { login }` | `authService.login(identifier, pass)` |
| **Register** | `POST /api/v1/auth/register` | `mutation { register }` | `authService.register(userData)` |
| **Email OTP Send** | `POST /api/v1/auth/send-otp` | `mutation { sendEmailOTP }` | `authService.sendEmailVerification(email)` |
| **Email OTP Verify** | `POST /api/v1/auth/verify-otp` | `mutation { verifyEmailOTP }` | `authService.verifyEmail(email, code)` |
| **Profile Fetch** | `GET /api/v1/auth/me` | `query { me }` | `authService.me(userId)` |

---

## 3. Session Management & Security

1. **Access Token (15 Minutes)**: Passed in `Authorization: Bearer <token>` headers. Signed with `JWT_SECRET`.
2. **Refresh Token (7 Days)**: Stored in an `httpOnly`, `sameSite: lax`, `secure` (in production) cookie named `refreshToken`.
3. **Role-Based Access Control (RBAC)**: Enforced via `Role` enum (`SUPER_ADMIN`, `ADMIN`, `OWNER`, `RESIDENT`, `STAFF`, `PUBLIC`).
