# RoomBae Final Project Structure & Component Map

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect  
**Status**: ARCHITECTURE TOPOLOGY MAP FINALIZED

---

## 1. Directory Topology

```text
PG-Management-System/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma                  # Normalized Prisma 7 schema (BankAccount, Idempotency, Outbox)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                     # Runtime env loader
│   │   │   ├── secrets.ts                 # Zod validated secrets manager
│   │   │   └── prisma.ts                  # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts          # RS256 Bearer auth & Cache-Control: private, no-store
│   │   │   ├── csrfMiddleware.ts          # Double Submit Cookie CSRF defense
│   │   │   ├── idempotencyMiddleware.ts   # Idempotency-Key request deduplication
│   │   │   └── rateLimiter.ts             # Atomic Lua sliding-window rate limiters
│   │   ├── modules/
│   │   │   ├── auth/                      # Authentication controller, service & DTOs
│   │   │   ├── devices/                   # Device intelligence & fingerprint services
│   │   │   ├── email/                     # Transactional Nodemailer Bento email service
│   │   │   └── phone-auth/                # Twilio SMS verification service
│   │   ├── services/
│   │   │   ├── outbox/
│   │   │   │   └── OutboxService.ts       # Transactional outbox event manager
│   │   │   └── security/
│   │   │       ├── EncryptionService.ts   # AES-256-GCM authenticated envelope encryption
│   │   │       ├── JwksService.ts         # Public JWKS exporter & key rotation
│   │   │       ├── JwtKeyService.ts       # Asymmetric RS256 token signer (with kid)
│   │   │       ├── KycAuthorizationService.ts # Single source of truth KYC gate
│   │   │       ├── PolicyEngine.ts        # Centralized RBAC & resource ownership
│   │   │       ├── PreAuthChallengeService.ts # Dual-storage step-up 2FA challenges
│   │   │       ├── RedisNamespace.ts      # Type-safe Redis key builders
│   │   │       ├── RiskEngine.ts          # Multi-signal scoring & impossible travel
│   │   │       ├── SessionRevocationService.ts # Unified session & WebSocket revoker
│   │   │       └── SocketSessionService.ts # WebSocket handshake & packet authorization
│   │   ├── socket/
│   │   │   └── socketServer.ts            # Socket.IO server with 25s ping, 10s timeout
│   │   ├── app.ts                         # Express application setup & JWKS endpoint
│   │   └── server.ts                      # HTTP/WebSocket server bootstrap
│   └── src/__tests__/                     # 43 automated unit & integration test suites
├── frontend/
│   └── src/
│       ├── features/
│       │   └── auth/                      # 4-step signup wizard & unified login pages
│       └── services/
│           └── auth.service.ts            # In-memory access token & singleton 401 refresh queue
├── docs/                                  # Architectural audits & verification reports
├── docker-compose.yml                     # Master multi-container orchestration
└── SIGNUP_FLOW.md                         # Master architecture specification
```

---

## 2. Component Verification

All components conform to zero-trust standards with zero data loss, zero duplicate models, zero unvalidated secrets, zero plaintext OTPs, and zero financial PII in client storage.
