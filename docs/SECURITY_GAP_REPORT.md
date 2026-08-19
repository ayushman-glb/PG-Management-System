# RoomBae Security Gap Analysis & Remediation Report

**Date**: August 19, 2026  
**Auditor**: Principal Security Architect & Lead Backend Engineer  
**Scope**: Defense-in-Depth, Idempotency, Encryption, Outbox Pattern, Observability  
**Status**: AUDIT COMPLETE (Grounded in Codebase)

---

## 1. Executive Summary

This report establishes the baseline gap analysis for enterprise hardening across zero-trust authentication, field-level encryption, idempotency guarantees, transactional outbox messaging, and distributed tracing.

---

## 2. Security Gap Analysis Matrix

| Gap ID | Identified Risk Area | Existing Implementation | Blueprint Requirement | Risk Level | File Path & Lines | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | Missing JWKS Key Rotation | `JwtKeyService.ts` signs RS256 with static/generated key without `kid` header. | `/.well-known/jwks.json` endpoint with multiple active keys and `kid` resolution. | High | [`JwtKeyService.ts:L15-L60`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/services/security/JwtKeyService.ts#L15-L60) | Implement `JwksService` and expose `GET /.well-known/jwks.json` route. |
| **GAP-02** | Google OAuth PKCE & Nonce | Passport Google strategy exchanges code without PKCE or HMAC-signed state. | Full PKCE code verifier and HMAC-SHA256 signed state with mandatory Phone OTP. | High | [`auth.routes.ts:L85-L120`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.routes.ts#L85-L120) | Rebuild OAuth pipeline with signed state and post-OAuth OTP gate. |
| **GAP-03** | Missing Banking Model Normalization | `OwnerProfile` embeds banking fields (`accountNumber`, `ifscCode`, `upiId`). | Separate `BankAccount` model with 1:1 relation and AES-256-GCM encryption. | High | [`schema.prisma:L140-L170`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/prisma/schema.prisma#L140-L170) | Create `BankAccount` model in Prisma with envelope encryption. |
| **GAP-04** | Missing Idempotency on Payment & Registration | Mutating POST requests without `Idempotency-Key` risk duplicate charges/creation on network retries. | Strict `Idempotency-Key` middleware backed by `IdempotencyRequest` MongoDB table. | High | [`app.ts:L40-L80`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/app.ts#L40-L80) | Add `idempotencyMiddleware.ts` storing responses with 24-hour TTL. |
| **GAP-05** | Direct Queue Dispatch (Dual-Write) | Controllers publish events directly to BullMQ, risking phantom jobs on DB aborts. | Transactional Outbox Pattern with `OutboxEvent` table and scheduled polling worker. | High | [`auth.service.ts:L150-L210`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/modules/auth/auth.service.ts#L150-L210) | Implement `OutboxService` and worker queue synchronizer. |
| **GAP-06** | Distributed Tracing & OpenTelemetry | Winston logs request IDs, but lacks unified Trace ID / Span ID propagation across Redis, Mongo, and BullMQ. | OpenTelemetry / W3C Trace Context propagation across all I/O boundaries. | Medium | [`correlationIdMiddleware.ts:L1-L30`](file:///c:/Users/GLB-BLR-191/Downloads/New%20folder/PG-Management-System/backend/src/middleware/correlationIdMiddleware.ts#L1-L30) | Propagate `traceparent` and correlation headers across all distributed services. |
