# 🛠️ RoomBae Environment Setup & Deployment Guide

This guide explains how to configure RoomBae for local development and production deployment. It also describes the environment file structure, deployment architecture, and required environment variables.

> **Important**
> Never commit real credentials, API keys, secrets, tokens, or passwords to GitHub. Store them only in your local `.env` files or your hosting provider's environment variable settings.

---

# 📁 Environment File Structure

The backend uses `dotenv` together with Zod validation (`src/config/env.ts`) to load and validate environment variables.

| File | Purpose | Commit to Git |
|------|----------|---------------|
| `.env.example` | Template containing placeholders | ✅ Yes |
| `.env.development` | Local development configuration | ❌ No |
| `.env.production` | Production configuration template | ❌ No |
| `.env` | Local override | ❌ No |

Example `.gitignore`

```gitignore
.env
.env.*
!.env.example
```

---

# 🚀 Local Development

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend:

```
http://localhost:5000
```

API:

```
http://localhost:5000/api/v1
```

Swagger:

```
http://localhost:5000/api/docs
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```
http://localhost:5173
```

The frontend communicates with the backend running locally.

---

# 🌍 Production Architecture

```text
GitHub Pages (React)
        │
        ▼
https://your-frontend-url
        │
 REST API / GraphQL
        │
        ▼
Render Backend
https://your-backend-url
        │
        ▼
MongoDB Atlas

        │
        ▼
Redis Cloud
```

---

# 🚀 Backend Deployment (Render)

Configure these variables in the Render Dashboard.

## Required

```env
NODE_ENV=production

PORT=5000

CLIENT_URL=https://your-frontend-domain

FRONTEND_URL=https://your-frontend-domain

API_BASE_URL=https://your-backend-domain

DATABASE_URL=<your_mongodb_connection_string>

REDIS_URL=<your_redis_connection_string>

JWT_SECRET=<your_secure_jwt_secret>

JWT_REFRESH_SECRET=<your_secure_refresh_secret>

SESSION_SECRET=<your_secure_session_secret>

GOOGLE_CLIENT_ID=<your_google_client_id>

GOOGLE_CLIENT_SECRET=<your_google_client_secret>

GOOGLE_CALLBACK_URL=https://your-backend-domain/api/v1/auth/google/callback>
```

---

# 🚀 Frontend Deployment

Example `.env.production`

```env
VITE_API_URL=https://your-backend-domain/api/v1

VITE_GRAPHQL_URL=https://your-backend-domain/graphql

VITE_SOCKET_URL=https://your-backend-domain
```

Build

```bash
npm run build
```

---

# 🔑 Google OAuth Configuration

Google Cloud Console

Create

```
OAuth Client ID
```

Application Type

```
Web Application
```

## Authorized JavaScript Origins

Development

```
http://localhost:5173
```

Production

```
https://your-frontend-domain
```

---

## Authorized Redirect URIs

Development

```
http://localhost:5000/api/v1/auth/google/callback
```

Production

```
https://your-backend-domain/api/v1/auth/google/callback
```

---

# 📧 Email Provider

Configure your preferred email provider.

Example variables

```env
SMTP_HOST=<smtp_host>

SMTP_PORT=<smtp_port>

SMTP_USER=<smtp_username>

SMTP_PASS=<smtp_password>

EMAIL_FROM=<display_name_and_email>
```

---

# ☁️ Cloudinary

```env
CLOUDINARY_CLOUD_NAME=<cloud_name>

CLOUDINARY_API_KEY=<api_key>

CLOUDINARY_API_SECRET=<api_secret>
```

---

# 🔥 Firebase Admin

```env
FIREBASE_PROJECT_ID=<project_id>

FIREBASE_CLIENT_EMAIL=<client_email>

FIREBASE_PRIVATE_KEY=<private_key>
```

---

# 📋 Environment Variables

| Variable | Required | Description |
|-----------|----------|-------------|
| NODE_ENV | Yes | Runtime environment |
| PORT | Yes | Backend port |
| CLIENT_URL | Yes | Allowed frontend origin |
| FRONTEND_URL | Yes | Frontend URL used for redirects |
| API_BASE_URL | Yes | Backend base URL |
| DATABASE_URL | Yes | MongoDB Atlas connection string |
| REDIS_URL | Yes | Redis connection string |
| JWT_SECRET | Yes | JWT signing secret |
| JWT_REFRESH_SECRET | Yes | Refresh token secret |
| SESSION_SECRET | Yes | Express session secret |
| GOOGLE_CLIENT_ID | Yes | Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | Yes | Google OAuth Client Secret |
| GOOGLE_CALLBACK_URL | Yes | OAuth callback URL |
| SMTP_HOST | Yes | SMTP server |
| SMTP_PORT | Yes | SMTP port |
| SMTP_USER | Yes | SMTP username |
| SMTP_PASS | Yes | SMTP password |
| EMAIL_FROM | Yes | Sender email |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret |
| FIREBASE_PROJECT_ID | Yes | Firebase project |
| FIREBASE_CLIENT_EMAIL | Yes | Firebase service account email |
| FIREBASE_PRIVATE_KEY | Yes | Firebase private key |

---

# ⚡ Environment Validation

RoomBae validates all required environment variables during application startup using Zod.

If any required variable is missing or invalid, the application exits immediately.

Example:

```text
❌ Environment validation failed

DATABASE_URL is required

JWT_SECRET must contain at least 32 characters

GOOGLE_CLIENT_SECRET is missing

SMTP_PASS is required
```

---

# 🔒 Security Best Practices

- Never commit `.env` files.
- Never commit API keys or secrets.
- Rotate credentials immediately if they are exposed.
- Use different credentials for development and production.
- Store production secrets only in your hosting provider (e.g. Render Environment Variables).
- Use `.env.example` with placeholders for documentation.
- Enable GitHub Secret Scanning and Push Protection.
- Periodically rotate OAuth client secrets, JWT secrets, and SMTP credentials.

---

# 📚 Deployment Checklist

- MongoDB Atlas configured
- Redis configured
- Google OAuth configured
- Firebase configured
- SMTP configured
- Cloudinary configured
- Render environment variables added
- Frontend environment variables added
- Build succeeds
- Backend health check passes
- Google OAuth login works
- Email verification works
- File uploads work
- HTTPS enabled
- Secrets stored securely