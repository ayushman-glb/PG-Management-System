# Audit Report - RoomBae PG Management System

## Executive Summary
The system is a full-stack PG (Property/Guesthouse) management application with a TypeScript backend (Express + Prisma/MongoDB) and React + Vite frontend (Tailwind CSS v4). The codebase has substantial partial implementation: auth, billing, residents, owners, bookings, complaints, documents, and more are scaffolded with real and mock implementations. **Key critical issues**: production-blocking mock OTP/email verification, hardcoded analytics, duplicate file structures, unused dependencies, and documentation inconsistencies.

---

## 1. Backend Audit

### 1.1 Critical Issues

#### 1.1.1 Mock OTP Service (PRODUCTION BLOCKER)
**File**: `backend/src/infrastructure/otp/MockOtpService.ts`
**Impact**: All phone verification is completely insecure. The mock always accepts OTP "123456" regardless of what was sent.
```typescript
// MockOtpService.ts:13
async verifyPhoneOtp(_phone: string, _otp: string): Promise<boolean> {
  return true; // Always returns true
}
```
**Evidence**: `backend/src/container/index.ts` injects `MockOtpService` instead of a real implementation.
**Fix**: Implement real OTP via email (Brevo/SendGrid) or SMS provider with secure 6-digit codes stored in Redis with TTL.

#### 1.1.2 Fake Email Verification (PRODUCTION BLOCKER)
**File**: `backend/src/modules/auth/auth.service.ts`
**Impact**: Email verification always succeeds. No real token is sent or validated.
```typescript
// auth.service.ts - sendEmailVerification always returns success
// verifyEmail always marks email as verified without checking a real token
```
**Fix**: Implement real email verification flow with signed tokens stored in DB with TTL.

#### 1.1.3 Hardcoded Mock Analytics (PRODUCTION BLOCKER)
**File**: `backend/src/services/billingService.ts`
**Impact**: Payment analytics dashboard returns fabricated numbers regardless of actual database state.
```typescript
// billingService.ts (mock)
getPaymentAnalytics: {
  totalRevenue: 2750000,     // Hardcoded
  totalPayments: 1250,        // Hardcoded
  pendingDues: 450000,        // Hardcoded
  ...
}
```
**Fix**: Replace with real Prisma queries against the `payment` and `billingCycle` collections.

#### 1.1.4 Mock Refunds (PRODUCTION BLOCKER)
**File**: `backend/src/services/billingService.ts`
**Impact**: Refund processing generates fake `rfnd_${Math.random()}` IDs without calling Razorpay API.
```typescript
// billingService.ts
processRefund: {
  razorpayRefundId: `rfnd_${Math.random().toString(36).substring(7)}`, // Fake
  ...
}
```
**Fix**: Implement real Razorpay refund API integration.

#### 1.1.5 Hardcoded Unsplash Fallback Images
**Files**: Multiple service and controller files
**Impact**: Avatar/logo images point to external Unsplash URLs as fallbacks instead of local/cloudinary defaults.
```typescript
// Pattern found across multiple files
avatarUrl: avatarUrl || "https://images.unsplash.com/photo-..."
```

### 1.2 High Priority Issues

#### 1.2.1 Duplicate Service Implementations
- `backend/src/services/billingService.ts` (old mock) vs `backend/src/modules/billing/billing.service.ts` (new module)
- `backend/src/services/authService.ts` may duplicate `backend/src/modules/auth/auth.service.ts`
- `backend/src/__tests__/` and `backend/src/tests/` (two test directories)

#### 1.2.2 GraphQL References (No Implementation)
**Files**: `backend/src/config/env.ts: GRAPHQL_PATH`, `backend/src/config/swagger.ts: graphql`
**Impact**: Config references GraphQL endpoint that doesn't exist. No `graphql` directory in the codebase.
**Fix**: Remove GraphQL stubs.

#### 1.2.3 Excessive console.log in Auth Service
**File**: `backend/src/modules/auth/auth.service.ts`
**Finding**: 7 `console.log/warn` statements used for audit logging instead of proper logger.

#### 1.2.4 SOAP Service (Architecture Concern)
**File**: `backend/src/app.ts`
**Finding**: `setupSoapServer` is called in app initialization. Unclear if actively used.

### 1.3 Medium Priority Issues

#### 1.3.1 Security Pipeline Middleware Complexity
**File**: `backend/src/middleware/securityPipeline.middleware.ts`
**Finding**: Complex middleware chain (Helmet, CORS, compression, etc.) - needs verification it's correctly applied.

#### 1.3.2 Two Validation Middlewares
- `backend/src/middleware/validateMiddleware.ts` (Express middleware style)
- `backend/src/core/middleware/validateRequest.ts` (Zod-based core style)
**Finding**: Inconsistent validation patterns across modules.

#### 1.3.3 Missing Input DTO Validation
**Finding**: Many routes use `authenticate` but don't validate request body/query params with Zod schemas.

### 1.4 Low Priority Issues

