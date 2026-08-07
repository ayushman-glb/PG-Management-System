# 01 Codebase Analysis

> Consolidated documentation chapter for **backend**

---

## Source: $relSource

# System Architecture & Design Patterns

**Analysis Date:** 2026-08-07

## Overview
The **RoomBae PG Management System** is built as a zero-trust enterprise web application with a decoupled architecture comprising:
1. **Frontend SPA**: React 19 + TypeScript + Vite + TailwindCSS v4 + Zustand state management.
2. **Backend API**: Node.js + Express + TypeScript + Prisma ORM + Redis + Socket.io.
3. **Container & Deployment**: Docker Compose, Nginx reverse proxy, and Kubernetes manifests for deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser SPA                       │
│      React 19 | Tailwind v4 | Zustand | Socket.io Client   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSockets
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│     Express REST API         ││   Socket.io Gateway          │
│ Middlewares | Rate Limiters  ││ Real-time Events & Notifs    │
└──────────────┬───────────────┘└──────────────┬───────────────┘
               │                               │
               ├───────────────────────────────┤
               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│     Prisma ORM & PostgreSQL  ││   Redis Cache & Sessions     │
└──────────────────────────────┘└──────────────────────────────┘
```

## Architectural Patterns

### 1. Backend Layering & Controller Pattern
- **Routes Layer**: Express routers defining endpoints and attaching security/auth middlewares (e.g. `backend/src/modules/properties/property.routes.ts`).
- **Controller Layer**: Handles HTTP requests, extracts parameters, validates schemas using Zod, calls business logic services, and returns formatted JSON responses.
- **Service Layer**: Business logic modules (e.g. Cloudinary uploading, PDF generation, Razorpay integration, email notifications).
- **Data Access Layer**: Prisma Client interactions (`@prisma/client`) with strongly typed database queries.

### 2. Frontend Feature-Driven Architecture
- **Features Modularization**: Located in `frontend/src/features/` (e.g. `billing/`, `owners/`, `residents/`, `properties/`).
- **Global State**: Zustand stores managing user auth state, theme preferences, and active notifications.
- **Service Abstractions**: API service modules handling Axios/Fetch requests (`frontend/src/services/`).

### 3. Security Architecture & Zero Trust
- **Rate Limiting**: Tiered rate limiters implemented with `express-rate-limit` and `rate-limiter-flexible`.
- **Security Middlewares**: Helmet HTTP headers, CORS origin verification, HTTP parameter pollution prevention, and XSS sanitization.
- **Auth Guard**: Role-based access control (RBAC) supporting multi-role access (Admin, Owner, Resident).

---
*Codebase analysis: 2026-08-07*



---

## Source: $relSource

# Technical Debt & Area Concerns

**Analysis Date:** 2026-08-07

## Security & Environment Concerns
- **Fallback Secret Values**: Some environment files or fallback logic contain default fallback keys for development (e.g. JWT secrets or fallback URLs). Production deployments must strictly enforce populated `.env` values.
- **CORS Allowed Origins**: Ensure `frontendUrl.ts` strict origin checking is enabled in staging/production environments to prevent wildcard access.

## Codebase & Refactoring Opportunities
- **Frontend Test Suite**: The frontend currently lacks an automated component test suite (e.g., Vitest or React Testing Library). Adding unit/integration tests for critical user flows (e.g. `OwnerOnboardingWizard`, `PayRentModal`) will increase confidence.
- **Duplicated Test Folders**: Both `backend/src/__tests__/` and `backend/src/tests/` exist. Standardizing on `backend/src/__tests__/` will improve organization.

## Performance & Scalability Considerations
- **Media Upload Processing**: Sharp image optimization and Cloudinary uploads should be offloaded to a background worker queue (e.g. BullMQ with Redis) for large bulk file uploads.
- **WebSocket Connection Scaling**: Scaling Socket.io across multiple backend container instances requires Redis Pub/Sub adapter setup (`@socket.io/redis-adapter`).

---
*Codebase analysis: 2026-08-07*



---

## Source: $relSource

# Coding Conventions & Development Guidelines

**Analysis Date:** 2026-08-07

## Naming Conventions
- **Files & Directories**:
  - React components: PascalCase (e.g. `OwnerOnboardingWizard.tsx`, `PayRentModal.tsx`)
  - Controllers, Services, Utils: camelCase (e.g. `billingController.ts`, `cloudinary.service.ts`, `QrCodeService.ts`)
  - Test files: `.test.ts` / `.spec.ts` suffix inside `__tests__/` or `tests/`
- **Variables & Functions**: camelCase for variables, functions, and methods; PascalCase for Types, Interfaces, and Classes; UPPER_SNAKE_CASE for constants.

## TypeScript Practices
- **Strict Mode**: `tsconfig.json` configured with strict type checks (`noEmit: true` on check).
- **Schema Validation**: Zod schemas used for API payload validation on backend endpoints and frontend forms.
- **Type Imports**: Explicit `import type { ... }` where applicable.

## Error Handling
- **Centralized Error Handling**: Express global error handler middleware catching unhandled errors and formatting standard JSON error payloads.
- **Custom Error Classes**: Standardized HTTP exception handlers with appropriate status codes (400, 401, 403, 404, 500).

## Code Style & Formatting
- **Frontend Code Formatting**: Configured with `oxfmt` (`npm run format` in `frontend`).
- **Imports Grouping**: Third-party modules first, followed by internal absolute or relative path imports.

---
*Codebase analysis: 2026-08-07*



---

## Source: $relSource

# Integrations & External Services

**Analysis Date:** 2026-08-07

## Database & Caching
- **PostgreSQL / SQL Database**: Managed via Prisma ORM (`@prisma/client`). Stores PG properties, room availability, resident profiles, billing records, rent payments, and complaints.
- **Redis Cache & Session Store**: Connection configured via `redis` client (`^6.2.0`). Used for auth session management, rate limiting, and real-time socket mapping.

## Authentication & Security
- **Google OAuth 2.0**: Integrated via `passport-google-oauth20` for social authentication and resident onboarding.
- **reCAPTCHA Enterprise**: Configured for signup/login bot protection and rate abuse prevention (`docs/RECAPTCHA_ENTERPRISE.md`).
- **JWT Authentication**: Access and refresh tokens generated via `jsonwebtoken` with secure cookie storage (`cookie-parser`).

## Storage & Asset Management
- **Cloudinary CDN**: Media storage service integrated via `cloudinary` SDK (`backend/src/services/cloudinary.service.ts`). Handles profile pictures, property images, and maintenance complaint attachments.
- **Multer & Sharp**: File parsing and image optimization pipeline for user uploads before Cloudinary dispatch.

## Payment Gateway & Billing
- **Razorpay**: Direct integration (`razorpay` SDK `^2.9.5`) for automated rent generation, payment links, webhooks verification, and transaction history.

## Real-Time Communication
- **Socket.io**: WebSockets server integration (`socket.io` `^4.8.3`) handling live notifications, chat, complaint updates, and owner/resident dashboard updates (`frontend/src/services/socket.ts`).

## Email & Messaging
- **Nodemailer**: SMTP email service for rent receipts, password reset links, and onboarding notifications.
- **SOAP Services**: SOAP client integration (`soap` package) for external enterprise integrations.

---
*Codebase analysis: 2026-08-07*



---

## Source: $relSource

# Technology Stack

**Analysis Date:** 2026-08-07

## Core Languages & Runtimes
- **TypeScript**: `^5.7.3` (Backend) / `^5.7.0` (Frontend)
- **Node.js**: Enterprise TypeScript runtime environment (v20+ supported)

## Frontend Stack
- **Framework**: React `^19.0.0` with React DOM `^19.0.0`
- **Build Tool**: Vite `^8.0.0` with `@vitejs/plugin-react` `^6.0.0`
- **Styling**: TailwindCSS `^4.0.0` with `@tailwindcss/vite` `^4.0.0`
- **State Management**: Zustand `^5.0.14`
- **Animations & UI**:
  - GSAP `^3.15.0` & `@gsap/react` `^2.1.2`
  - Framer Motion `^12.42.2`
  - Lenis smooth scroll `^1.3.25`
  - Lucide React icons `^1.26.0`
  - Recharts `^3.10.0` for charts and analytics
- **Real-Time Client**: `socket.io-client` `^4.8.3`
- **Form & Schema Validation**: Zod `^4.4.3`
- **Formatter & Linter**: `oxfmt` `^0.2.0`

## Backend Stack
- **Framework**: Express `^4.21.2`
- **ORM & Database Client**: Prisma `^5.22.0` (`@prisma/client`)
- **Dev Server**: `ts-node-dev` `^2.0.0` / `ts-node` `^10.9.2`
- **Real-Time Server**: Socket.io `^4.8.3`
- **Caching & Session Storage**: Redis `^6.2.0`
- **Security & Middleware**:
  - Helmet `^8.3.0`
  - CORS `^2.8.5`
  - Cookie Parser `^1.4.7`
  - Compression `^1.7.5`
  - Express Rate Limit `^7.5.0` & `rate-limiter-flexible` `^11.2.0`
  - HPP (HTTP Parameter Pollution) `^0.2.3`
  - XSS Clean `^0.1.4`
  - Express Mongo Sanitize `^2.2.0`
  - Morgan logger `^1.11.0` & Winston logger `^3.19.0`
- **Authentication & Hashing**:
  - Argon2 `^0.45.1` & Bcryptjs `^2.4.3`
  - JSONWebToken `^9.0.2`
  - Passport `^0.7.0` & Passport Google OAuth 2.0 `^2.0.0`
- **Validation**: Zod `^3.24.1`

## Key Utilities & Integrations
- **Cloud Storage**: Cloudinary `^2.10.0`
- **File Upload**: Multer `^2.2.0` with File Type `^22.0.1` & Sharp `^0.35.3` image processing
- **Payment Gateway**: Razorpay `^2.9.5`
- **Email Service**: Nodemailer `^9.0.3`
- **Document & PDF Generation**: PDFKit `^0.15.2`, PDF Parse `^2.4.5`, QRCode `^1.5.4`

## Testing & Tooling
- **Backend Testing**: Jest `^30.4.2`, `ts-jest` `^29.4.12`, Supertest `^7.2.2`
- **Deployment & Infra**: Docker Compose (`docker-compose.yml`), Nginx (`nginx.conf`), Kubernetes manifests (`k8s/`), GitHub Pages deployment (`gh-pages`).

---
*Codebase analysis: 2026-08-07*



---

## Source: $relSource

# Directory Structure & Layout

**Analysis Date:** 2026-08-07

## Repository Root Layout
```
PG Management system2/
├── .agents/                 # Local GSD agents, skills, and runtime configurations
├── .github/                 # Workflows & CI/CD pipelines
├── backend/                 # Node.js + Express + Prisma Backend Service
│   ├── prisma/              # Prisma schema & seed scripts
│   ├── src/                 # Backend source files
│   │   ├── __tests__/       # Integration and unit tests
│   │   ├── config/          # Environment & service configurations
│   │   ├── controllers/     # Controller implementations
│   │   ├── middlewares/     # Auth, rate-limit, and security middlewares
│   │   ├── modules/         # Modular route domain handlers
│   │   ├── services/        # Third-party & helper services
│   │   ├── tests/           # Dedicated test suites
│   │   ├── utils/           # Utility functions & PDF/QR generators
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point
│   └── Dockerfile           # Backend container build specification
├── frontend/                # React 19 + Vite + Tailwind v4 Frontend App
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── app/             # Application providers & layout routes
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature modules (billing, owners, residents, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and WebSocket client services
│   │   ├── stores/          # Zustand state stores
│   │   ├── types/           # Shared TypeScript interfaces
│   │   └── utils/           # Helper functions
│   └── vite.config.ts       # Vite build configuration
├── docs/                    # Architectural & integration documentation
├── k8s/                     # Kubernetes deployment manifests
├── docker-compose.yml       # Docker compose orchestration
├── nginx.conf               # Reverse proxy configuration
└── package.json             # Root monorepo script orchestrator
```

## Key Code Locations
- **Backend Entry Point**: `backend/src/server.ts`
- **Backend App Config**: `backend/src/app.ts`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Frontend Entry Point**: `frontend/src/main.tsx` & `frontend/src/App.tsx`
- **Frontend State**: `frontend/src/stores/`
- **Documentation**: `README.md`, `AUTH_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md`, `CLOUDINARY_SETUP.md`

---
*Codebase analysis: 2026-08-07*



---

## Source: $relSource

# Testing Architecture & Patterns

**Analysis Date:** 2026-08-07

## Test Framework & Tools
- **Runner**: Jest `^30.4.2` with `ts-jest` `^29.4.12`
- **HTTP Assertions**: Supertest `^7.2.2` for testing Express endpoints.
- **Location**: `backend/src/__tests__/` and `backend/src/tests/`

## Running Tests
To run backend tests:
```bash
cd backend
npm test
```

## Mocking & Isolation Strategy
- Database isolation via mock Prisma client or test DB seeds (`prisma/seedDemoData.ts`).
- Supertest used to execute REST endpoints directly against the Express `app` instance without needing a live external HTTP port listening.
- Environment variables injected via `dotenv` in test setup fixtures.

## Test Coverage Priorities
1. **Authentication & Authorization**: `auth.test.ts` (Login, registration, JWT validation, Google OAuth flow).
2. **Frontend Config & URL handling**: `frontendUrl.test.ts`.
3. **Billing & Rent Payment**: Invoice generation and payment processing validations.

---
*Codebase analysis: 2026-08-07*



---

