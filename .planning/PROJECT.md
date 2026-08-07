# RoomBae PG Management System

## Core Goal
Zero-Trust Enterprise PG (Paying Guest) Management System providing seamless onboarding, property allocation, rent billing, complaint tracking, and real-time communication for Owners and Residents.

## Architecture Stack
- **Frontend**: React 19 + Vite + TailwindCSS v4 + Zustand + Socket.io Client
- **Backend**: Node.js + Express + TypeScript + Prisma ORM + Socket.io + Redis
- **Security**: Argon2/Bcrypt, JWT with secure HTTP-only cookies, Helmet, Rate limiting, reCAPTCHA Enterprise

## Core Phases
1. **Phase 1**: Authentication & User Role Security
2. **Phase 2**: Property & Allocation Management
3. **Phase 3**: Rent Billing & Razorpay Payments
4. **Phase 4**: Real-time Complaints & Socket Notifications
