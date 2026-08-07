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
