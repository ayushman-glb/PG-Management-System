# Requirements - RoomBae PG Management System

## 1. Business Domain

RoomBae is a PG (Pay Guest / Property Guesthouse) management system that handles:
- Property management (PGs, buildings, floors, rooms, beds)
- Resident lifecycle (onboarding, move-in, status changes, leave/hold, move-out)
- Owner management (KYC, business info, subscriptions)
- Booking & applications (tours, rental applications, agreements)
- Billing & payments (invoices, payments via Razorpay, refunds)
- Operations (complaints, maintenance, visitors, check-ins)
- Meal system (meal plans, schedules, meal skipping)
- Communication (messaging, notifications)
- Analytics & reporting
- Digital document generation (invoices, agreements, receipts via Cloudinary)

## 2. User Roles & RBAC

| Role | Description |
|------|-------------|
| SUPER_ADMIN | System-wide administration |
| ADMIN | PG-level administration |
| OWNER | Property owner - manages PGs, residents, finances |
| MANAGER | PG manager - operational oversight |
| STAFF | Staff member - handles daily operations |
| RESIDENT | Tenant - occupies a bed in a PG |
| PUBLIC | Unauthenticated/public role |

## 3. Core Workflows

### 3.1 Authentication & Authorization
1. User registers with email + phone
2. Phone verification via OTP (SMS/email)
3. Email verification via token link
4. Login with email + password (bcrypt hashed)
5. JWT access token + refresh token rotation
6. Optional TOTP 2FA
7. OAuth login (Google)
8. Role-based authorization on all protected routes

### 3.2 Resident Lifecycle
1. Owner creates PG with buildings/floors/rooms/beds
2. Resident applies (tour request → rental application)
3. Resident submits documents (aadhaar, PAN, etc.)
4. Agreement generation & digital signature
5. Move-in: bed assignment, key handover
6. Active: meal plans, payments, complaints, visitors
7. Leave/Hold applications
8. Move-out: checkout, deposit refund, exit interview

### 3.3 Billing & Payments
1. Monthly billing cycle creation
2. Invoice generation (GST inclusive: CGST/SGST or IGST)
3. Payment via Razorpay (card/UPI/netbanking)
4. Payment confirmation webhook
5. Refunds via Razorpay API
6. Dues tracking (late fees, pending payments)
7. Analytics dashboard (MRR, occupancy, revenue, arrears)

### 3.4 Operations
1. Complaint submission → staff assignment → resolution
2. Maintenance scheduling with vendor tracking
3. Visitor pass generation with gate pass
4. Check-in/out tracking
5. Attendance tracking

### 3.5 Digital Documents
1. Deterministic document key generation
2. PDF generation from templates
3. Cloudinary storage with integrity hashing (SHA256)
4. Document audit logging
5. Versioning support

## 4. Technical Requirements

### 4.1 Backend (Express + Prisma + MongoDB)
- Node.js 20 + TypeScript
- Express framework with Zod validation
- Prisma ORM with MongoDB provider
- JWT authentication (access + refresh token rotation)
- Redis for session/cache/OTP storage
- Razorpay for payments
- Brevo (SendGrid alternative) for email
- Cloudinary for file storage
- Rate limiting on auth endpoints
- CORS, Helmet, compression security
- Structured logging (winston)
- Comprehensive error handling (AppError pattern)

### 4.2 Frontend (React + Vite + Tailwind)
- React 18 + TypeScript
- Vite build tool with Tailwind CSS v4
- Framer Motion for animations
- Client-side state routing (no React Router dependency)
- Axios-based API client
- Theme system (light/dark mode)
- Responsive design

### 4.3 Infrastructure
- Docker Compose (MongoDB replica set, Redis, Nginx, dual backend)
- CI/CD via GitHub Actions
- Frontend deployed to GitHub Pages
- Backend deployed to Render.com
- MongoDB Atlas for production database

## 5. API Endpoints (from audit)

### Auth Module
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/send-otp
- POST /api/v1/auth/verify-otp
- POST /api/v1/auth/send-email-code
- POST /api/v1/auth/verify-email
- POST /api/v1/auth/refresh-token
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- POST /api/v1/auth/2fa/setup
- POST /api/v1/auth/2fa/verify
- POST /api/v1/auth/2fa/disable
- GET /api/v1/auth/google
- GET /api/v1/auth/google/callback

### PG Module
- GET /api/v1/pgs (search/filter)
- GET /api/v1/pgs/:id
- POST /api/v1/pgs (owner)
- PUT /api/v1/pgs/:id (owner)
- DELETE /api/v1/pgs/:id (owner)

### Residents Module
- GET /api/v1/residents/directory
- GET /api/v1/residents/profile
- GET /api/v1/residents/me
- POST /api/v1/residents/onboard
- POST /api/v1/residents/visitor-pass
- POST /api/v1/residents/gate-pass
- POST /api/v1/residents/meal-skip
- GET /api/v1/residents/:id/status-history
- PATCH /api/v1/residents/:id/status

### Billing Module
- GET /api/v1/billing/analytics (real DB queries, NOT mock)
- POST /api/v1/billing/create-order (Razorpay)
- POST /api/v1/billing/verify-payment (Razorpay)
- POST /api/v1/billing/refund (real Razorpay API)
- GET /api/v1/billing/payments
- GET /api/v1/billing/invoices/:id

### Plus: Applications, Tours, Agreements, Documents, Complaints, Messages, MoveIn, Owners

## 6. Database Schema (MongoDB)

The Prisma schema (1377 lines) defines 40+ models with 30+ enums. Key relationships:
- User → Owner / Resident (1:1)
- Owner → PG (1:N)
- PG → Building → Floor → Room → Bed (hierarchical)
- Resident → Bed (1:1, current assignment)
- Payment → Invoice (1:1)
- PG → Payment, Invoice, Analytics (1:N)
- Agreement → Signature, Verification, Version (1:N)
- Application → Document, LeaseSignature (1:N)

## 7. Security Requirements
- JWT tokens via Authorization header only (never URL query params)
- JWT secret from environment (.env - never hardcoded)
- Razorpay keys from environment (never hardcoded)
- Brevo API key from environment
- Cloudinary credentials from environment
- Password hashing with bcrypt (12 rounds)
- OTP codes: 6 digits, 5-minute expiry, max 5 attempts
- Rate limiting: login (5/1min), OTP (3/10min), register (5/1hr)
- Audit logging for all sensitive operations
- CORS whitelist for known origins
- Helmet security headers
