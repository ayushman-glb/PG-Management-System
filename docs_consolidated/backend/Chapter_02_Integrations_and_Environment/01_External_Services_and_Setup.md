# 01 External Services and Setup

> Consolidated documentation chapter for **backend**

---

## Source: $relSource

# Cloudinary Centralized Media Storage Setup & Architecture

RoomBae uses **Cloudinary** as the centralized, secure, production-grade media storage solution across the backend and frontend application. All uploaded images and documents are processed, optimized, and stored in Cloudinary, while metadata is persisted in MongoDB.

---

## 1. Cloudinary Configuration & Environment Variables

Cloudinary is configured using environment variables without hardcoded credentials.

### Required Environment Variables (`backend/.env`)

```env
# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=vmivgp12
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Folder Namespacing (defaults to RoomBae-${NODE_ENV})
CLOUDINARY_FOLDER_PREFIX=RoomBae-development

# Upload Limits & File Types
UPLOAD_MAX_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/webp,image/avif
ALLOWED_DOCUMENT_TYPES=application/pdf
```

---

## 2. Folder Structure Hierarchy

All media uploaded by RoomBae is automatically namespaced by environment prefix (`RoomBae-development` vs `RoomBae-production`) and categorized into target subfolders:

```
RoomBae-{NODE_ENV}/
├── rooms/           # Room gallery and bed photos
├── residents/       # Resident profile pictures
├── owners/          # Owner profile photos & logos
├── properties/      # PG building & property images
├── agreements/      # Generated PDF agreements & signature SVGs
├── complaints/      # Resident complaint ticket attachment photos
├── kyc/             # KYC document scans (Aadhaar, PAN, License, Selfie)
└── documents/       # General property and trade license documents
```

---

## 3. REST API Documentation (`/api/v1/media`)

All endpoints are protected by JWT authentication (`authenticate`) and rate-limited.

### 1. Upload Single File
* **Endpoint:** `POST /api/v1/media/upload/single`
* **Content-Type:** `multipart/form-data`
* **Form Data:**
  - `file`: File binary (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.pdf`)
  - `folder`: Target subfolder (e.g. `rooms`, `residents`, `complaints`, `kyc`)
  - `entityType`: Associated entity type (optional, e.g. `ROOM`, `RESIDENT`)
  - `entityId`: Associated entity ID (optional)
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Image/Media uploaded and optimized successfully.",
  "data": {
    "url": "http://res.cloudinary.com/vmivgp12/image/upload/v12345/RoomBae-development/rooms/sample.webp",
    "secureUrl": "https://res.cloudinary.com/vmivgp12/image/upload/v12345/RoomBae-development/rooms/sample.webp",
    "publicId": "RoomBae-development/rooms/sample",
    "assetId": "a1b2c3d4e5",
    "folder": "RoomBae-development/rooms",
    "width": 1600,
    "height": 1200,
    "format": "webp",
    "bytes": 142050,
    "originalFilename": "sample.png",
    "recordId": "650000000000000000000001"
  }
}
```

### 2. Upload Multiple Files
* **Endpoint:** `POST /api/v1/media/upload/multiple`
* **Content-Type:** `multipart/form-data`
* **Form Data:** `files` (array up to 10 files), `folder`, `entityType`, `entityId`.

### 3. Replace Image
* **Endpoint:** `PUT /api/v1/media/replace/:publicId`
* **Content-Type:** `multipart/form-data`
* **Form Data:** `file`, `folder`, `entityType`, `entityId`.

### 4. Delete Image
* **Endpoint:** `DELETE /api/v1/media/:publicId`
* **Query Params:** `resourceType` (`image` or `raw`, default: `image`)

### 5. Bulk Delete Images
* **Endpoint:** `POST /api/v1/media/bulk-delete`
* **Body:**
```json
{
  "publicIds": ["RoomBae-development/rooms/img1", "RoomBae-development/rooms/img2"]
}
```

### 6. Get Asset Metadata
* **Endpoint:** `GET /api/v1/media/metadata/:publicId`

### 7. Reorder Multiple Images
* **Endpoint:** `PATCH /api/v1/media/reorder`
* **Body:**
```json
{
  "publicIds": ["publicId1", "publicId2", "publicId3"],
  "entityType": "ROOM",
  "entityId": "room_123"
}
```

---

## 4. MongoDB & Prisma Schema Integration

Binary media files are **never** stored directly in MongoDB. Only metadata is persisted using Prisma embedded composite types or references.

### Prisma Schema (`backend/prisma/schema.prisma`)

```prisma
type MediaAsset {
  url              String
  secureUrl        String
  publicId         String
  assetId          String?
  folder           String
  width            Int?
  height           Int?
  format           String?
  bytes            Int?
  originalFilename String?
  uploadedBy       String?
  uploadedAt       DateTime @default(now())
}

model MediaRecord {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  url              String
  secureUrl        String
  publicId         String   @unique
  assetId          String?
  folder           String
  width            Int?
  height           Int?
  format           String?
  bytes            Int?
  originalFilename String?
  checksum         String?
  entityType       String?
  entityId         String?
  uploadedBy       String?
  uploadedAt       DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## 5. Frontend Components & Usage

### 1. `MediaUploader` Component
Features drag-and-drop file upload, file picker, upload progress indicator, failure retry, image replacement, deletion, and drag-to-reorder.

```tsx
import { MediaUploader } from '../components/common/MediaUploader';

<MediaUploader
  folder="rooms"
  multiple={true}
  maxFiles={5}
  initialValues={roomImages}
  onChange={(updatedAssets) => console.log('Updated room assets:', updatedAssets)}
/>
```

### 2. `CloudinaryImage` Component
Optimized, responsive, lazy-loaded image renderer with Cloudinary on-the-fly transformations and fallback placeholders.

```tsx
import { CloudinaryImage } from '../components/common/CloudinaryImage';

<CloudinaryImage
  src={room.logo}
  alt="Room preview"
  width={400}
  height={300}
  crop="fill"
  quality="auto"
  format="auto"
/>
```

---

## 6. Image Lifecycle & Cascading Deletion

When an entity (e.g. Property, Resident, Complaint) is deleted from RoomBae:
1. `mediaService.deleteImage(publicId)` or `mediaService.bulkDeleteImages(publicIds)` is invoked to purge Cloudinary assets.
2. MongoDB `MediaRecord` documents are unlinked and purged.
3. Transactional fallback logic ensures orphaned media files are avoided.



---

## Source: $relSource

## Source: $relSource

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

# 📧 Email Configuration

Configure your email sender settings:

```env
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
| EMAIL_FROM | Yes | Sender email |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret |

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
- Periodically rotate OAuth client secrets and JWT secrets.

---

# 📚 Deployment Checklist

- MongoDB Atlas configured
- Redis configured
- Google OAuth configured
- Email notifications configured
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


---

