# Roadmap — PG Management System

This expands on the high-level roadmap in the [README](../README.md) into concrete, phase-by-phase deliverables. Phases are sequential dependencies, not fixed calendar sprints — each phase assumes the previous one is functionally complete.

---

## Table of Contents

- [Phase 0: Foundation](#phase-0-foundation)
- [Phase 1: MVP — Single-PG Management](#phase-1-mvp--single-pg-management)
- [Phase 2: v1 — Multi-PG & Payments](#phase-2-v1--multi-pg--payments)
- [Phase 3: Growth — Self-Service & Discovery](#phase-3-growth--self-service--discovery)
- [Phase 4: Scale — Predictive & Extraction](#phase-4-scale--predictive--extraction)
- [Cross-Cutting Workstreams](#cross-cutting-workstreams)
- [Explicitly Out of Scope (For Now)](#explicitly-out-of-scope-for-now)

---

## Phase 0: Foundation

Goal: a deployable skeleton with no product features yet, but every later phase builds on it safely.

- [ ] Repo scaffolding: backend (Spring Boot modular monolith skeleton), frontend (React + Vite dashboard + marketing site), `docker-compose.yml` for local Postgres/Redis/Kafka
- [ ] Identity module: tenant + user tables, JWT access/refresh token issuance, Argon2id password hashing
- [ ] Postgres Row-Level Security policies scaffolded and tested with a two-tenant seed dataset (prove isolation before building anything on top)
- [ ] CI/CD: GitHub Actions pipeline — build, lint, test, Dependabot, OWASP ZAP baseline scan
- [ ] Base observability: Prometheus + Grafana wired up, health-check endpoints per module
- [ ] `docs/system-design.md` and `docs/api-spec.yaml` stubs created and kept in sync as modules land

**Exit criteria:** two tenants can be created, each with an isolated user, and a query written without a `tenant_id` filter still cannot return cross-tenant rows (RLS proven, not assumed).

---

## Phase 1 (MVP): Single-PG Management

Goal: one PG owner can run their day-to-day operations for a single property, manually, without payments or notifications.

- [ ] Property module: create a PG, add floors, rooms, and beds; visual occupancy grid on the dashboard
- [ ] Tenancy module: resident onboarding (manual KYC upload to S3, no e-sign yet), bed allocation
- [ ] Manual billing: owner records rent as paid/unpaid, due-date tracking, no payment gateway integration yet
- [ ] Operations: basic complaint ticketing (raise, assign, resolve) and a visitor log
- [ ] Owner dashboard: single-PG view — occupancy, pending dues, open complaints
- [ ] No 2FA yet, no audit log yet — those are hardening items for Phase 2

**Exit criteria:** a single owner can fully onboard a resident, allocate a bed, mark rent paid, and resolve a complaint — end to end, no external integrations required.

---

## Phase 2 (v1): Multi-PG & Payments

Goal: the product is usable by an owner with several properties and stops relying on manual rent tracking.

- [ ] Multi-PG support in Property + Tenancy: dashboard switches context across PGs owned by the same tenant
- [ ] Billing module: Razorpay integration (primary), Stripe as fallback, idempotency-key enforcement on payment/booking writes
- [ ] Automated late-fee calculation based on due-date rules
- [ ] Kafka introduced for payment events; reconciliation worker to catch missed webhooks
- [ ] Notification module: WhatsApp Business API + SMS/email for rent reminders and payment confirmations
- [ ] Mandatory TOTP 2FA for Owner/Admin accounts
- [ ] Append-only audit log for sensitive mutations (payment changes, KYC access, role changes)
- [ ] Field-level AES-256 encryption for sensitive resident data (Aadhar, PAN, bank details)
- [ ] Staff attendance and duty scheduling
- [ ] `docs/api-spec.yaml` published as the versioned (`/api/v1`) contract; Postman/Swagger import verified

**Exit criteria:** an owner with multiple PGs can collect rent online with automatic reconciliation and receive/send automated reminders, and the platform passes an internal security review against the checklist in [SECURITY.md](../SECURITY.md).

---

## Phase 3 (Growth): Self-Service & Discovery

Goal: reduce the owner's manual workload and start acquiring residents through the platform itself rather than only through the owner's existing channels.

- [ ] Resident self-service portal: view invoices, raise complaints, view agreement, download receipts
- [ ] E-sign agreements (replacing manual upload/manual agreement handling from Phase 1)
- [ ] Public PG discovery pages: SEO-optimized listing pages per PG, resident reviews
- [ ] QR-based gate entry and attendance for residents and staff
- [ ] Owner analytics v1: occupancy rate, revenue per PG, churn trends (read-only dashboard against the read replica)
- [ ] Marketing site polish: GSAP/AOS/Lenis animation pass on the public discovery and marketing pages

**Exit criteria:** a prospective resident can discover a PG through public search, and an onboarded resident can self-serve most of their day-to-day needs without contacting the owner directly.

---

## Phase 4 (Scale): Predictive & Extraction

Goal: the product moves from reactive record-keeping to proactive recommendations, and the architecture is stress-tested for scale.

- [ ] Predictive late-payer risk scoring (Analytics module, trained against historical payment behavior on the read replica)
- [ ] Vacancy forecasting per PG
- [ ] Dynamic pricing suggestions based on occupancy trends and local demand signals
- [ ] Chatbot for FAQ and first-line complaint triage (handing off to Operations for anything it can't resolve)
- [ ] Module extraction: Billing (highest independent scale needs) evaluated first for extraction into a standalone service, per the plan in [system-design.md](system-design.md#scalability-path); Analytics is the second candidate
- [ ] Load testing and capacity planning ahead of extraction decisions — extraction is justified by measured bottlenecks, not done speculatively

**Exit criteria:** at least one module has a documented, data-backed case for extraction (or a documented decision not to extract yet), and predictive features are live for a subset of pilot tenants.

---

## Cross-Cutting Workstreams

These run alongside every phase above rather than belonging to just one:

- **Security:** each phase's exit criteria includes a pass against the current [SECURITY.md](../SECURITY.md) scope; 2FA, encryption, and audit logging land in Phase 2 but are hardened continuously after.
- **Documentation:** `docs/system-design.md` and `docs/api-spec.yaml` are updated in the same PR as any change that affects them — they should never drift behind the actual implementation.
- **Testing:** unit + integration tests per module; contract tests against `docs/api-spec.yaml` so frontend and backend can't silently diverge.

---

## Explicitly Out of Scope (For Now)

To keep each phase honest about what it does *not* include:

- Native mobile apps (web-responsive dashboard and portal only, through Phase 4)
- Multi-currency / international payment support (Razorpay/Stripe India-first)
- Franchise/multi-owner-per-PG ownership models (one owning tenant per PG, for now)