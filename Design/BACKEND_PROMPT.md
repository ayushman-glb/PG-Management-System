# 🚀 ULTIMATE AI MASTER PROMPT: Zero-Trust MERN Enterprise Backend for "RoomBae" PG Management System

> **Target Role**: Principal Cyber-Security Architect, Lead Systems Architect, and Senior MERN Backend Engineer (Node.js + Express + TypeScript + Prisma ORM + MongoDB + Redis + GraphQL + SOAP).
> **Purpose**: Build the production-ready, enterprise-grade, zero-trust backend for the **RoomBae** PG Management application.

---

## 1. 📌 PROJECT ARCHITECTURE OVERVIEW

You are building the official enterprise backend service for **RoomBae**, a modern luxury Paying Guest (PG) & Co-Living Management Platform. The frontend is a React 19 + Vite 6 + TypeScript single-page application containing **14 interactive views**:

1. **Landing & Discovery (`Landing.tsx`, `PGListing.tsx`, `PGDetails.tsx`)**: Public PG search by location/city, rent range sliders, type filters (Men's, Women's, Mixed), room options (Single, Double, Triple), image galleries, reviews, nearby places, and visit scheduling.
2. **Owner Management Dashboard (`Dashboard.tsx`, `Analytics.tsx`)**: Real-time revenue metrics, occupancy percentages (heatmaps & pie charts), pending dues breakdown, monthly collection trends, and automated quick actions.
3. **Property & Inventory Operations (`Properties.tsx`, `Operations.tsx`)**: Multi-property management, floor-by-floor room grid, bed allocation matrices, and property configuration (GSTIN, bank payout accounts, amenities).
4. **Resident Directory & Digital Onboarding (`Residents.tsx`, `ResidentRegister.tsx`)**: 5-step KYC onboarding flow (Personal info, Aadhaar/PAN upload with image/PDF preview, permanent/current address, PG preferences, bank/UPI details).
5. **Billing, GST Invoicing & Payments (`Billing.tsx`)**: Razorpay payment integration, automatic CGST (9%) + SGST (9%) or IGST (18%) calculations, PDF tax invoice generation, and reminder dispatch.
6. **Complaints & Helpdesk (`Complaints.tsx`)**: Priority ticket workflow (Low, Medium, High, Urgent), ticket categories (Plumbing, Wi-Fi, Electrical, Housekeeping), status transitions (Open, In Progress, Resolved).
7. **Resident Self-Service Portal (`ResidentPortal.tsx`)**: 8-tab tenant dashboard covering Rent Due status, KYC verification badge, Roommate profiles & Wi-Fi credentials, Rent history & instant Razorpay checkout, Maintenance ticket tracker, Digital Visitor Pass QR generation, Weekly Meal Menu with Skip-Meal toggles, and Outing Gate Pass workflow.
8. **Authentication & Security (`Auth.tsx`)**: Dual role authentication (`OWNER` vs `RESIDENT`), Email + Password login, Resident ID login (`RES1001`), Google OAuth 2.0, WebOTP SMS auto-fill, and 2FA OTP verification.

---

## 2. 🛠 COMPLETE TECH STACK & SYSTEM SPECS

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ LTS) + TypeScript | PM2 Cluster Mode (Multi-threaded CPU scaling) |
| **Framework** | Express.js 4.x / 5.x | REST API routes (`/api/v1/*`) |
| **Database** | MongoDB 7.0 Replica Set | Multi-document ACID transactions |
| **ORM** | Prisma ORM 5.x (`provider = "mongodb"`) | Type-safe database queries & migrations |
| **Caching & Locking** | Redis 7.x + `ioredis` + `redlock` | Rate limiting, Session store, Distributed bed locks |
| **Dual API Layer** | GraphQL (`@apollo/server`) + SOAP (`node-soap`) | Complex data fetching (GraphQL) & Enterprise ERP billing (`/soap/billing?wsdl`) |
| **Payment Engine** | Razorpay SDK + Webhooks (HMAC-SHA256) | Multi-channel payments, auto-reconciliation, instant refunds |
| **Invoice Engine** | PDFKit + Stream | GST Tax Invoice PDF generation (`GET /api/v1/invoices/:id/download`) |
| **Geo-Location** | Nominatim OpenStreetMap / Mapbox API | Haversine distance, nearby PGs, lat/lng validation |
| **Security Suite** | Helmet, `express-ipfilter`, `express-rate-limit`, `express-mongo-sanitize`, AES-256-GCM | Zero-Trust security, TLS 1.3, CSP, NoSQL Injection & XSS protection |
