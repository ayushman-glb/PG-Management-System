# RoomBae Architectural Differential Report (Pre- vs Post-Remediation)

This document provides a component-by-component comparison between the initial authentication architecture and the hardened production system.

---

## 1. Architectural Differences Summary

```text
┌───────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Initial Implementation                │ Remediated Production Architecture                          │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Fixed 15-minute Redis JWT blacklist   │ Dynamic TTL blacklist (`exp - nowUnix`), zero memory leak   │
│ Dual KYC fields with sync drift       │ Single authoritative source (`OwnerKYC.verificationStatus`) │
│ Stale Redis tokenVersion read risk    │ MongoDB authoritative state + optimistic write-through cache│
│ Fragmented session revocation logic   │ Unified `SessionRevocationService` with DB transactions     │
│ Handshake-only WebSocket auth         │ Continuous packet auth (`authorizeSocketEvent`) + evictions │
│ Raw unversioned AES ciphertext format │ Authenticated envelope `v1:<keyId>:<iv>:<tag>:<ciphertext>` │
│ Simple binary IP/device 2FA trigger   │ Multi-signal `RiskEngine` with impossible travel velocity   │
│ Scattered controller authorization    │ Centralized `PolicyEngine` with structured denial reasons   │
│ Arbitrary Redis key strings           │ Strictly isolated `RedisNamespace` scheme factory           │
└───────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. Component-by-Component Diff

### 1. Token Version Management

- **Before**: Inconsistent caching with potential for tokens to remain valid after password change if Redis was down or stale.
- **After**: `TokenVersionService.ts` ensures MongoDB `$transaction` updates `User.tokenVersion` authoritatively. Redis cache `session:user:tokenVersion:<userId>` is updated synchronously on write and deleted on any Redis connection error.

### 2. Session Revocation

- **Before**: `auth.controller.ts` directly deleted refresh tokens without coordinating token version bumps, live socket disconnects, or dynamic blacklists.
- **After**: `SessionRevocationService.ts` provides atomic, idempotent methods (`revokeCurrentSession`, `revokeAllSessions`, `revokeForPasswordReset`, `revokeForReuseDetection`, `revokeForAdmin`) that update the database, sync Redis, broadcast `auth:revoked` via Socket.IO, and log immutable `SecurityAuditEvent` records.

### 3. Real-Time WebSocket Authorization

- **Before**: WebSockets verified tokens only during handshake; long-lived sockets remained open even after token expiration or account revocation.
- **After**: `SocketSessionService.ts` tracks remaining token TTL, registers automatic disconnect timers, verifies `tokenVersion` on every incoming packet (`authorizeSocketEvent`), and disconnects client sockets immediately upon revocation events.

### 4. Field Encryption & Key Lifecycle

- **Before**: Static single-key AES-256 encryption without envelope versioning or migration tools.
- **After**: `EncryptionService.ts` implements authenticated envelope format `v1:<keyId>:<iv>:<tag>:<ciphertext>`, multi-key derivation (`ENCRYPTION_MASTER_KEY_V1`, `ENCRYPTION_MASTER_KEY_V2`, `ACTIVE_ENCRYPTION_KEY`), transparent legacy parsing, and the automated `scripts/rotate-encryption.ts` migration tool.

### 5. Anomaly & Risk Evaluation

- **Before**: Login evaluation checked only `lastSeenIp` or device presence.
- **After**: `RiskEngine.ts` calculates weighted anomaly scores incorporating hardware UUIDs, IP subnets, User-Agent hashes, failed device attempts, VPN/Tor flags, and geographic travel velocity (> 800 km/h impossible travel detection).

### 6. Authorization Governance

- **Before**: Role checks were duplicated across routes and controllers.
- **After**: `PolicyEngine.ts` unifies all RBAC, KYC verification, and ownership permission logic with structured `{ allowed: boolean, code?: string, message?: string }` responses.

---

## 3. Database Schema Extensions

Added to `prisma/schema.prisma`:

- `LoginHistory`: Added `latitude`, `longitude`, `city`, `country`, `asn`, and index `@@index([userId, createdAt])`.
- `UserDevice`: Added `latitude`, `longitude`, `city`, `country`, `asn`.
- `SecurityAuditEvent`: Added `visitorId`, `country`, `asn`, and index `@@index([userId, createdAt])`.
- `PreAuthChallenge`: Added dual-storage fallback model with unique `tokenHash` and index `@@index([userId, expiresAt])`.
