# 🏢 RoomBae — Enterprise Multi-Tenant PG & Coliving Management Platform

<div align="center">

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6%2F8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-6.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

**Production-grade, zero-trust multi-tenant SaaS ecosystem designed for modern Paying Guest (PG) hostels, coliving facilities, and property operators.**

[Live Application (Vercel)](https://pg-management-system.vercel.app) • [Interactive Web Preview (GitHub Pages)](https://ayushman-glb.github.io/PG-Management-System/) • [Production REST API](https://pg-management-system-boxb.onrender.com/api/v1) • [API Swagger Docs](https://pg-management-system-boxb.onrender.com/api/docs) • [Master Credentials](./USER_CREDENTIALS.md)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Public Discovery & Resident Acquisition](#1-public-discovery--resident-acquisition)
  - [Resident Portal & Tenancy Lifecycle](#2-resident-portal--tenancy-lifecycle)
  - [Automated Invoicing & Financial Operations](#3-automated-invoicing--financial-operations)
  - [Maintenance & Helpdesk Ticketing](#4-maintenance--helpdesk-ticketing)
  - [Owner & Inventory Operations Workspace](#5-owner--inventory-operations-workspace)
  - [Platform Administration & Moderation](#6-platform-administration--moderation)
  - [Real-Time WebSockets & Background Automation](#7-real-time-websockets--background-automation)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Zero-Trust Security & Request Pipeline](#zero-trust-security--request-pipeline)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seed Data](#database-setup--seed-data)
  - [Running the Application](#running-the-application)
- [Authoritative Demo Credentials](#-authoritative-demo-credentials)
- [Available Scripts](#-available-scripts)
  - [Root Workspace](#root-workspace)
  - [Backend Services (`/backend`)](#backend-services-backend)
  - [Frontend Application (`/frontend`)](#frontend-application-frontend)
- [Environment Variables Reference](#-environment-variables-reference)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
- [API Catalog & Endpoint Matrix](#-api-catalog--endpoint-matrix)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Containerization & Deployment](#-containerization--deployment)
  - [Docker & Docker Compose](#docker--docker-compose)
  - [Kubernetes Manifests](#kubernetes-manifests)
  - [Cloud Platforms (Vercel & Render)](#cloud-platforms-vercel--render)
- [Documentation Index](#-documentation-index)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**RoomBae** is an end-to-end PG and coliving management platform engineered to automate property discovery, tenant onboarding, biometric/visitor access, recurring rent collections, room allocation, maintenance ticketing, and multi-property financial analytics.

The platform provides a unified dual-experience interface:

1. **Public Discovery Portal**: Enables prospective residents to explore verified PG properties, browse room photos, filter by rent and sharing occupancy, review amenities, schedule visits (physical/virtual), and complete online registration with KYC ID verification.
2. **Enterprise Multi-Tenant Workspace**: Role-governed dashboards for PG owners, property managers, residents, and master platform administrators ("GOD" view) to manage operations, bed allocations, financial ledgers, digital tenancy agreements, and live communications.

---

## ⚡ Key Features

### 1. Public Discovery & Resident Acquisition
- **Location-Based Search**: Real-time property search powered by Geoapify geocoding, locality matching, and city filters.
- **Dynamic Filtering**: Filter by gender accommodation (`BOYS`, `GIRLS`, `CO_LIVING`), room sharing type (`SINGLE`, `DOUBLE`, `TRIPLE`, `FOUR_SHARING`), budget range, and amenity tags.
- **Shortlisting & Tour Scheduling**: Save favorite properties and schedule physical or virtual property walkthroughs with calendar slot management.
- **Digital Resident Registration**: Multi-step online application flow capturing applicant profile, emergency contacts, occupation, and identification documents.

### 2. Resident Portal & Tenancy Lifecycle
- **Tenant Self-Service Dashboard**: Real-time overview of current room assignment, active booking status, upcoming dues, and notifications.
- **Digital Tenancy Agreements**: In-browser agreement review with e-signatures (drawn, typed, or uploaded) generating downloadable PDF contracts.
- **KYC & Document Center**: Secure upload pipeline for Aadhaar, PAN card, college/corporate ID, and police verification documents with review status tracking.
- **Visitor & Gate Passes**: Digital visitor pass requests and overnight exit pass generation with QR code check-ins.

### 3. Automated Invoicing & Financial Operations
- **Rent Scheduler & Invoicing Engine**: Automated monthly invoice generation with itemized rent, utility charges, meal plans, and 18% GST calculation.
- **Late Fine Automation**: Configurable grace periods and automated late fee assessments.
- **Integrated Payments**: Online checkout via Razorpay alongside offline manual UPI/bank transfer verification workflows.
- **Refund & Security Deposit Tracking**: Complete settlement workflow for security deposits and move-out refunds.

### 4. Maintenance & Helpdesk Ticketing
- **Categorized Issue Tracking**: Tickets classified by category (`MAINTENANCE`, `CLEANLINESS`, `FOOD`, `WIFI`, `SECURITY`, `BILLING`) and priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **Real-Time Ticket Threads**: Interactive conversation logs between residents and property maintenance teams for each ticket.
- **State Machine Workflow**: Managed ticket lifecycle from `OPEN` → `ACKNOWLEDGED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`.

### 5. Owner & Inventory Operations Workspace
- **Hierarchical Inventory Matrix**: Visual room and bed allocation grid mapping across Properties → Floors → Rooms → Beds (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`).
- **10-Step PG Onboarding**: Comprehensive wizard for property creation, floor plans, room pricing, meal schedules, house rules, and KYC approval requests.
- **P&L Financial Analytics**: Revenue breakdowns, collection trends, occupancy rates, and operational expense logs (electricity, groceries, staff salaries, internet, maintenance).
- **Subscription Management**: Integrated SaaS billing tiers (`BASIC`, `PROFESSIONAL`, `ENTERPRISE`) with property limits and automated renewal tracking.

### 6. Platform Administration & Moderation
- **Master Admin Console ("GOD" View)**: Global oversight of all registered users, owner KYC approvals, property verification, and system metrics.
- **Audit Logging**: Comprehensive trace logs recording user actions, role changes, and financial modifications with IP and device correlation IDs.

### 7. Real-Time WebSockets & Background Automation
- **Socket.IO Real-Time Pipeline**: Instant delivery of direct chat messages, ticket updates, payment notifications, and system announcements.
- **Scheduled Cron Workers**: Daily Node-Cron jobs handling automated rent invoice generation, payment due reminders, overdue fine calculations, and session cleanups.

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Component-based UI library with Concurrent Mode and React DOM 19 |
| **Build & Tooling** | [Vite 6 / 8](https://vitejs.dev/) | Sub-millisecond HMR, native ES module bundler, and Rollup production builds |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) | End-to-end type safety across both frontend client and backend services |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) | CSS-first `@theme` design tokens with Light Warm and Dark Gold palettes |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Lightweight, reactive client-side global store |
| **Animations & Visuals** | [Framer Motion 12](https://www.framer.com/motion/) / [GSAP 3](https://greensock.com/gsap/) / [Three.js](https://threejs.org/) | Micro-interactions, route view transitions, canvas effects, and Lenis smooth scrolling |
| **Charts & Icons** | [Recharts](https://recharts.org/) / [Lucide React](https://lucide.react.dev/) | Interactive dashboard analytics charts and modern UI iconography |
| **Backend Runtime** | [Node.js 20 LTS](https://nodejs.org/) | Multi-core Cluster mode architecture with graceful shutdown handlers |
| **API Framework** | [Express 4.21](https://expressjs.com/) | RESTful API router with modular domain controllers and middlewares |
| **Database & ORM** | [MongoDB 7.0](https://www.mongodb.com/) + [Prisma ORM 6](https://www.prisma.io/) | Schema-driven document persistence with MongoDB replica set transactions |
| **Real-Time Engine** | [Socket.IO 4.8](https://socket.io/) | Full-duplex WebSocket communication for live messaging and notifications |
| **Security & Auth** | JWT, Argon2id, bcrypt, Helmet 8, CSRF | Zero-Trust authentication, dual-token rotation, AES-256-GCM encryption, rate limiting |
| **OAuth 2.0 & Identity** | [Passport.js](https://www.passportjs.org/) / Google OAuth | Google Sign-In with device fingerprinting and multi-factor OTP verification |
| **Media & PDF Pipeline** | [Cloudinary](https://cloudinary.com/) / [Sharp](https://sharp.pixelplumbing.com/) / [Puppeteer](https://pptr.dev/) | Multi-stage image compression, MIME/magic-byte validation, and PDF agreement generation |
| **Communication & Payments** | [Nodemailer](https://nodemailer.com/) / [Twilio](https://www.twilio.com/) / [Razorpay](https://razorpay.com/) | Transactional SMTP email relay, SMS OTP dispatch, and payment gateway webhooks |
| **Testing Frameworks** | [Jest 30](https://jestjs.io/) / [Vitest 4](https://vitest.dev/) / [Playwright](https://playwright.dev/) | Unit tests, Supertest API integration tests, and browser E2E test suites |
| **DevOps & Containers** | [Docker](https://www.docker.com/) / [Nginx](https://nginx.org/) / [Kubernetes](https://kubernetes.io/) | Multi-stage Docker builds, Nginx SPA reverse proxy, and Kubernetes HPA deployment manifests |

---

## 🏛️ System Architecture

### High-Level Architecture

```mermaid
flowchart TD
    subgraph Clients [Client Tier]
        Browser[Web Browser / Mobile Client]
        Vercel[Vercel / GitHub Pages SPA]
        Browser -->|HTTPS / WSS| Vercel
    end

    subgraph Gateway [API Gateway & Ingress Tier]
        Nginx[Nginx Reverse Proxy / Load Balancer]
        Vercel -->|REST API Requests| Nginx
        Browser -->|WebSocket Connection| Nginx
    end

    subgraph BackendCluster [Node.js Cluster Tier]
        Server[Express 4.21 REST Server]
        SocketServer[Socket.IO Real-Time Gateway]
        Cron[Node-Cron Automation Workers]
        
        Nginx -->|/api/v1/*| Server
        Nginx -->|/socket.io/*| SocketServer
    end

    subgraph MiddlewarePipeline [Zero-Trust Security Pipeline]
        CORS[CORS / HSTS / Helmet]
        RateLimit[Rate Limiter & Brute-Force Shield]
        Auth[JWT / Session / RBAC Middleware]
        Idempotency[Idempotency & CSRF Guard]
        Sanitize[NoSQL Sanitizer & HPP Defenses]
        
        Server --> CORS --> RateLimit --> Auth --> Idempotency --> Sanitize
    end

    subgraph DataTier [Persistence & Cache Tier]
        Prisma[Prisma ORM 6 Client]
        MongoDB[(MongoDB 7.0 Atlas / Replica Set)]
        Cache[(Redis / In-Memory Cache)]
        
        Sanitize --> Prisma
        Prisma --> MongoDB
        Server <--> Cache
    end

    subgraph ExternalServices [Third-Party Integrations]
        Cloudinary[Cloudinary Media CDN]
        Razorpay[Razorpay Payment Gateway]
        SMTP[Google Gmail SMTP Relay]
        Twilio[Twilio SMS Gateway]
        Geoapify[Geoapify Location Intelligence]
        
        Server <--> Cloudinary
        Server <--> Razorpay
        Server <--> SMTP
        Server <--> Twilio
        Server <--> Geoapify
    end
```

### Zero-Trust Security & Request Pipeline

1. **Network Ingress**: Enforces strict CORS origin matching, HSTS preload headers, and Helmet Content Security Policies.
2. **Correlation & Tracing**: Every inbound request receives an `X-Correlation-ID` header for end-to-end distributed log tracing via Winston.
3. **Defense-in-Depth**: Express Mongo Sanitize strips operator injection attacks; HPP prevents HTTP parameter pollution; double-submit tokens defend against CSRF.
4. **Authentication & RBAC**: Stateless JWT access tokens (`15m` TTL) paired with SHA-256 hashed refresh tokens (`7d` TTL) bound to client device fingerprints. Role-based access control enforces `RESIDENT`, `PG_OWNER`, and `ADMIN` boundaries.
5. **Data Protection**: Sensitive financial information (bank accounts, UPI IDs, Aadhaar/PAN) is stored encrypted using authenticated **AES-256-GCM** with unique initialization vectors. Passwords use **Argon2id** and **bcrypt** (10 rounds).

---

## 📂 Repository Structure

```text
PG-Management-System/
├── package.json                      # Master workspace scripts (delegates to frontend/backend)
├── .env.example                      # Root environment variables reference template
├── docker-compose.dev.yml            # Docker Compose setup for local containerized development
├── USER_CREDENTIALS.md               # Authoritative test accounts and demo credentials
├── README.md                         # Master project documentation
│
├── backend/                          # 🚀 Express + TypeScript + Prisma Backend Service
│   ├── package.json                  # Backend dependencies and execution scripts
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   ├── Dockerfile                    # Multi-stage production container definition
│   ├── Dockerfile.dev                # Development container configuration
│   ├── jest.config.js                # Jest test runner configuration
│   ├── .env.example                  # Backend environment variables template
│   ├── prisma/                       # Database models & seeding scripts
│   │   ├── schema.prisma             # Master MongoDB Prisma schema (enums & models)
│   │   ├── seed.ts                   # Core database seed script
│   │   └── seedDemoData.ts           # Comprehensive 12-month demo database seeder
│   ├── scripts/                      # Operational utilities & QA test runners
│   │   ├── cleanup-ports.js          # Port cleanup helper for development
│   │   ├── verify-seeded-logins.ts   # Automated credential validation script
│   │   └── qa-master-runner.ts       # Master QA verification test suite
│   └── src/                          # Backend source code
│       ├── server.ts                 # HTTP server bootstrap & cluster manager
│       ├── app.ts                    # Express application configuration & middleware pipeline
│       ├── cluster.ts                # Multi-core Node.js cluster process fork manager
│       ├── config/                   # Database, environment, and CORS configurations
│       ├── middleware/               # Auth, RBAC, error, rate-limit, and CSRF middlewares
│       ├── modules/                  # Domain-driven modular route controllers & services
│       │   ├── admin/                # Platform admin moderation & KYC review
│       │   ├── agreements/           # Tenancy contracts & digital signature engine
│       │   ├── analytics/            # Financial & occupancy analytics
│       │   ├── auth/                 # Authentication, OTP, 2FA, and OAuth handlers
│       │   ├── beds/                 # Bed inventory & status allocation
│       │   ├── billing/              # Invoice generator, late fine engine, rent schedules
│       │   ├── bookings/             # Booking lifecycle state machine
│       │   ├── complaints/           # Issue ticketing & resolution threads
│       │   ├── dashboard/            # Aggregated metrics for owner/resident dashboards
│       │   ├── documents/            # Document verification & KYC pipeline
│       │   ├── messages/             # Direct resident-owner chat threads
│       │   ├── moveIn/               # Move-in inspection checklists & key handover
│       │   ├── notifications/        # In-app, SMS, and email dispatchers
│       │   ├── owners/               # Owner profile & property setup wizards
│       │   ├── payments/             # Razorpay integration & manual transaction verification
│       │   ├── properties/           # Property listings, rooms, and floor plans
│       │   ├── residents/            # Resident directory & allocation records
│       │   ├── rooms/                # Room pricing & categorization
│       │   ├── search/               # Property discovery & geocoding search
│       │   ├── settings/             # System and user preferences
│       │   ├── shortlist/            # Resident bookmarks & wishlist
│       │   ├── subscriptions/        # Owner SaaS tier subscriptions
│       │   └── tours/                # Property visit scheduling
│       ├── routes/                   # API v1 catalog & upload route registrations
│       ├── socket/                   # Socket.IO WebSocket gateway & event dispatchers
│       ├── jobs/                     # Scheduled Node-Cron background workers
│       └── utils/                    # Encryption, logger (Winston), and formatters
│
├── frontend/                         # 💻 React 19 + TypeScript + Vite Frontend Application
│   ├── package.json                  # Frontend dependencies and execution scripts
│   ├── vite.config.ts                # Vite 6/8 build configuration & alias mappings
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   ├── index.html                    # Single Page Application HTML entry point
│   ├── nginx.conf                    # Nginx configuration for containerized SPA routing
│   ├── vercel.json                   # Vercel deployment rewrites
│   ├── playwright.config.ts          # Playwright E2E test configuration
│   ├── vitest.config.ts              # Vitest unit test configuration
│   ├── .env.example                  # Frontend public environment variables template
│   ├── public/                       # Static public assets (logos, favicon, loading icons)
│   └── src/                          # Frontend source code
│       ├── main.tsx                  # React DOM root mounting entry point
│       ├── index.css                 # Tailwind CSS v4 design tokens and theme rules
│       ├── app/                      # Application shell, dynamic routes, and navigation
│       ├── config/                   # Client environment variables & API endpoint resolution
│       ├── providers/                # Auth, Theme, Navigation, and WebSocket Context Providers
│       ├── guards/                   # Role-based (`RoleGuard`) & authenticated route guards
│       ├── store/                    # Zustand global stores (auth, properties, UI state)
│       ├── services/                 # Axios/Fetch HTTP service abstractions
│       ├── components/               # Reusable UI component library (cards, modals, layouts)
│       ├── features/                 # Modular feature screens and pages
│       └── types/                    # Shared TypeScript interfaces & entity definitions
│
├── docker/                           # Standalone Docker & Nginx assets
├── k8s/                              # Kubernetes production deployment & HPA manifests
│   └── deployment.yaml               # Kubernetes Deployment, Service, and Autoscaler configs
├── docs/                             # Project documentation & QA test reports
│   ├── USER_CREDENTIALS.md           # Mirror copy of authoritative test accounts
│   ├── deployment/                   # Platform deployment guides (Vercel, Render)
│   └── testing/                      # QA test runs and full system validation reports
├── docs_consolidated/                # In-depth architectural chapters & design specifications
└── scripts/                          # Repository contract auditors and route extractors
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following runtimes are installed on your workstation:

- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher
- **MongoDB**: MongoDB 7.0+ (Local replica set or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- **Git**: Latest version

Verify your environment:
```bash
node -v
npm -v
```

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ayushman-glb/PG-Management-System.git
   cd PG-Management-System
   ```

2. **Install All Dependencies**:
   Install root, backend, and frontend packages:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install && cd ..

   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

---

### Environment Configuration

Create the local configuration files for both services from the provided templates:

1. **Backend Environment Setup**:
   ```bash
   cp backend/.env.example backend/.env.development
   ```
   *Edit `backend/.env.development` and ensure `DATABASE_URL` points to a valid MongoDB connection string.*

2. **Frontend Environment Setup**:
   ```bash
   cp frontend/.env.example frontend/.env.development
   ```
   *For local development, `VITE_API_BASE_URL` defaults to `http://localhost:5000/api/v1` and `VITE_SOCKET_URL` to `http://localhost:5000`.*

---

### Database Setup & Seed Data

1. **Generate Prisma Client**:
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. **Push Schema to MongoDB**:
   ```bash
   npm run prisma:push
   ```

3. **Seed Master Multi-Tenant Demo Data**:
   Populate the database with realistic properties, rooms, beds, residents, agreements, invoices, and payment histories:
   ```bash
   npm run db:seed:demo
   ```

4. **Verify Seeded Credentials**:
   Run the automated login verification check:
   ```bash
   npm run verify:seeded-logins
   cd ..
   ```

---

### Running the Application

You can launch the backend and frontend services from the root directory or within their respective folders:

#### Option A: Running from Root (Recommended)
```bash
# Terminal 1 — Start Backend Server (port 5000)
npm run dev:backend

# Terminal 2 — Start Frontend Client (port 5173)
npm run dev:frontend
```

#### Option B: Running Individually

**Backend**:
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
# REST API: http://localhost:5000/api/v1
# Swagger UI: http://localhost:5000/api/docs
```

**Frontend**:
```bash
cd frontend
npm run dev
# Frontend web interface available at http://localhost:5173
```

---

## 🔑 Authoritative Demo Credentials

The database seeder (`npm run db:seed:demo`) creates authoritative, fully dynamic user accounts with persistent data models. Full details are documented in [USER_CREDENTIALS.md](./USER_CREDENTIALS.md).

| Role | Name | Username / Email | Password | Primary Route | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMIN ("GOD")** | Platform Master | `admin@roombae.com`<br>`god@3456` | `GOD@34$%65` | `/admin` | Complete platform oversight, KYC review, property moderation, global audit logs. |
| **PG_OWNER** | Ayushman Saha | `33200122040@tib.edu.in`<br>`ayush321` | `Ayush@#123` | `/dashboard` | Manages 3 Bengaluru properties (Aurora Residency, Serenity Coliving, Zenith Heights). |
| **RESIDENT** | Ankur Saha | `ankursaha985@gmail.com`<br>`ankur547` | `Ankur@#123` | `/resident-portal` | Active tenant in Room 101 (Bed 101-A) with confirmed booking, lease, and invoices. |

> [!TIP]
> **Universal Test OTP Fallback**: When testing OTP verification, two-factor authentication, or password resets in non-production environments without active SMS/SMTP services, use the universal test code: `654123`.

---

## 📜 Available Scripts

### Root Workspace

| Command | Description |
| :--- | :--- |
| `npm run dev:backend` | Starts the backend development server on port `5000` |
| `npm run dev:frontend` | Starts the frontend Vite development server on port `5173` |
| `npm run build:backend` | Generates Prisma client and compiles the backend TypeScript bundle |
| `npm run build:frontend` | Type-checks and compiles the frontend production bundle via Vite |
| `npm run db:seed:demo` | Seeds MongoDB with complete multi-tenant demo properties and users |
| `npm run preview` | Previews the compiled frontend production build locally |

---

### Backend Services (`/backend`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Express API server with Hot Reloading (`ts-node-dev`) |
| `npm run build` | Generates Prisma client and executes `tsc -p tsconfig.build.json` |
| `npm start` | Launches the compiled production server (`dist/src/server.js`) |
| `npm run typecheck` | Validates TypeScript types across all backend modules without emitting files |
| `npm run clean:ports` | Automatically terminates stale processes occupying port `5000` |
| `npm run prisma:generate` | Generates the `@prisma/client` JavaScript SDK |
| `npm run prisma:push` | Synchronizes the `schema.prisma` definitions with MongoDB collections |
| `npm run prisma:seed:demo` | Executes `seedDemoData.ts` to populate the complete demo portfolio |
| `npm run verify:seeded-logins` | Executes end-to-end authentication tests against all seeded test credentials |
| `npm test` | Runs the Jest test suite |
| `npm run test:unit` | Executes backend unit tests |
| `npm run test:integration` | Executes Supertest REST API integration test suite |
| `npm run test:regression` | Executes backend regression test suite |
| `npm run test:qa` | Executes the comprehensive QA Master Runner suite |

---

### Frontend Application (`/frontend`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server binding to `0.0.0.0` |
| `npm run build` | Compiles TypeScript (`tsc -b`) and generates the production bundle in `dist/` |
| `npm run lint` | Validates TypeScript types and build invariants |
| `npm run preview` | Spins up a local web server serving the production `dist/` bundle |
| `npm run format` | Runs the `oxfmt` high-performance code formatter |
| `npm test` | Executes the Vitest unit and component test suite |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests |

---

## 🔐 Environment Variables Reference

### Backend Environment Variables

Configure these in `backend/.env.development` or `backend/.env.production`:

| Variable | Required | Default | Description | Example |
| :--- | :---: | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP port on which the Express server listens | `5000` |
| `NODE_ENV` | **Yes** | `development` | Active runtime environment (`development`, `production`, `test`) | `development` |
| `CLIENT_URL` | **Yes** | `http://localhost:5173` | Public URL of the frontend for CORS and redirects | `https://pg-management-system.vercel.app` |
| `FRONTEND_URL` | **Yes** | `http://localhost:5173` | Primary frontend origin | `https://pg-management-system.vercel.app` |
| `CORS_ORIGINS` | Optional | — | Comma-separated list of allowed CORS origins | `https://pg-management-system.vercel.app,https://ayushman-glb.github.io` |
| `API_BASE_URL` | Optional | `http://localhost:5000` | Base public URL of the backend API service | `https://pg-management-system-boxb.onrender.com` |
| `API_PREFIX` | Optional | `/api/v1` | Versioned REST API path prefix | `/api/v1` |
| `DATABASE_URL` | **Yes** | — | MongoDB Atlas / replica set connection URL | `mongodb+srv://user:pass@cluster.mongodb.net/roombae?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | — | Secret key used to sign 15-minute JWT access tokens (min 16 chars) | `your_jwt_access_secret_min32chars` |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret key used for 7-day refresh token rotation (min 16 chars) | `your_jwt_refresh_secret_min32chars` |
| `SESSION_SECRET` | **Yes** | — | Secret used for cookie and session signing | `your_session_secret_min32chars` |
| `COOKIE_SECRET` | **Yes** | — | Secret used for parsing encrypted cookies | `your_cookie_secret_min32chars` |
| `CSRF_SECRET` | **Yes** | — | Secret used for CSRF token generation | `your_csrf_secret_min32chars` |
| `AES_256_KEY` | **Yes** | — | 64-character hex key for AES-256-GCM data encryption | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `ENCRYPTION_KEY` | **Yes** | — | 64-character hex key for general sensitive data | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `KYC_ENCRYPTION_KEY` | **Yes** | — | 64-character hex key for Aadhaar/PAN encryption | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `GEOAPIFY_API_KEY` | Optional | — | Geoapify key for places and autocomplete search | `your_geoapify_api_key` |
| `GOOGLE_CLIENT_ID` | Optional | — | Google OAuth 2.0 Client ID for Google Sign-In | `your_google_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | — | Google OAuth 2.0 Client Secret | `your_google_client_secret` |
| `GOOGLE_CALLBACK_URL` | Optional | `/api/v1/auth/google/callback` | OAuth redirect callback endpoint | `http://localhost:5000/api/v1/auth/google/callback` |
| `RAZORPAY_KEY_ID` | Optional | — | Razorpay payment gateway API Key ID | `rzp_test_your_key_id` |
| `RAZORPAY_KEY_SECRET` | Optional | — | Razorpay payment gateway Secret | `your_razorpay_secret` |
| `MAIL_HOST` | Optional | `smtp.gmail.com` | SMTP email server hostname | `smtp.gmail.com` |
| `MAIL_PORT` | Optional | `587` | SMTP email server port | `587` |
| `MAIL_USER` | Optional | — | SMTP username / sender email | `your_email@gmail.com` |
| `MAIL_APP_PASSWORD` | Optional | — | SMTP application-specific password | `your_16_digit_app_password` |
| `CLOUDINARY_CLOUD_NAME` | Optional | — | Cloudinary cloud identifier | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Optional | — | Cloudinary API Key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Optional | — | Cloudinary API Secret | `your_cloudinary_api_secret` |
| `TWILIO_ACCOUNT_SID` | Optional | — | Twilio account SID for SMS OTP dispatch | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Optional | — | Twilio authentication token | `your_twilio_auth_token` |
| `TWILIO_PHONE_NUMBER` | Optional | — | Twilio registered phone number | `+1234567890` |

---

### Frontend Environment Variables

Configure these in `frontend/.env.development` or `frontend/.env.production` (prefixed with `VITE_`):

| Variable | Required | Default | Description | Example |
| :--- | :---: | :--- | :--- | :--- |
| `VITE_APP_NAME` | Optional | `RoomBae` | Application brand display name | `RoomBae` |
| `VITE_APP_ENV` | Optional | `development` | Client runtime environment | `production` |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:5000/api/v1` | Public REST API base URL | `https://pg-management-system-boxb.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | **Yes** | `http://localhost:5000` | Socket.IO WebSocket server host | `https://pg-management-system-boxb.onrender.com` |
| `VITE_FRONTEND_URL` | Optional | `http://localhost:5173` | Canonical URL of the frontend deployment | `https://pg-management-system.vercel.app` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | — | Google OAuth Client ID for web sign-in | `your_google_client_id.apps.googleusercontent.com` |
| `VITE_RAZORPAY_KEY_ID` | Optional | — | Public Razorpay Key ID for client checkout | `rzp_test_your_key_id` |
| `VITE_ENABLE_ANALYTICS` | Optional | `true` | Feature flag to enable analytics charts | `true` |
| `VITE_ENABLE_DARK_MODE` | Optional | `true` | Feature flag for Luxury Gold dark mode | `true` |
| `VITE_ENABLE_CHAT` | Optional | `true` | Feature flag for real-time chat widgets | `true` |

---

## 📡 API Catalog & Endpoint Matrix

All REST routes are mounted under the `/api/v1` prefix. Interactive API documentation is available via Swagger UI at `/api/docs`.

### Core Endpoint Groups

| Module | Base Path | Key Methods | Description | Auth Required |
| :--- | :--- | :--- | :--- | :---: |
| **Authentication** | `/api/v1/auth` | `POST /register`, `POST /login`, `POST /refresh-token`, `POST /logout`, `POST /send-otp`, `POST /verify-otp`, `GET /me` | User registration, login, token rotation, 2FA, and profile status | No / Yes |
| **Dashboard** | `/api/v1/dashboard` | `GET /stats`, `GET /overview`, `GET /revenue-chart` | Aggregated metrics for owner, resident, and admin views | Yes |
| **Properties** | `/api/v1/properties` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /:id/amenities` | Property inventory, rules, media, and room listings | Public / Yes |
| **Rooms & Beds** | `/api/v1/rooms`, `/api/v1/beds` | `GET /`, `POST /`, `PUT /:id`, `PATCH /:id/status` | Room capacity, sharing configurations, and bed allocations | Yes |
| **Discovery Search** | `/api/v1/search` | `GET /`, `GET /suggestions`, `GET /nearby` | Geolocation property search, budget filtering, and tags | Public |
| **Shortlist & Tours** | `/api/v1/shortlist`, `/api/v1/tours` | `GET /`, `POST /`, `DELETE /:id`, `POST /book` | Bookmarking properties and scheduling physical/virtual visits | Yes |
| **Applications** | `/api/v1/applications` | `GET /`, `POST /`, `PATCH /:id/status` | Prospective resident booking applications workflow | Yes |
| **Bookings** | `/api/v1/bookings` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id/status`, `POST /:id/cancel` | Tenancy booking state machine and advance payments | Yes |
| **Billing & Invoices** | `/api/v1/billing` | `GET /invoices`, `POST /invoices/generate`, `GET /invoices/:id/pdf`, `GET /fines` | Automated invoice generation, GST tax breakdown, and late fees | Yes |
| **Payments** | `/api/v1/payments` | `POST /razorpay/create-order`, `POST /razorpay/verify`, `POST /manual-verify` | Razorpay payment orders, webhook handling, and manual receipts | Yes |
| **Agreements** | `/api/v1/agreements` | `GET /`, `POST /generate`, `POST /:id/sign`, `GET /:id/download` | Tenancy agreement generation, digital signatures, and PDF download | Yes |
| **Documents & KYC** | `/api/v1/documents` | `GET /`, `POST /upload`, `PATCH /:id/verify`, `DELETE /:id` | Upload and administrative review of Aadhaar/PAN/ID proofs | Yes |
| **Complaints** | `/api/v1/complaints` | `GET /`, `POST /`, `PATCH /:id/status`, `POST /:id/messages` | Issue tickets, priority assignment, and threaded discussion | Yes |
| **Direct Messaging** | `/api/v1/messages` | `GET /threads`, `POST /send`, `GET /threads/:id` | Live resident-to-owner messaging channels | Yes |
| **Move-In Workflow** | `/api/v1/move-in` | `GET /checklist`, `POST /submit-inspection`, `POST /handover-keys` | Move-in inspection verification and key handover | Yes |
| **Subscriptions** | `/api/v1/subscriptions`| `GET /plans`, `POST /subscribe`, `GET /my-subscription` | Owner SaaS tier management and billing cycles | Yes |
| **Notifications** | `/api/v1/notifications`| `GET /`, `PATCH /:id/read`, `PUT /preferences` | In-app notification center and delivery preferences | Yes |
| **Analytics** | `/api/v1/analytics` | `GET /revenue`, `GET /occupancy`, `GET /expenses` | Financial P&L reports, expense records, and occupancy trends | Yes (`PG_OWNER` / `ADMIN`) |
| **Admin Console** | `/api/v1/admin` | `GET /users`, `PATCH /users/:id/status`, `GET /audit-logs`, `GET /kyc-pending` | Platform-wide user moderation, KYC approvals, and system audit logs | Yes (`ADMIN`) |
| **Media Uploads** | `/api/v1/uploads` | `POST /image`, `POST /document` | Multer + Sharp + Cloudinary image and document pipeline | Yes |
| **Health Checks** | `/health`, `/ready`, `/live` | `GET /health`, `GET /ready`, `GET /live` | Liveness, readiness, and MongoDB latency diagnostic probes | Public |

---

## 🧪 Testing & Quality Assurance

RoomBae maintains multi-layered test coverage across unit, integration, and browser end-to-end suites:

### Running Backend Tests (Jest)
```bash
cd backend

# Run complete Jest test suite
npm test

# Run unit tests only
npm run test:unit

# Run REST API integration tests (Supertest + MongoDB Memory Server)
npm run test:integration

# Run regression suite
npm run test:regression

# Run Master QA Verification Runner
npm run test:qa
```

### Running Frontend Tests (Vitest & Playwright)
```bash
cd frontend

# Run Vitest unit & component tests
npm test

# Run Playwright end-to-end browser tests
npm run test:e2e
```

---

## 🚢 Containerization & Deployment

### Docker & Docker Compose

Run the entire application stack locally using Docker:

```bash
# Start backend in development container
docker compose -f docker-compose.dev.yml up --build

# Build production backend image
cd backend
docker build -t roombae-backend:latest .

# Build production frontend Nginx image
cd ../frontend
docker build -t roombae-frontend:latest .
```

---

### Kubernetes Manifests

Production Kubernetes Deployment, Service, and Horizontal Pod Autoscaler (HPA) definitions are located in [`k8s/deployment.yaml`](./k8s/deployment.yaml):

```bash
# Apply Kubernetes deployment to roombae-production namespace
kubectl apply -f k8s/deployment.yaml
```

The configuration includes:
- **Replica Scaling**: 3 minimum replicas with auto-scaling up to 20 pods based on CPU (70%) and Memory (80%) utilization.
- **Health Probes**: Configured `/live` and `/ready` probes for automated zero-downtime rolling updates.
- **Resource Constraints**: Requests (250m CPU, 512Mi Memory) and limits (1000m CPU, 2Gi Memory).

---

### Cloud Platforms (Vercel & Render)

1. **Frontend (Vercel)**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Configured via [`frontend/vercel.json`](./frontend/vercel.json) with SPA fallback rewrites. Full guide: [VERCEL_FRONTEND_DEPLOYMENT.md](./docs/deployment/VERCEL_FRONTEND_DEPLOYMENT.md).

2. **Backend (Render)**:
   - Environment: **Node**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/health`

---

## 📚 Documentation Index

| Document | Pathway | Description |
| :--- | :--- | :--- |
| **Demo User Credentials** | [USER_CREDENTIALS.md](./USER_CREDENTIALS.md) | Authoritative test logins, seed profiles, and database inventory |
| **System & Database Architecture** | [01_System_and_Database_Architecture.md](./docs_consolidated/backend/Chapter_01_Architecture_and_Design/01_System_and_Database_Architecture.md) | Deep dive into Prisma schemas, relationships, and data isolation |
| **API Design & Route Catalog** | [02_API_Design_and_Routes.md](./docs_consolidated/backend/Chapter_01_Architecture_and_Design/02_API_Design_and_Routes.md) | REST contract specifications, error codes, and request payloads |
| **Authentication & Security** | [03_Authentication_and_Security.md](./docs_consolidated/backend/Chapter_01_Architecture_and_Design/03_Authentication_and_Security.md) | Zero-Trust security rules, AES-256 encryption, and session rotation |
| **External Integrations Guide** | [01_External_Services_and_Setup.md](./docs_consolidated/backend/Chapter_02_Integrations_and_Environment/01_External_Services_and_Setup.md) | Configuration steps for Razorpay, Cloudinary, Twilio, and Gmail |
| **Frontend Architecture & SRS** | [01_Frontend_Architecture_and_SRS.md](./docs_consolidated/frontend/Chapter_01_Architecture_and_Design/01_Frontend_Architecture_and_SRS.md) | IEEE 830 functional & non-functional requirements specification |
| **Design System & UI Tokens** | [02_Design_System_and_Tokens.md](./docs_consolidated/frontend/Chapter_01_Architecture_and_Design/02_Design_System_and_Tokens.md) | Color palettes, typography, spacing, and micro-interaction tokens |
| **Vercel Deployment Guide** | [VERCEL_FRONTEND_DEPLOYMENT.md](./docs/deployment/VERCEL_FRONTEND_DEPLOYMENT.md) | Production frontend deployment procedure and CORS configuration |
| **QA Test Verification Report** | [FINAL-QA-REPORT.md](./docs/testing/FINAL-QA-REPORT.md) | Master audit and verification test results |

---

## 🤝 Contributing

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/YourFeatureName
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat(module): add new functionality"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/YourFeatureName
   ```
5. **Open a Pull Request** with a summary of the implemented changes and test results.

---

## 📄 License

This repository is maintained and distributed for the **RoomBae PG Management System**. All rights reserved.

<div align="center">

Crafted with dedication by **Ayushman Saha** • Powered by **React 19 + Express + MongoDB + Prisma**

[⬆ Back to Top](#-roombae--enterprise-multi-tenant-pg--coliving-management-platform)

</div>
