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
