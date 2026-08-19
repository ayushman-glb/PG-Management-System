# RoomBae Redis Architecture Audit Report

**Date**: August 19, 2026  
**Auditor**: Principal Backend Architect & SRE Lead  
**Scope**: In-Memory Namespaces, Key Schemas, Dynamic TTL Formulas, Layered Rate Limiters  
**Status**: AUDIT COMPLETE (Grounded in Codebase)

---

## 1. Executive Summary

This report audits the Redis in-memory coordination, rate limiting, and caching subsystems across `backend/src/services/security/RedisNamespace.ts`, `backend/src/middleware/rateLimiter.ts`, `backend/src/middleware/cacheMiddleware.ts`, and `backend/src/config/redis.ts`.

---

## 2. Redis Subsystem Audit Matrix

| Audit Item | Current Implementation | Problems & Inconsistencies | Risk Level | File Path & Lines | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Namespace Isolation & Builders** | `RedisNamespace.ts` defines constants for prefixes like `security:jwt:blacklist:`. | Should expose structured builder methods (`RedisNamespace.security.blacklist(tokenHash)`, `RedisNamespace.session.tokenVersion(userId)`, `RedisNamespace.cache.property(id)`) to completely ban raw string concatenation. | Medium | [`RedisNamespace.ts:L1-L40`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/security/RedisNamespace.ts#L1-L40) | Refactor `RedisNamespace.ts` into structured builder namespaces (`security`, `session`, `cache`, `queue`, `lock`, `socket`). |
| **Layered Rate Limiting** | `rateLimiter.ts` uses IP-based rate limiting via atomic Lua script. | Does not implement layered rate limiting across Account, Device, and Endpoint dimensions (`security:rl:ip:login`, `security:rl:user:login`, `security:rl:device`, `security:rl:otp`). | High | [`rateLimiter.ts:L1-L70`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/rateLimiter.ts#L1-L70) | Expand atomic Lua rate limiters to support composite keys combining IP, Account ID, and Device Fingerprint. |
| **Dynamic Blacklist TTL** | `tokenBlacklistService.ts` computes `exp - nowUnix` for remaining token lifespan. | Verified correct. Ensures no stale memory allocation after token expiry. | Low | [`tokenBlacklistService.ts:L15-L45`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/security/tokenBlacklistService.ts#L15-L45) | Maintain dynamic TTL calculation with fail-safe maximum cap (900s). |
| **Transactional Outbox / Worker Reliability** | BullMQ workers process emails and SMS directly from queue dispatch. | Controllers dispatching directly to queues risk losing jobs during uncommitted database rollbacks (dual-write problem). | High | [`auth.service.ts:L150-L200`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L150-L200) | Implement Transactional Outbox Pattern (`OutboxEvent` table) where background workers poll committed events and publish to BullMQ. |
