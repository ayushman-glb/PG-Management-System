# RoomBae PG Management System — Project File Structure

This document provides a comprehensive overview of the full folder and file structure of the **RoomBae PG Management System** repository.

---

## Workspace Root Overview

```text
PG-Management-System/
├── .agents/                        # GSD system configurations, skills, and model profiles
├── .claude/                        # Claude CLI workspace settings
├── .github/                        # GitHub Actions CI/CD workflows
├── .planning/                      # Project roadmap, specs, audits, and phase milestones
├── backend/                        # Node.js + Express + TypeScript + Prisma backend
├── docs/                           # Core environment, design system, and testing documentation
├── docs_consolidated/              # Consolidated architectural documentation chapters
├── frontend/                       # Vite 8 + React 19 + TypeScript + Tailwind CSS v4 frontend
├── k8s/                            # Kubernetes deployment manifests
├── Design/                         # Original UI/UX mockups and design assets
├── .env.example                    # Environment variable template for local development
├── .gitignore                      # Root Git ignore rule definitions
├── API_REFERENCE.md                # System API endpoint reference documentation
├── AUTH_ARCHITECTURE.md            # Authentication and JWT architecture overview
├── CLOUDINARY_SETUP.md             # Cloudinary configuration guide
├── DATABASE_ARCHITECTURE.md        # Database schema and MongoDB model specifications
├── FIREBASE_SETUP.md               # Firebase authentication setup guide
├── GOOGLE_AUTH.md                  # Google OAuth 2.0 integration guide
├── PERFORMANCE_REPORT.md           # Application benchmark and performance audit report
├── PROJECT_RECOVERY_REPORT.md      # Recovery and production readiness audit report
├── README.md                       # Main project repository documentation
├── SECURITY.md                     # Security policy and secret handling guidelines
├── SECURITY_AUDIT.md               # Vulnerability audit and remediation status
├── SIGNUP_FLOW.md                  # Resident & Owner signup sequence documentation
├── TEST_REPORT.md                  # Backend and frontend test coverage report
├── TODO.md                         # Active project task tracking list
├── UPLOAD_ARCHITECTURE.md          # File and document upload pipeline specifications
├── api_design.md                   # REST API architectural design document
├── backend_design.md               # Backend module and service architecture document
├── docker-compose.yml              # Multi-container Docker orchestration configuration
├── frontend_design.md              # Frontend UI/UX architecture document
├── nginx.conf                      # Production Nginx reverse proxy configuration
└── package.json                    # Monorepo root scripts and project metadata
```

---

## 1. Backend Architecture (`backend/`)

