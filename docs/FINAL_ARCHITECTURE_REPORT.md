# RoomBae Final Architecture & System Design Report

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect & Lead Backend Engineer  
**Status**: ✅ **100% PRODUCTION READY (Architectural Conformance Verified)**

---

## 1. Executive Summary

This report documents the completed architectural transformation of RoomBae into a production-grade multi-tier SaaS platform. The system integrates React 19, Node.js 20 LTS, Express 4, Prisma ORM 6.19.3 (Prisma 7 ready), MongoDB Atlas, Redis v6+, Socket.IO v4.8.3, and BullMQ v5.41.

---

## 2. Architectural Comparison Matrix

| Architectural Layer | Pre-Refactor Baseline | Final Enterprise Implementation |
| :--- | :--- | :--- |
| **Token Cryptography** | Symmetric HS256 JWT without `kid` or rotation support. | Asymmetric RS256 with `kid` header, multi-key store, and public JWKS endpoint (`/.well-known/jwks.json`). |
| **Refresh & Lineage** | Basic refresh tokens without fork detection. | 256-bit opaque tokens with SHA-256 in DB, `SessionFamily` rotation lineage, and automatic family invalidation on replay. |
| **CSRF Defense** | Global CSRF validation causing friction on Bearer APIs. | Double Submit Cookie CSRF defense focused strictly on cookie-dependent mutating auth endpoints; bypass on Bearer APIs. |
| **Google OAuth** | Basic profile exchange without replay checks. | PKCE authorization code flow with HMAC-SHA256 signed state `{ role, redirect, nonce, timestamp }` and mandatory post-OAuth Phone OTP. |
| **Device Intelligence** | VisitorId treated as authoritative identity. | Probabilistic browser fingerprinting combined with IP, ASN, User-Agent, VPN, and Haversine velocity anomaly scoring. |
| **Database Schema** | Banking details embedded in `OwnerProfile`. | Normalized `BankAccount` model with AES-256-GCM envelope encryption, `IdempotencyRequest`, and `OutboxEvent` tables. |
| **Transaction Reliability** | Direct queue dispatch with dual-write hazard. | Transactional Outbox Pattern (`OutboxEvent` table) ensuring zero phantom job dispatches. |
| **In-Memory Scheme** | Loose string constants for Redis keys. | Type-safe `RedisNamespace.ts` builders (`security.*`, `session.*`, `cache.*`, `queue.*`, `lock.*`, `socket.*`). |
| **WebSocket Security** | Static handshake verification without continuous packet checks. | Continuous packet authorization middleware (`authorizeSocketEvent`), dynamic disconnect timers, and multi-node live evictions. |

---

## 3. Reliability & Scalability Guarantees

1. **Redis Node Failure**: System gracefully falls back to MongoDB Atlas for 2FA challenges and in-memory stores for rate limiting.
2. **SMS Gateway Timeout**: Twilio SMS automatically falls back to transactional Email OTP via Gmail OAuth2.
3. **Cache Stampede Protection**: Distributed mutex locks (`lock:cache:`) prevent database saturation during high-concurrency catalog lookups.
4. **401 Deduplication**: Frontend singleton `refreshPromise` prevents token rotation race conditions across concurrent queries.
