# RoomBae Enterprise Architecture Documentation

## 1. Executive Summary
RoomBae is an enterprise-grade PG and Co-Living Management SaaS platform built on standard Domain-Driven Design (DDD) principles. This document outlines the frontend and backend domain alignment, system boundaries, and architectural patterns.

---

## 2. Directory & Domain Alignment Structure

### Frontend Structure (`frontend/src/`)
```text
src/
├── app/          # Core App bootstrapping, providers, routes, navigation
├── assets/       # Static assets, branding images
├── components/   # Categorized UI, Shared, Layouts, Animations, Feedback
│   ├── ui/       # Atomistic UI (Button, Card, Input, Modal, Avatar, Badge, Spinner)
│   ├── shared/   # Domain-shared drawers, portals, search
│   ├── layouts/  # Page layouts (DashboardLayout, LandingLayout, AuthLayout)
│   ├── animations/# Motion primitives, GSAP wrappers, smooth scroll
│   └── feedback/ # Toast, EmptyState, ErrorBoundary
├── features/     # Self-contained domain modules
│   ├── auth/
│   ├── dashboard/
│   ├── owners/
│   ├── residents/
│   ├── rooms/
│   ├── beds/
│   ├── properties/
│   ├── complaints/
│   ├── billing/
│   ├── analytics/
│   ├── notifications/
│   ├── visitors/
│   ├── documents/
│   ├── operations/
│   └── search/
├── graphql/      # Queries, Mutations, Subscriptions, Fragments, Generated types
├── hooks/        # Reusable domain & utility hooks
├── services/     # Domain REST & GraphQL service layer
├── store/        # Zustand global UI state store
├── config/       # Environment, API, Apollo, Socket configuration
├── constants/    # Roles, permissions, status, routes constants
├── schemas/      # Zod validation schemas
├── guards/       # RouteGuard, RoleGuard, PermissionGuard
└── theme/        # Design system & ThemeProvider
```

### Backend Structure (`backend/src/`)
```text
src/
├── modules/      # Mirroring frontend domain modules
│   ├── auth/
│   ├── owners/
│   ├── residents/
│   ├── rooms/
│   ├── beds/
│   ├── properties/
│   ├── complaints/
│   ├── billing/
│   ├── analytics/
│   ├── notifications/
│   ├── visitors/
│   ├── documents/
│   ├── operations/
│   └── search/
├── controllers/  # Express REST controllers
├── services/     # Core domain business logic services
├── repositories/ # Prisma ORM repositories
├── graphql/      # Apollo Server schema & resolvers
└── socket/       # Socket.IO real-time event handlers
```

---

## 3. Communication Protocols

| Protocol | Usage | Domain Services |
| :--- | :--- | :--- |
| **REST APIs** | Auth, File Uploads, Payments, Downloads | `authService`, `documentService`, `billingService` |
| **GraphQL** | Dashboard analytics, Directory queries, Aggregations | `graphqlService`, `apolloClient` |
| **Socket.IO** | Real-time notifications, Bed availability, Complaints | `socketService` |

---

## 4. Path Aliases

- `@app` -> `src/app`
- `@components` -> `src/components`
- `@features` -> `src/features`
- `@hooks` -> `src/hooks`
- `@services` -> `src/services`
- `@graphql` -> `src/graphql`
- `@types` -> `src/types`
- `@config` -> `src/config`
- `@utils` -> `src/utils`
- `@constants` -> `src/constants`
- `@theme` -> `src/theme`
- `@store` -> `src/store`
- `@providers` -> `src/providers`
- `@schemas` -> `src/schemas`
- `@guards` -> `src/guards`
- `@assets` -> `src/assets`
