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
