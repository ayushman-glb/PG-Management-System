# RoomBae PG Management System — Architecture Overview

---

## 1. High-Level Architecture

The **RoomBae PG Management System** is built as a zero-trust enterprise monorepo using a modern decoupled architecture:

```text
[ React 19 Client (Vite 8) ] ── (HTTP / REST / WebSockets) ──> [ Express Node.js Backend ]
                                                                       │
                                                               ┌───────┴───────┐
                                                               ▼               ▼
                                                        [ MongoDB Atlas ]  [ Redis ]
                                                        (via Prisma ORM) (Caching/Tokens)
```

- **Frontend**: Single Page Application built with React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion, and GSAP.
- **Backend**: Express REST API & legacy SOAP ERP service written in TypeScript, using Prisma ORM v5.22 targeting MongoDB.
- **Database & Cache**: MongoDB 7.0 Atlas cluster (with replica set for transactions) and Redis for session cache/throttling.
- **Real-Time Layer**: Socket.IO for real-time tenant notifications and instant messaging.

---

## 2. Monorepo Organization

```text
PG-Management-System/
├── frontend/             # Vite 8 + React 19 SPA
├── backend/              # Node.js Express REST & SOAP Server
├── backend/prisma/       # Prisma Schema definition & seed scripts
├── docs/                 # System architecture, environment & testing guides
└── docker-compose.yml    # Multi-container orchestration
```

---

## 3. Security & Data Protection

- **Zero-Trust Token Model**: Dual access & refresh token rotation with HTTP-only cookie support.
- **Data Encryption**: Sensitive fields and KYC documents encrypted with AES-256 before storage.
- **Middleware Isolation**: Helmet headers, CORS origin whitelisting, rate limiting, and Zod input validation.
