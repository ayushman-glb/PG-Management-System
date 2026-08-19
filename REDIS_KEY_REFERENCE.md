# RoomBae Redis Key Namespace & Eviction Reference

All Redis keys in the RoomBae ecosystem are strictly isolated through `RedisNamespace.ts` to prevent key collisions, unexpected evictions, or cache invalidation leaks.

---

## 1. Redis Key Mapping Table

| Namespace Prefix | Pattern & Example | TTL | Purpose & Invalidation Strategy |
| :--- | :--- | :--- | :--- |
| **JWT Blacklist** | `security:jwt:blacklist:<sha256_token>`<br>`security:jwt:blacklist:912255ac...` | Dynamic (`exp - nowUnix`), Max 15m | Stores revoked access tokens. Automatically purged by Redis once token reaches natural expiry. |
| **OTP Codes** | `security:otp:<type>:<identifier_hash>`<br>`security:otp:phone:8f9a0b...` | 300s (5 minutes) | Stores SHA-256 hashed 6-digit phone/email verification codes. |
| **OTP Attempts** | `security:otp:<type>:<identifier_hash>:attempts` | 300s (5 minutes) | Tracks failed OTP verification attempts (max 3). |
| **PreAuth Challenges** | `security:preauth:<token_hash>`<br>`security:preauth:d60f4e...` | 300s (5 minutes) | Dual-storage step-up 2FA challenge tokens. Atomically consumed upon successful verification. |
| **Rate Limiters** | `security:ratelimit:<endpoint>:<target_hash>`<br>`security:ratelimit:login:192.168.1.1` | Sliding Window (15m) | Atomic Lua rate limit counters (10 max login attempts per 15 min). |
| **Token Version Cache** | `session:user:tokenVersion:<userId>`<br>`session:user:tokenVersion:usr_102938` | 7 Days (604800s) | Write-through cache of `User.tokenVersion`. Overwritten synchronously on version increment; deleted on Redis error. |
| **User Session State** | `session:user:<userId>` | 7 Days | Cached user profile and active session metadata. |
| **Public Route Caches** | `cache:<entity>:<query_params>`<br>`cache:properties:list:city_blr` | 300s (5 minutes) | Serialized JSON response caches for unauthenticated read endpoints. |
| **Distributed Locks** | `lock:cache:<resource>`<br>`lock:cache:properties:list` | 5s | Mutex lock preventing Cache Stampede (thundering herd) during cache repopulation. |
| **BullMQ Email Queue** | `queue:bull:email:*` | Managed by BullMQ | Background worker queues for transactional receipts and welcome emails. |
| **BullMQ SMS Queue** | `queue:bull:sms:*` | Managed by BullMQ | Background worker queues for Twilio cellular SMS OTPs. |

---

## 2. Strict Isolation Principles

1. **Security Isolation**: Keys prefixed with `security:*` are NEVER deleted during entity mutation cache purges (`cacheService.clearPattern("cache:*")`).
2. **Dynamic TTL Blacklist**: When blacklisting JWTs, TTL is calculated as `token.exp - Math.floor(Date.now() / 1000)`. If `ttl <= 0`, the token is discarded immediately without allocating Redis memory.
3. **Write-Through Token Version**: `TokenVersionService.incrementTokenVersion` writes directly to MongoDB Atlas first, then synchronously updates `session:user:tokenVersion:<userId>`. If Redis is temporarily unreachable, the key is deleted (`del`) to ensure subsequent reads fail open to authoritative MongoDB.
