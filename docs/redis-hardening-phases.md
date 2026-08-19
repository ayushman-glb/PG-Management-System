# RoomBae Redis Production-Hardening Record

This document records the exact modifications, architectural decisions, and verification results across all eight hardening phases executed from `redis-hardening-prompt.md`.

---

## Phase 1 — Hash Tokens Before Using Them as Redis Keys

- **Problem:** Previously, raw JWT access tokens were interpolated directly into Redis keyspace (`jwt:blacklist:<raw_token>`), which exposed sensitive credential strings in Redis logs, monitor commands, memory dumps, and Redis GUI inspectors.
- **Modifications:**
  - In [`backend/src/services/tokenBlacklistService.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/tokenBlacklistService.ts), added `hashToken(token)` using Node's native `crypto.createHash("sha256").update(token).digest("hex")`.
  - Both write (`blacklistToken`) and lookup (`isTokenBlacklisted`) now query `jwt:blacklist:<sha256_hash>`.
  - Logger statement was updated to output only the first 8 characters of the SHA-256 hash (`tokenHashPrefix: tokenHash.substring(0, 8)`).
  - Audited [`backend/src/modules/auth/auth.service.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts) and [`backend/src/infrastructure/otp/RedisOtpService.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/infrastructure/otp/RedisOtpService.ts) to ensure refresh tokens and OTPs are also strictly SHA-256 hashed.

---

## Phase 2 — Atomic Rate-Limit Increment + Expire

- **Problem:** The previous `DistributedRedisStore` used a two-step sequence (`INCR` followed by `EXPIRE`). If a network glitch or process interruption occurred between the two calls on the first hit, the key would persist in Redis with `TTL == -1`, causing a permanent lockout for the client IP.
- **Modifications:**
  - In [`backend/src/middleware/rateLimiter.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts), replaced the two-step sequence with an atomic Lua script executed via `redisClient.eval`:
    ```lua
    local current = redis.call("INCR", KEYS[1])
    if current == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    return current
    ```
  - Added standalone diagnostic utility [`backend/scripts/diagnoseRateLimitTtl.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/scripts/diagnoseRateLimitTtl.ts) which uses `scanIterator` to detect any legacy `rl:*` keys with `TTL == -1`.

---

## Phase 3 — Safe Cache Invalidation & Cache Stampede Protection

- **Problem:**
  - `invalidatePattern(pattern)` previously used blocking `redisClient.keys()`, which freezes the Redis event loop on high-key datasets, and issued a single unbounded `del()`.
  - `remember<T>(key, ttl, fetcher)` suffered from the thundering herd / cache stampede problem where concurrent misses on an expired key all hit the database simultaneously.
- **Modifications:**
  - In [`backend/src/services/cache.service.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/cache.service.ts):
    - Replaced `keys()` with cursor-based `scanIterator({ MATCH: pattern, COUNT: 200 })`.
    - Batched keys are reclaimed using non-blocking `UNLINK` instead of `DEL`.
    - Added a hard safety cap of 10,000 keys per call to prevent unbounded scans.
    - Added distributed mutex lock (`lock:<key>` with 5-second `PX` auto-expiry) in `remember()`. Concurrent requests poll the cache with 50ms intervals up to 1.5s rather than slamming MongoDB.

---

## Phase 4 — Explicit Non-Silent Redis-Down Behavior (`REDIS_REQUIRED`)

- **Problem:** In production environments, silent fallbacks to local in-memory Maps allow rate limits and OTPs to be bypassed across multi-instance or serverless deployments.
- **Modifications:**
  - In [`backend/src/config/env.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/env.ts), introduced `REDIS_REQUIRED: z.string().default("false")`.
  - In [`backend/src/config/redis.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/redis.ts), exported `isRedisRequired()`.
  - In [`backend/src/middleware/rateLimiter.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts), when `REDIS_REQUIRED=true` and Redis is unreachable, the rate limiter fails closed (returns totalHits exceeding limit) and logs structured `logger.error()`.
  - In [`backend/src/infrastructure/otp/RedisOtpService.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/infrastructure/otp/RedisOtpService.ts), OTP generation and verification automatically route to the persistent MongoDB `OtpToken` collection when Redis is offline.
  - When `REDIS_REQUIRED=false` (development), in-memory Map fallbacks remain active for zero-setup developer convenience.

---

## Phase 5 — Dynamic Blacklist TTL Based on Actual Token Expiration