#### 1.4.1 Redis Stub
**File**: `backend/src/infrastructure/redis/redisStub.ts`
**Finding**: Fallback stub when Redis is unavailable. Verify it's not used in production path.

#### 1.4.2 Seed Data Hardcoded
**File**: `backend/src/server.ts`
**Finding**: Seed fallback with hardcoded data - acceptable for dev but should be gated to non-production.

---

## 2. Frontend Audit

### 2.1 Critical Issues

#### 2.1.1 OAuth Callback Token in URL (SECURITY)
**Finding**: OAuth callback tokens are passed via URL query params instead of cookies/postMessage.
**Fix**: Use httpOnly cookies or postMessage for OAuth token delivery.

### 2.2 High Priority Issues

#### 2.2.1 Duplicate Component Files
**Finding**: Root-level `components/` directory has tiny stub files that re-export from subdirectories:
```
components/
├── animations/     (real implementations)
├── feedback/
├── layouts/
├── shared/
└── ui/
```
**Root `components/` files**: `src/app/App.tsx`, `vite.config.ts` references `@/components/*` which resolves to root stubs.

#### 2.2.2 Duplicate Page Files
**Finding**: `pages/` directory contains stub re-exports of files in `features/`:
```
pages/
├── Dashboard/      (stub -> features/dashboard/)
├── Auth/           (stub -> features/auth/)
└── ...
```

#### 2.2.3 Vite Config Figma References
**File**: `frontend/vite.config.ts`
**Finding**: References `.figma/make/site.json` which has incorrect description.

#### 2.2.4 No Frontend Tests
**Finding**: Zero test infrastructure (no vitest, jest, or testing-library configured).

#### 2.2.5 Unused @graphql Path Alias
**File**: `frontend/tsconfig.json`
**Finding**: `@graphql/*` alias configured but no `graphql` directory exists.

### 2.3 Medium Priority Issues

#### 2.3.1 Hardcoded Analytics Fallback
**Finding**: Frontend has fallback dashboard values when API calls fail.

#### 2.3.2 No React Router
**Finding**: Uses client-side state routing (`useState<Page>` in App.tsx). This limits deep linking and SEO.
**Decision**: Preserve this routing pattern per architecture, but document the limitation.

#### 2.3.3 Console Logs (34 found)
**Finding**: `console.log/warn/error` throughout frontend codebase - should use proper logger or remove.

### 2.4 Low Priority Issues

#### 2.4.1 Animation Library Redundancy
**Finding**: `providers.tsx` imports `SmoothScroll` and `ScrollProgressBar` from `@components/animations/` - verify no GSAP/Lenis duplicate.

---

## 3. Architecture & Documentation Audit

### 3.1 Database Provider Mismatch
**Finding**: `.planning/codebase/docs/INTEGRATIONS.md` mentions PostgreSQL, but `backend/prisma/schema.prisma` uses `provider = "mongodb"`.
**Decision**: MongoDB is the actual database. Documentation is wrong.

### 3.2 GraphQL Documentation Discrepancy
**Finding**: Documentation mentions GraphQL API, but no GraphQL implementation exists.
**Decision**: REST-only API. Remove GraphQL references.

### 3.3 AWS S3 vs Cloudinary
**Finding**: INTEGRATIONS.md mentions AWS S3, but actual storage uses Cloudinary.
**Decision**: Cloudinary is the storage provider.

### 3.4 AGENTS.md Location
**Finding**: `frontend/AGENTS.md` is a Figma Make artifact, not GSD-related. GSD config references `.agents/GEMINI.md`.
**Decision**: GSD config is correct; Figma's AGENTS.md should be updated to reflect post-Figma-Make state.

---

## 4. Infrastructure Audit

### 4.1 Docker Compose
**File**: `docker-compose.yml`
**Status**: Correctly configured for MongoDB replica set, Redis, Nginx, dual backend containers.
**Note**: MongoDB replicas needed for transactions (Prisma MongoDB requires replica set for `$transaction`).

### 4.2 CI/CD
- **CI**: Backend typecheck + build, Frontend typecheck + build - correctly configured
- **Deploy**: Frontend → GitHub Pages - correctly configured

### 4.3 Environment Configuration
**File**: `.env.example`
**Status**: Complete template with all required env vars (JWT_SECRET, RAZORPAY_*, BREVO_API_KEY, MONGO_URL, etc.)
**Rule**: `.env*` files must NOT be read or modified.

---

## 5. Test Coverage Audit

### 5.1 Backend Tests
**Files**: `backend/src/__tests__/auth.test.ts`, `backend/src/tests/`
**Status**: Limited test coverage. Auth tests exist but coverage for other modules is unclear.

### 5.2 Frontend Tests
**Status**: No test infrastructure whatsoever.

---

## 6. Prisma Schema Audit

