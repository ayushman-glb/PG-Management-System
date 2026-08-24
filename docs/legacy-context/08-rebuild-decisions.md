# 08 — Master Rebuild Architectural Decisions

## Summary of Decisions

| # | Domain | Legacy Approach | Rebuild Architecture Decision | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **API Protocol** | Mixed REST & partial GraphQL | **Strict REST API (`/api/v1/*`)** | Eliminates dual-schema maintenance; ensures predictable HTTP semantics, caching, and clean DTO validation. |
| 2 | **Database Engine** | MongoDB with fragmented schema | **MongoDB + Normalized Prisma 7 Schema** | Enforces relational integrity, transaction safety (`$transaction`), and type-safe query generation. |
| 3 | **Caching & State** | Mixed Redis expectations | **MongoDB Authoritative State + In-Memory Fast-Path** | Removes hard external Redis dependency while maintaining horizontal scalability and zero-stale auth states. |
| 4 | **Authentication** | Fragile token storage & scattered checks | **Argon2 + JWT Access/Refresh Rotation + Email 2FA OTP + FingerprintJS** | Guarantees zero-trust security, device tracking, and protection against token theft/replay. |
| 5 | **Real-Time Sync** | Polling & inconsistent socket events | **Socket.IO Event Bus for State Invalidation** | Instantly syncs Owner Kanban, Resident status, and Admin queues without making WebSockets the database of record. |
| 6 | **Business Data** | Hardcoded dummy arrays in UI | **100% Database-Driven Dynamic State** | Complies with Rule 4 & Rule 5: Zero fake metrics, zero static inventory numbers. |
| 7 | **Payment Safety** | Trusting client flags | **Server-side Razorpay HMAC Verification + Webhook Idempotency** | Prevents financial state corruption, double billing, and forgery. |
| 8 | **Code Structure** | Fat controllers with direct DB queries | **Clean Multi-Layered SOLID Architecture** | Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Prisma $\rightarrow$ DB. |
