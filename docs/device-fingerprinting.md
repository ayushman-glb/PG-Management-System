# RoomBae Browser / Device Identification & Security Architecture

> **Technical Architecture & Operations Specification**  
> Subsystem: Device Fingerprinting, Trust Lifecycle, Risk Evaluation, & Security Audit

---

## 1. Overview & Objective

The **RoomBae Device Identification and Security Subsystem** provides intelligent, client-side fingerprinting and server-side risk evaluation to protect multi-tenant PG management workflows against unauthorized logins, credential stuffing, and session hijacking.

It operates as a **secondary security signal**. Primary authentication (passwords, JWTs, refresh tokens, Google OAuth) remains intact and strictly required.

---

## 2. Architecture & Dependency Inversion

```text
[Frontend Browser]
   │
   ├── deviceIdentityProvider (FingerprintJS Provider Singleton)
   │     └── Caches visitorId in memory during app lifecycle
   │
   └── ApiClient (fetch wrapper)
         └── Automatically attaches `X-Visitor-Id` header to requests

[Backend Express Server]
   │
   ├── apiRouter (/api/v1/security/devices)
   │     └── authenticate (JWT validation)
   │
   ├── DeviceController
   │     ├── identifyDevice
   │     ├── getDevices
   │     ├── trustDevice
   │     ├── revokeDevice
   │     ├── blockDevice
   │     └── getSecurityEvents
   │
   ├── DeviceService & DeviceRiskEngine
   │     ├── Evaluates risk scores (LOW, MEDIUM, HIGH, CRITICAL)
   │     └── Dispatches security audit events
   │
   └── DeviceRepository (Prisma ORM)
         ├── SHA-256 Hashing of visitor IDs (never stores raw fingerprint components)
         └── MongoDB `UserDevice` & `SecurityAuditEvent` collections
```

The frontend uses dependency inversion via the `DeviceIdentityProvider` interface. This enables seamless migration from open-source `@fingerprintjs/fingerprintjs` to commercial **Fingerprint Pro** or a custom server-side fingerprint provider without altering application UI components.

---

## 3. Database Schema

### `UserDevice` Collection
| Field | Type | Description |
|---|---|---|
| `id` | ObjectId | Unique Mongo document identifier |
| `userId` | ObjectId | Reference to `User` account |
| `visitorIdHash` | String | SHA-256 hash of Fingerprint visitor ID |
| `provider` | String | Provider identifier (`fingerprintjs`) |
| `deviceLabel` | String | Parsed browser and OS representation (e.g. `Chrome on macOS`) |
| `status` | Enum | `NEW` \| `TRUSTED` \| `BLOCKED` \| `REVOKED` |
| `trustLevel` | Enum | `TRUSTED` \| `UNTRUSTED` |
| `firstSeenAt` | DateTime | Timestamp when device was first registered |
| `lastSeenAt` | DateTime | Timestamp of last active API interaction |

### `SecurityAuditEvent` Collection
Tracks immutable security audit events (`LOGIN_SUCCESS`, `NEW_DEVICE`, `DEVICE_TRUSTED`, `DEVICE_REVOKED`, `DEVICE_BLOCKED`, `SUSPICIOUS_LOGIN`, etc.) with associated risk level and severity.

---

## 4. Device Trust Lifecycle & Risk Engine Rules

### Risk Scoring Matrix
- **BLOCKED Device**: Score = 100 (`CRITICAL` Risk) -> Authentication / action denied.
- **REVOKED Device**: Score += 60 (`HIGH` Risk) -> Step-up verification prompt required.
- **NEW Device**: Score += 25 (`MEDIUM` Risk) -> Security banner notification dispatched (`roombae-new-device-detected`).
- **TRUSTED Device**: Score = 0 (`LOW` Risk) -> Seamless normal authentication.

---

## 5. API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/security/devices/identify` | Bearer | Identifies browser fingerprint & evaluates risk |
| `GET` | `/api/v1/security/devices` | Bearer | Returns list of registered devices for current user |
| `PATCH` | `/api/v1/security/devices/:id/trust` | Bearer | Marks device status as `TRUSTED` |
| `POST` | `/api/v1/security/devices/:id/revoke` | Bearer | Revokes device access (`REVOKED`) |
| `POST` | `/api/v1/security/devices/:id/block` | Admin | Blocks device across system (`BLOCKED`) |
| `GET` | `/api/v1/security/devices/events` | Bearer | Fetches security audit trail |

---

## 6. Privacy & Data Minimization

1. **No Raw Fingerprint Storage**: Server hashes all visitor IDs using SHA-256 with a system-level salt.
2. **Ad-Blocker Fallback**: If browser extensions block fingerprinting, a safe fallback ID is generated locally (`fb_*`), allowing normal authentication to proceed without crashing.
3. **No Selling/Telemetry**: Fingerprint data is used strictly for fraud prevention and device trust management within RoomBae.

---

## 7. Migration Path to Fingerprint Pro

To migrate to commercial Fingerprint Pro in the future:
1. Update `frontend/src/services/deviceIdentity.ts` to swap `FingerprintJSProvider` with `@fingerprintjs/fingerprintjs-pro`.
2. Update backend `FINGERPRINT_PROVIDER=fingerprintjs-pro` environment variable.
3. No changes to database models or application controllers are required.