```text
backend/
├── prisma/                         # Prisma ORM configuration & database seeds
│   ├── schema.prisma               # MongoDB Prisma Schema definition (20+ models)
│   ├── seed.ts                     # Main database seeding script
│   ├── seedDemoData.ts             # Demo data generator for development
│   ├── seedFullSaaS.ts             # Full multi-tenant SaaS seeding script
│   └── seedSaaSData.ts             # Base SaaS dataset seeding script
├── src/                            # TypeScript source directory
│   ├── __tests__/                  # Unit test suites
│   │   └── auth.test.ts            # Authentication service unit tests
│   ├── api/                        # API route registration & swagger specs
│   ├── application/                # Application use cases & domain handlers
│   ├── config/                     # Backend configuration modules
│   │   ├── cloudinary.ts           # Cloudinary SDK client setup
│   │   ├── database.ts             # Prisma client connection setup
│   │   ├── env.ts                  # Zod environment variable validation
│   │   ├── prisma.ts               # Prisma client export
│   │   ├── redis.ts                # Redis client connection setup
│   │   └── swagger.ts              # Swagger UI OpenAPI setup
│   ├── container/                  # Dependency Injection container setup
│   ├── controllers/                # REST API controllers
│   ├── core/                       # Core application utilities and base middleware
│   │   └── middleware/             # Tenant isolation & core request middleware
│   ├── infrastructure/             # External service adapters & concrete implementations
│   │   ├── crypto/                 # Password hashing & TOTP 2FA implementations
│   │   ├── email/                  # Nodemailer & Brevo SMTP email transporters
│   │   ├── otp/                    # OTP generation & verification services
│   │   ├── redis/                  # Redis caching & stub fallback
│   │   └── tokens/                 # JWT token generation & validation services
│   ├── interfaces/                 # TypeScript contract interfaces
│   │   ├── infrastructure/         # External service interface contracts
│   │   ├── repositories/           # Repository layer interface contracts
│   │   └── services/               # Domain service interface contracts
│   ├── middleware/                 # Express HTTP middleware pipeline
│   │   ├── authMiddleware.ts       # JWT authentication & role authorization
│   │   ├── errorMiddleware.ts      # Global centralized error handler
│   │   ├── rateLimitMiddleware.ts  # Express rate limiting middleware
│   │   ├── securityPipeline.middleware.ts # Helmet, CORS, HPP, Sanitization
│   │   └── validateMiddleware.ts   # Express request validation middleware
│   ├── modules/                    # Domain feature modules
│   │   ├── analytics/              # Revenue & occupancy analytics module
│   │   ├── auth/                   # Authentication service & controller
│   │   ├── billing/                # Rent invoicing & Razorpay billing module
│   │   ├── complaints/             # Ticket & complaint management module
│   │   ├── documents/              # Agreement & KYC upload module
│   │   ├── notifications/          # Socket.IO & Push notification module
│   │   ├── owners/                 # Property Owner management module
│   │   ├── properties/             # PG, Room, and Bed management module
│   │   ├── residents/              # Resident directory & onboarding module
│   │   └── visitors/               # Visitor & Gate pass module
│   ├── repositories/               # Prisma database repository layer
│   │   └── ResidentManagementRepository.ts # Database repository queries
│   ├── routes/                     # Express Router endpoint mappings
│   ├── scripts/                    # Maintenance & data cleanup scripts
│   ├── services/                   # Business logic services
│   │   ├── authService.ts          # Core authentication logic
│   │   └── billingService.ts       # Billing and transaction logic
│   ├── shared/                     # Shared backend types & helpers
│   ├── socket/                     # Socket.IO real-time event handlers
│   ├── tests/                      # Integration & API test suites
│   │   ├── api.test.ts             # REST API endpoint integration tests
│   │   ├── auditFixSecurity.test.ts# Security & CORS isolation tests
│   │   ├── frontendUrl.test.ts     # Environment-aware URL resolution tests
│   │   └── residentManagement.test.ts # Resident flow integration tests
│   ├── types/                      # Custom TypeScript declaration files
│   ├── utils/                      # Helper utilities
│   │   ├── appError.ts             # Custom AppError operational exception class
│   │   ├── asyncLogger.ts          # Asynchronous logging utility
│   │   └── logger.ts               # Winston logger configuration
│   ├── app.ts                      # Express application instantiation & middleware setup
│   ├── cluster.ts                  # Multi-core Node.js cluster setup
│   └── server.ts                   # HTTP server entrypoint
├── .env.development                # Backend development environment settings
├── .env.example                    # Backend environment configuration template
├── .env.production                 # Backend production environment settings
├── .gitignore                      # Backend Git ignore rules
├── Dockerfile                      # Production Docker container build file
├── jest.config.js                  # Jest test runner configuration
├── package.json                    # Backend dependencies & npm scripts
├── tsconfig.build.json             # TypeScript production build config
└── tsconfig.json                   # TypeScript compiler settings
```

---

## 2. Frontend Architecture (`frontend/`)

