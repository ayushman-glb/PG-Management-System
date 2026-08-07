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