- **Problem:** Blacklist entries previously used a hardcoded 900-second fallback regardless of configured JWT access token expiration or the token's actual remaining lifetime.
- **Modifications:**
  - In [`backend/src/services/tokenBlacklistService.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/tokenBlacklistService.ts), added `parseDurationToSeconds(env.JWT_ACCESS_EXPIRATION)`.
  - When revoking a token, `blacklistToken` decodes `exp` claim and calculates `Math.max(1, exp - now)`. If decoding fails, it falls back to the parsed `JWT_ACCESS_EXPIRATION` in seconds.
  - Created unit test suite [`backend/src/__tests__/unit/tokenBlacklistService.test.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/__tests__/unit/tokenBlacklistService.test.ts) verifying dynamic remaining TTL calculation and SHA-256 keying.

---

## Phase 6 — Eviction Policy & Logical DB Architecture

### Architectural Findings:
1. **Logical DBs (`SELECT`):**
   - Configured via `REDIS_DB` in `env.ts` (default `0`).
   - Local Docker and standalone Redis instances support multiple logical DBs (`0` through `15`).
   - Managed Redis tiers (such as Upstash or clustered Redis) only support DB `0`.
2. **Eviction Policy Recommendations for Production:**
   - **Recommendation:** Configure Redis provider `maxmemory-policy` to `volatile-lru` or `volatile-ttl`.
   - **Rationale:** All RoomBae keys (`route:*`, `rl:*`, `otp:*`, `jwt:blacklist:*`, `refresh_token:*`) are created with explicit TTLs. `volatile-lru` guarantees that if memory approaches capacity, Redis will evict expiring cache keys while preserving active operational keys.
   - **Note:** Most managed cloud providers (Render, Upstash, Redis Cloud, AWS ElastiCache) block programmatic `CONFIG SET maxmemory-policy` from application code; this must be verified in the provider's management console.

---

## Phase 7 — Startup TLS/URL Configuration Validation

- **Problem:** Configuration mismatches (e.g. `REDIS_TLS="true"` with a `redis://` URL, or `REDIS_TLS="false"` with a `rediss://` URL) caused runtime socket errors or silent downgrade to unencrypted TCP.
- **Modifications:**
  - In [`backend/src/config/redis.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/redis.ts), implemented `validateRedisConfig()` called on initialization in `getRedisConfig()`.
  - Throws an explicit, descriptive configuration error failing fast at startup before any socket connection attempt if conflicting parameters are detected.

---

## Phase 8 — Observability & Telemetry Additions

- **Modifications:**
  - In [`backend/src/middleware/cacheMiddleware.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/cacheMiddleware.ts), added in-process telemetry tracking `routeCacheHits`, `routeCacheMisses`, `routeCacheBypasses`, and exported `getRouteCacheStats()`.
  - In [`backend/src/config/redis.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/config/redis.ts), exported `getRedisKeyEstimates()` using non-blocking bounded `scanIterator` (up to 1,000 keys per category).
  - In [`backend/src/app.ts`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/app.ts), extended `GET /health` to expose:
    ```json
    {
      "redis": {
        "status": "CONNECTED",
        "latencyMs": 1.2,
        "readyState": true,
        "keyEstimates": {
          "rateLimitKeys": 0,
          "otpKeys": 0,
          "blacklistKeys": 0
        }
      },
      "cache": {
        "routeCache": {
          "hits": 142,
          "misses": 18,
          "bypasses": 3,
          "totalRequests": 163,
          "hitRatePercent": 88.75
        }
      }
    }
    ```

---

## Phase 9 — Verification Summary

| Verification Item | Status | Result / Notes |
| :--- | :--- | :--- |
| **1. No raw secrets in Redis keys** | ✅ Verified | Grep audit confirmed all token/blacklist keys use SHA-256 hashes. |
| **2. Rate-limit atomic TTL** | ✅ Verified | Atomic Lua script ensures key + TTL set atomically in `DistributedRedisStore`. |
| **3. Non-blocking invalidation** | ✅ Verified | `scanIterator` with `UNLINK` and 10,000 key cap. |
| **4. Stampede mutex protection** | ✅ Verified | 5-second `lock:<key>` with 50ms polling loop. |
| **5. REDIS_REQUIRED behavior** | ✅ Verified | Rate limit fails closed when required; OTP routes to MongoDB `OtpToken`. |
| **6. Dynamic blacklist TTL** | ✅ Verified | Tested via Jest unit test `tokenBlacklistService.test.ts` (100% pass). |
| **7. Startup TLS validation** | ✅ Verified | `validateRedisConfig()` enforces protocol match. |
| **8. Observability on `/health`** | ✅ Verified | `GET /health` returns cache hit rates and non-blocking key counts. |
| **9. TypeScript Compilation** | ✅ Verified | `npx tsc --noEmit` exited with code 0 across entire backend. |
