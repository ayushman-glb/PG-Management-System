# RoomBae Audit: Redis Architecture & Distributed Caching

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect  
**Status**: AUDIT COMPLETE — REMEDIATION PLANNED

---

## 1. Existing Implementation

- **Redis Instance**: Redis 6+ / Upstash in-memory cache and message bus.
- **Namespaces**: `RedisNamespace.ts` providing structured builders (`security.*`, `session.*`, `cache.*`, `queue.*`, `lock.*`, `socket.*`).
- **Features**: Sliding-window rate limiting via atomic Lua scripts, dynamic TTL token blacklists, cache stampede mutex locks, BullMQ queue backing.

---

## 2. Problems Found

| Problem Area | Existing Code Pattern | File Locations | Root Cause |
| :--- | :--- | :--- | :--- |
| **Loose Key Strings** | Ad-hoc string concatenations (`"ratelimit:" + ip`) scattered across older route files. | `backend/src/middleware/rateLimiter.ts`, `backend/src/services/` | Key generation prior to centralized namespace factory. |
| **Static Blacklist TTL** | Hardcoded fixed TTL (e.g. 15m) applied on blacklist entries regardless of actual token expiration. | `backend/src/services/security/TokenBlacklistService.ts` | Over-retention of expired tokens in Redis memory. |
| **Degradation Failure** | Inability to proceed with 2FA step-up challenges during Redis downtime. | `backend/src/services/security/PreAuthChallengeService.ts` | Lack of MongoDB authoritative dual-storage fallback. |

---

## 3. File Locations

- Namespaces: `backend/src/services/security/RedisNamespace.ts`
- Blacklist: `backend/src/services/security/TokenBlacklistService.ts`
- Rate Limiter: `backend/src/middleware/rateLimiter.ts`
- PreAuth: `backend/src/services/security/PreAuthChallengeService.ts`

---

## 4. Root Cause

Unstructured Redis key construction and lack of secondary fallback storage layers for critical security tokens during cache cold starts or network partitions.

---

## 5. Refactor Strategy

1. **Centralize Key Builders**: Route 100% of Redis keys through `RedisNamespace.ts` builders.
2. **Dynamic TTL Blacklist**: Compute exact remaining token lifetime (`exp - nowUnix`) for blacklist records.
3. **Dual-Storage PreAuth**: Store step-up 2FA challenges in Redis with automatic read/write fallback to MongoDB `PreAuthChallenge`.
