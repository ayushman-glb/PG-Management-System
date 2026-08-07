# RoomBae PG Management System — GSD Project Blueprint

## Core Goal

Zero-Trust Enterprise PG (Paying Guest) Management System providing seamless onboarding, property allocation, rent billing, complaint tracking, and real-time communication for Owners and Residents. Production-ready, REST-only, fully rebuilt with preserved business behavior.

## Architecture Stack

### Frontend
- **Framework**: React 19 + Vite 6 + TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand + Context
- **Animations**: Framer Motion (consolidated; GSAP/Lenis removed if redundant)
- **Real-time**: Socket.IO Client
- **Schema Validation**: Zod
- **UI**: Lucide React icons, Recharts for charts
- **Routing**: Client-side state-based routing (preserved), React lazy + Suspense

### Backend
- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express 4.x
- **ORM**: Prisma 5.x (MongoDB provider)
- **Cache/Locking**: Redis 7.x + Redlock
- **Real-time**: Socket.IO 4.x
- **Security**: Helmet, CORS, cookie-parser, express-rate-limit, express-mongo-sanitize, xss-clean, hpp, argon2/bcrypt, JWT, AES-256-GCM field encryption
- **Validation**: Zod (server-side)
- **API**: REST-only (no GraphQL)
- **Testing**: Jest + Supertest + ts-jest

### Third-Party Integrations
- **Database**: MongoDB 7.0 (Atlas/Replica Set)
- **Cache**: Redis 7.x
- **Cloud Storage**: Cloudinary (images + PDFs)
- **Payments**: Razorpay (orders, webhooks, refunds)
- **Email**: Brevo SMTP (Nodemailer)
- **OAuth**: Google OAuth 2.0 (Passport)
- **Documents**: PDFKit (invoices, agreements, receipts, KYC)
- **Image Processing**: Sharp
- **File Upload**: Multer + file-type MIME validation
- **QR Codes**: qrcode

## Database

- **Provider**: MongoDB (Prisma `provider = "mongodb"`)
- **Schema**: `backend/prisma/schema.prisma` — comprehensive domain models
- **Indexes**: Sparse indexes on optional unique fields, compound indexes on queries
- **Migrations**: Prisma `db push` (MongoDB preview), seed scripts

## Deployment

- **Frontend**: GitHub Pages (static hosting)
- **Backend**: Render.com (Docker, Node.js 20)
- **Database**: MongoDB Atlas (production), MongoDB 7.0 Replica Set (docker-compose)
- **Cache**: Redis (docker-compose)
- **Reverse Proxy**: Nginx (docker-compose)
- **CI/CD**: GitHub Actions (ci.yml for typecheck+build, deploy.yml for frontend)

## GSD Workflow Phases

| Phase | Title | Status |
|-------|-------|--------|
| 0 | Repository Discovery | completed |
| 1 | Existing System Audit | in-progress |
| 2 | Requirements & Business Logic Reconstruction | pending |
| 3 | Architecture & GSD Planning | pending |
| 4 | Database / Prisma Reconstruction | pending |
| 5 | REST API Architecture | pending |
| 6 | Authentication & Authorization | pending |
| 7 | Third-Party Integrations | pending |
| 8 | Core Backend Modules | pending |
| 9 | Frontend Architecture | pending |
| 10 | Design System | pending |
| 11 | Complete UI Rebuild | pending |
| 12 | API Integration | pending |
| 13 | Payments & Billing | pending |
| 14 | Documents / PDF / Uploads | pending |
| 15 | Notifications / Realtime | pending |
| 16 | Analytics | pending |
| 17 | Security Hardening | pending |
| 18 | Performance Optimization | pending |
| 19 | Automated Testing | pending |
| 20 | E2E Testing | pending |
| 21 | Documentation | pending |
| 22 | Production Verification | pending |
| 23 | Final Full-System Audit | pending |

## Live Deployment URLs

- Frontend: `https://ayushman-glb.github.io/PG-Management-System/`
- Backend API: `https://pg-management-system-boxb.onrender.com/api/v1`
