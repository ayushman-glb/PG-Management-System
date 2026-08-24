# 🚀 RoomBae — Vercel Frontend Deployment & Production Configuration Guide

**Application**: RoomBae PG Management System (Frontend)  
**Target Platform**: Vercel (Edge Network / Static Vite SPA)  
**Target Backend**: Render (`https://pg-management-system-boxb.onrender.com/api/v1`)  
**Real-Time WebSocket Engine**: Socket.IO (`https://pg-management-system-boxb.onrender.com`)  
**Authentication**: Multi-Role JWT, Device Fingerprinting, 2FA/OTP & Google OAuth 2.0  

---

## 1. Repository & Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│               VERCEL FRONTEND HOSTING                  │
│       Vite SPA — https://<your-app>.vercel.app         │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS REST APIs & WSS Events
                           ▼
┌────────────────────────────────────────────────────────┐
│                RENDER BACKEND CLUSTER                  │
│   https://pg-management-system-boxb.onrender.com/api/v1│
└──────────────────────────┬─────────────────────────────┘
                           │ Prisma ORM v6
                           ▼
┌────────────────────────────────────────────────────────┐
│                   MONGODB ATLAS                        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Vercel Project Settings

When creating or configuring the project on the [Vercel Dashboard](https://vercel.com/new):

| Setting | Value | Notes |
|---|---|---|
| **Repository** | `ayushman-glb/PG-Management-System` | GitHub linked repository |
| **Framework Preset** | **Vite** | Automatically detected |
| **Root Directory** | `frontend` | ⚠️ **DO NOT** use root directory |
| **Build Command** | `npm run build` | Runs `tsc -b && vite build` |
| **Output Directory** | `dist` | Generated build artifacts |
| **Install Command** | `npm install` | Clean dependency resolution |
| **Node.js Version** | `20.x` or `22.x` | Modern LTS runtime |

---

## 3. Required Vercel Environment Variables

Configure these variables in **Vercel Project Settings $\rightarrow$ Environment Variables**:

| Variable Name | Production Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://pg-management-system-boxb.onrender.com/api/v1` | Live Render backend REST API endpoint |
| `VITE_SOCKET_URL` | `https://pg-management-system-boxb.onrender.com` | Live Render backend Socket.IO origin |
| `VITE_FRONTEND_URL` | `https://<your-project-name>.vercel.app` | Assigned production Vercel domain |
| `VITE_GOOGLE_CLIENT_ID` | `355023139206-01me5sq7c82j84ji0lhk5km683etoam7.apps.googleusercontent.com` | Google Cloud OAuth 2.0 Web Client ID |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_TQlnZDKJSAnPV0` | Razorpay Client Publishable Key |
| `VITE_ENABLE_ANALYTICS` | `true` | Enables analytics charting |
| `VITE_ENABLE_NOTIFICATIONS`| `true` | Enables real-time notifications |
| `VITE_ENABLE_DARK_MODE` | `true` | Enables theme toggle |
| `VITE_ENABLE_CHAT` | `true` | Enables real-time chat widgets |
| `VITE_ENABLE_GOOGLE_LOGIN` | `true` | Enables Google OAuth login buttons |
| `VITE_ENABLE_RAZORPAY` | `true` | Enables online payment gateways |

> [!CAUTION]
> **Zero Secret Leaks**: Never put `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `RAZORPAY_KEY_SECRET`, or `CLOUDINARY_API_SECRET` into Vercel frontend environment variables. All secrets are safely managed exclusively on Render.

---

## 4. SPA Routing & Deep Linking (`vercel.json`)

To ensure client-side routes (e.g., `/dashboard`, `/properties`, `/residents`, `/billing`, `/complaints`, `/auth`, `/resident-portal`) resolve seamlessly upon direct browser access or page reload without returning a 404 error, [frontend/vercel.json](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/frontend/vercel.json) is configured:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Backend Requirements & Alignment

### A. CORS Allow-List
The backend automatically permits:
- All Vercel preview & production deployment URLs matching `https://*.vercel.app`
- Configured custom domains in `FRONTEND_URL` / `CLIENT_URL` / `CORS_ALLOWED_ORIGINS`
- Local development origins (`http://localhost:5173`)

### B. Google Cloud Console Authorized JavaScript Origins & Redirect URIs
Add your Vercel deployment domain to Google Cloud Console ([APIs & Services $\rightarrow$ Credentials](https://console.cloud.google.com/apis/credentials)):
1. **Authorized JavaScript Origins**:
   - `https://<your-project-name>.vercel.app`
   - `https://pg-management-system-boxb.onrender.com`
2. **Authorized Redirect URIs**:
   - `https://pg-management-system-boxb.onrender.com/api/v1/auth/google/callback`

### C. Socket.IO Cross-Origin Handshake
Socket.IO transport operates via WebSocket & Long-Polling on `https://pg-management-system-boxb.onrender.com` with `credentials: true`.

---

## 6. Verification Checklist

- [x] `npm install` runs cleanly without dependency conflicts.
- [x] `npm run build` generates `dist/` with valid `index.html` and modular assets.
- [x] Vite `base` path configured to `"/"` (root).
- [x] Zero backend secrets present in client bundle.
- [x] Dynamic URL syncing supports deep linking and browser navigation.
- [x] Unit test suite passes 100% (`10/10` tests).