The Prisma schema (`backend/prisma/schema.prisma`) defines 20+ models:
- **User** (with Role enum: ADMIN, OWNER, STAFF, RESIDENT)
- **Resident**, **Owner**, **Staff** (extends User)
- **Payment**, **BillingCycle**, **VisitorPass**, **GatePass**, **MealSkip**
- **Booking**, **Tour**, **Application**, **Agreement**, **Document**
- **Complaint**, **Message**, **Amenity**, **HouseRule**
- **Notification**, **ActivityLog**, **RefreshToken**
- **OTP** (for verification codes)
- Plus enums: Gender, RoomType, BookingStatus, PaymentStatus, ComplaintStatus, etc.

**Key Feature**: Schema uses MongoDB-specific features (`@@map`, embedded types, relations via `@relation`).

---

## 7. Priority Action Items

| Priority | Issue | Phase |
|----------|-------|-------|
| P0 | Replace MockOtpService with real OTP | Phase 6 |
| P0 | Replace fake email verification with real flow | Phase 6 |
| P0 | Replace hardcoded analytics with real queries | Phase 6, Phase 8 |
| P0 | Replace mock refunds with Razorpay API | Phase 8 |
| P1 | Remove duplicate service implementations | Phase 7 |
| P1 | Remove GraphQL stubs | Phase 5 |
| P1 | Remove duplicate frontend files | Phase 13 |
| P1 | Fix duplicate test directories | Phase 7 |
| P2 | Remove/unused @graphql path alias | Phase 13 |
| P2 | Add frontend test infrastructure | Phase 13 |
| P2 | Fix OAuth callback security | Phase 11 |
| P3 | Remove console.log statements | Phase 13 |
| P3 | Clean up Vite config Figma references | Phase 13 |

---

## 8. Files Read During Audit

### Backend
- `backend/src/app.ts` - Express app with CORS, middleware, route registration
- `backend/src/server.ts` - Server bootstrap, MongoDB connection, seed fallback
- `backend/src/config/env.ts` - Environment config with Zod validation (has GraphQL stub)
- `backend/src/config/swagger.ts` - Swagger/OpenAPI config (has GraphQL stub)
- `backend/src/container/index.ts` - DI container (injects MockOtpService)
- `backend/src/modules/auth/auth.routes.ts` - Auth routes (login, register, OTP, email verify, 2FA, OAuth)
- `backend/src/modules/auth/auth.controller.ts` - Auth controller (Google/Passport OAuth, TOTP 2FA)
- `backend/src/modules/auth/auth.service.ts` - Auth service (hardcoded OTP, console.log abuse)
- `backend/src/middleware/authMiddleware.ts` - JWT auth middleware (correctly rejects URL query tokens)
- `backend/src/middleware/validateMiddleware.ts` and `backend/src/core/middleware/validateRequest.ts` - Zod validation
- `backend/src/middleware/rateLimiter.ts` - Express rate limiting
- `backend/src/middleware/auditLogger.ts` - Audit logging via ActivityLog model
- `backend/src/modules/billing/billing.routes.ts` - Billing routes (mock data)
- `backend/src/services/billingService.ts` - Billing service (mock with hardcoded analytics/refunds)
- `backend/src/modules/applications/` - Applications module
- `backend/src/modules/tours/` - Tours module
- `backend/src/modules/complaints/` - Complaints module
- `backend/src/modules/documents/` - Documents module
- `backend/src/modules/owners/` - Owners module
- `backend/src/modules/residents/` - Residents module
- `backend/src/modules/rooms/` - Rooms module
- `backend/src/routes/residentRoutes.ts` - Legacy resident routes
- `backend/src/routes/media.routes.ts` - Media routes
- `backend/src/infrastructure/otp/MockOtpService.ts` - Mock OTP service
- `backend/prisma/schema.prisma` - Full Prisma schema (MongoDB)

### Frontend
- `frontend/src/app/App.tsx` - Main app (client-side routing via useState<Page>)
- `frontend/src/app/routes.tsx` - Route definitions with lazy loading
- `frontend/src/app/providers.tsx` - Providers (ThemeProvider, SmoothScroll, ScrollProgressBar)
- `frontend/src/hooks/useAuth.ts` - Auth hook (localStorage-based)
- `frontend/src/services/api.ts` - API client base
- `frontend/src/services/auth.service.ts` - Auth service (hardcoded OTP verification)
- `frontend/src/theme/index.ts` - Theme re-export
- `frontend/vite.config.ts` - Vite config (Figma Make plugins)
- `frontend/tsconfig.json` - Path aliases
- `frontend/package.json` - Dependencies

### Documentation
- `frontend/.planning/codebase/docs/INTEGRATIONS.md` - Wrong DB provider
- `frontend/.planning/codebase/docs/API_DESIGN.md` - REST API endpoints
- `backend/prisma/schema.prisma` - Prisma schema
- `.env.example` - Environment variable template
- `frontend/AGENTS.md` - Figma Make artifact (not GSD-related)
- `.github/workflows/ci.yml` - CI configuration
- `.github/workflows/deploy.yml` - Deploy configuration
- `docker-compose.yml` - Docker configuration
