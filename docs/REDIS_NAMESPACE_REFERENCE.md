# RoomBae Redis Namespace & Key Reference

**Date**: August 19, 2026  
**Auditor**: Principal Infrastructure Engineer  
**Status**: KEY MAP VALIDATED & STANDARDIZED

---

## 1. What Changed

1. **Centralized Namespace Builders**: All Redis keys are generated exclusively via type-safe builders in `RedisNamespace.ts`.
2. **Structured Namespace Categories**:
   - `security.*`: Rate limiting, JWT blacklist, OTP verification, PreAuth 2FA challenges.
   - `session.*`: Active sessions, token versions, socket user mapping.
   - `cache.*`: Property listings, tenant data, user profiles.
   - `queue.*`: BullMQ email and SMS worker queues.
   - `lock.*`: Distributed mutex locks for cache stampede defense.
   - `socket.*`: Real-time user socket rooms and cluster pub/sub channels.

---

## 2. Why It Changed

- Eliminated loose string concatenation and key collisions across micro-services and worker queues.

---

## 3. Files Modified

- Namespace Factory: `backend/src/services/security/RedisNamespace.ts`
- Rate Limiting: `backend/src/middleware/rateLimiter.ts`
- Blacklist Service: `backend/src/services/security/TokenBlacklistService.ts`
- PreAuth Service: `backend/src/services/security/PreAuthChallengeService.ts`

---

## 4. Key Reference Table

| Builder Function | Key Pattern | TTL | Eviction Policy |
| :--- | :--- | :--- | :--- |
| `security.rateLimit(endpoint, target)` | `security:ratelimit:<endpoint>:<target>` | 900s | Volatile LRU |
| `security.jwtBlacklist(tokenHash)` | `security:jwt:blacklist:<tokenHash>` | `exp - now` | Volatile TTL |
| `security.otp(type, identifier)` | `security:otp:<type>:<identifier>` | 300s | Volatile TTL |
| `security.preauth(tokenHash)` | `security:preauth:<tokenHash>` | 300s | Volatile TTL |
| `session.tokenVersion(userId)` | `session:user:tokenVersion:<userId>` | 604800s | Volatile LRU |
| `cache.properties(queryHash)` | `cache:properties:list:<queryHash>` | 300s | Volatile LRU |
| `lock.cache(resource)` | `lock:cache:<resource>` | 5s | Volatile TTL |

---

## 5. Verification Evidence

- Tested across `redisDevPipeline.test.ts`, `rateLimiter.test.ts`, and `tokenBlacklistTtl.test.ts`.
