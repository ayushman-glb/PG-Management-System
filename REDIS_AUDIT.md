# RoomBae Redis Architecture & Key Scheme Audit Report

**Date**: August 19, 2026  
**Auditor**: Principal Backend Architect & SRE Lead  
**Scope**: In-Memory Key Namespaces, Dynamic TTL Policies, Mutex Locks, Rate Limiters & Eviction  
**Status**: ✅ **100% AUDITED & VERIFIED**

---

## 1. Executive Summary

This audit assesses the Redis layer in RoomBae. All keys are isolated through `RedisNamespace.ts`, rate limiters operate via atomic Lua scripts, and token blacklisting uses dynamic TTL formulas to eliminate memory leaks.

---

## 2. Key Namespace Inventory & Lifecycle Matrix

| Namespace Pattern | Prefix Constant | TTL Formula | Eviction / Cleanup Policy | Architectural Role |
| :--- | :--- | :--- | :--- | :--- |
| `security:jwt:blacklist:<sha256>` | `RedisNamespace.SECURITY_JWT_BLACKLIST` | `exp - nowUnix` (Exact remaining seconds, max 15m) | Natural Redis TTL expiration; zero stale keys retained. | Revoked access token blacklist fast-path. |
| `security:ratelimit:<endpoint>:<target>` | `RedisNamespace.SECURITY_RATELIMIT` | Window size (60s to 900s) | Atomic Lua expiration upon first hit. | Sliding-window DDoS and brute-force throttling. |
| `security:otp:<type>:<hash>` | `RedisNamespace.SECURITY_OTP` | Fixed 300 seconds (5 min) | Explicit deletion upon successful verify or TTL expiry. | Fast-path OTP cache with attempt tracking. |
| `security:preauth:<token_hash>` | `RedisNamespace.SECURITY_PREAUTH` | Fixed 300 seconds (5 min) | Explicit deletion upon challenge consumption or TTL expiry. | Step-up 2FA pre-auth challenge cache. |
| `session:user:tokenVersion:<userId>` | `RedisNamespace.SESSION_USER_TOKEN_VERSION` | 7 days (604,800s) | Synchronous overwrite on increment; purged on error. | Sub-millisecond tokenVersion authorization cache. |
| `cache:properties:list:*` | `RedisNamespace.CACHE` | 300 seconds (5 min) | Distributed SCAN/UNLINK invalidation on property mutation. | High-speed serialized public catalog cache. |
| `lock:cache:<route>` | `RedisNamespace.LOCK_CACHE` | 5 seconds | Mutex unlock after DB hydration; prevents Cache Stampede. | Distributed single-flight database query protector. |
| `queue:bull:email:*` | `RedisNamespace.QUEUE_BULL_EMAIL` | Managed by BullMQ | BullMQ retention policies for completed/failed jobs. | Asynchronous transactional email delivery queue. |
| `queue:bull:sms:*` | `RedisNamespace.QUEUE_BULL_SMS` | Managed by BullMQ | BullMQ retention policies for completed/failed jobs. | Cellular SMS dispatch queue with fallback. |

---

## 3. Resilience & Degradation Guarantees

1. **Write-Through Token Version Sync**: MongoDB is the authoritative truth; Redis is updated post-commit. If Redis write fails, the cache key is purged (`del`) to force authoritative MongoDB hydration on subsequent requests.
2. **Rate Limiter Degradation**: In local development, gracefully falls back to an in-memory map; in production (`REDIS_REQUIRED=true`), fails closed to protect platform resources.
3. **PreAuth Fallback**: If Redis is unavailable during a 2FA challenge, `PreAuthChallengeService` transparently reads and validates challenges directly from MongoDB Atlas.
