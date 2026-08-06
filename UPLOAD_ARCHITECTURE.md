# RoomBae — Centralized Upload Architecture

This document describes the end-to-end file and media upload pipeline for RoomBae, covering Multer staging, Sharp image processing, magic byte verification, Cloudinary cloud storage, MongoDB metadata persistence, and transactional rollback compensation.

---

## 1. Request Lifecycle Diagram

```
Client App (React / Axios / XHR)
      │
      ▼
Express Router (/api/v1/media or /api/v1/upload)
      │
      ├─► Rate Limiter Middleware (uploadLimiter)
      ├─► Multer Staging Middleware (multerUpload)
      ├─► Security Pipeline Middleware (processSecurityPipeline)
      │      ├── 1. File extension validation (.jpg, .png, .webp, .avif, .pdf)
      │      ├── 2. Magic byte signature verification
      │      ├── 3. Sharp optimization (q_auto, f_auto, WebP/AVIF output)
      │      └── 4. SHA-256 Checksum computation
      │
      ▼
Media Controller (mediaController.uploadSingle / uploadMultiple)
      │
      ▼
Media Service (mediaService.uploadSingle)
      │
      ├─► 1. Cloudinary Upload (cloudinaryService.uploadFile)
      └─► 2. MongoDB Metadata Record Save (mediaRepository.createMediaRecord)
             └── Transactional Rollback: If DB save fails, automatically call
                 cloudinaryService.deleteFile(publicId) to prevent orphans.
```

---

## 2. Supported Folder Hierarchy

Uploads are automatically organized into Cloudinary subfolders namespaced by environment prefix (`RoomBae-development` or `RoomBae-production`):

| Target Entity | Cloudinary Path | Allowed Extensions |
| :--- | :--- | :--- |
| **Rooms & Beds** | `RoomBae-{env}/rooms/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Properties** | `RoomBae-{env}/properties/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Owner Profiles** | `RoomBae-{env}/owners/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Residents** | `RoomBae-{env}/residents/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Avatars** | `RoomBae-{env}/avatars/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Agreements** | `RoomBae-{env}/agreements/` | `.pdf`, `.svg` |
| **Complaints** | `RoomBae-{env}/complaints/` | `.jpg`, `.png`, `.webp`, `.avif` |
| **Documents** | `RoomBae-{env}/documents/` | `.pdf`, `.jpg`, `.png`, `.webp` |
| **KYC Scans** | `RoomBae-{env}/kyc/` | `.pdf`, `.jpg`, `.png`, `.webp` |

---

## 3. Transactional Compensation & Rollback Rules

To eliminate orphaned cloud assets and dangling database references:
1. **Cloudinary Upload Failure**: If Cloudinary upload fails, the request returns a 500 error immediately. Database records are **never** created.
2. **MongoDB Write Failure**: If database metadata saving fails after Cloudinary succeeds, a `try/catch` block catches the exception and immediately issues a `cloudinaryService.deleteFile(publicId)` call to delete the asset from Cloudinary.
3. **Asset Replacement**: When an image is replaced via `PUT /api/v1/media/replace/:publicId`, the existing Cloudinary asset and its MongoDB record are purged before the new asset is persisted.