```text
frontend/
├── public/                         # Static assets served directly by Vite
│   ├── favicon.ico                 # Site favicon
│   ├── logo.svg                    # RoomBae brand logo SVG
│   └── robots.txt                  # Search engine crawling instructions
├── src/                            # React TypeScript source files
│   ├── app/                        # App root shell & layout providers
│   ├── assets/                     # Component images, icons, and illustrations
│   ├── components/                 # Reusable UI component library
│   │   ├── animations/             # Motion, GSAP, and scroll animation components
│   │   ├── common/                 # Base buttons, inputs, and modals
│   │   ├── feedback/               # Skeletons, alerts, and toasts
│   │   ├── layouts/                # Dashboard & page container layouts
│   │   ├── shared/                 # Shared widgets & drawers
│   │   ├── ui/                     # Primitives and micro-UI widgets
│   │   ├── AdminVerificationQueue.tsx # Resident KYC verification list
│   │   ├── AuditLogDrawer.tsx      # System audit log drawer component
│   │   ├── DocumentUploadPortal.tsx# File upload portal widget
│   │   ├── GSAPAnimations.tsx      # GSAP timeline animation utilities
│   │   ├── GlobalSearchModal.tsx   # Command-K global search modal
│   │   ├── MagneticButton.tsx      # Animated hover button component
│   │   ├── NotificationCenterDrawer.tsx # Real-time notification drawer
│   │   ├── OTPInput.tsx            # 6-digit OTP input box component
│   │   ├── SignatureCanvas.tsx     # Digital agreement signature canvas
│   │   ├── Skeletons.tsx           # Skeleton loading state placeholders
│   │   └── UploadCard.tsx          # Drag-and-drop file uploader card
│   ├── config/                     # Frontend API base URL & runtime config
│   ├── constants/                  # Application constants & navigation links
│   ├── features/                   # Feature-sliced module directories
│   │   ├── analytics/              # Revenue & occupancy chart widgets
│   │   ├── auth/                   # Login, Signup, OTP, and 2FA forms
│   │   ├── beds/                   # Bed allocation & availability widgets
│   │   ├── billing/                # Payment history, rent invoice, & Razorpay modal
│   │   ├── complaints/             # Ticket filing & status tracking UI
│   │   ├── dashboard/              # Owner & Resident dashboard views
│   │   ├── documents/              # Agreement viewer & document upload UI
│   │   ├── notifications/          # Notification list & toast notifications
│   │   ├── operations/             # Maintenance & staff operational tasks
│   │   ├── owners/                 # Property Owner profile & PG management
│   │   ├── properties/             # PG property creation & listing cards
│   │   ├── residents/              # Resident directory, move-in, & profile view
│   │   ├── rooms/                  # Room layout & bed configuration modal
│   │   ├── search/                 # Filterable PG property search bar
│   │   └── visitors/               # Gate pass creation & visitor log list
│   ├── guards/                     # AuthGuard & RoleGuard route protection
│   ├── hooks/                      # Custom React hooks (useAuth, useFetch, etc.)
│   ├── pages/                      # Page view entrypoints
│   ├── providers/                  # React Context providers (Auth, Theme, Socket)
│   ├── schemas/                    # Zod validation schemas for forms
│   ├── services/                   # Axios API HTTP client & service calls
│   ├── store/                      # Zustand global state stores
│   ├── theme/                      # Tailwind CSS v4 color tokens & dark mode
│   ├── types/                      # Frontend TypeScript interface definitions
│   ├── App.tsx                     # Main React application component
│   ├── index.css                   # Tailwind v4 directives & custom CSS
│   ├── main.tsx                    # React DOM entrypoint
│   └── vite-env.d.ts               # Vite client environment types
├── .env.development                # Frontend development environment variables
├── .env.example                    # Frontend environment configuration template
├── .env.production                 # Frontend production environment variables
├── .gitignore                      # Frontend Git ignore rules
├── index.html                      # Single Page Application HTML template
├── package.json                    # Frontend dependencies & npm scripts
├── tsconfig.json                   # TypeScript compiler configuration
└── vite.config.ts                  # Vite build tool configuration
```

---

## 3. DevOps & Deployment Configurations (`docker/`, `k8s/`, `.github/`)

```text
.github/
└── workflows/
    ├── ci.yml                      # Automatic build & typecheck CI workflow
    └── deploy.yml                  # GitHub Pages frontend deployment workflow

k8s/
└── deployment.yaml                 # Kubernetes Deployment & Service specs

docker-compose.yml                  # Multi-container orchestration (Backend + MongoDB + Redis + Nginx)
nginx.conf                          # Nginx reverse-proxy & SSL termination configuration
```
