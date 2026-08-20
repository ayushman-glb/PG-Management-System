ROOMBAE — MASTER FULL-PROJECT AUDIT, DEFECT DISCOVERY & COMPLETE FIX EXECUTION
WITH PERSISTENT, RESUMABLE CHECKPOINT LOG (CROSS-SESSION / CROSS-MODEL SAFE)
================================================================================

ROLE
You are acting as Principal Architect, Security Engineer, Backend Engineer,
Database Engineer, Full-Stack Engineer, DevOps Engineer, and QA Lead for the
existing RoomBae production codebase. This is not a greenfield project and not
a documentation exercise — you are working against real, live code, and your
output is judged by what actually runs, not by what a doc claims runs.

HARD CONSTRAINTS (apply for the entire duration of this task, every session)
1. Never run `git push`. Never modify remote origin.
2. Never modify any `.env`, `.env.development`, `.env.production` file, and
   never invent or assume an environment variable's value. If a fix requires
   a new or changed env var, STOP, write it into the log as a blocked item
   with exactly what's needed and why, and move to the next item — do not
   guess a value.
3. Trust nothing written in any prior "final report" style doc in this repo
   (FINAL_SECURITY_REPORT.md, FINAL_ARCHITECTURE_REPORT.md, PERFORMANCE_REPORT.md,
   TEST_REPORT.md, or any architecture blueprint/spec .md file, including
   SYSTEM.MD, api_design.md, UPLOAD_ARCHITECTURE.md, and the Master Blueprint)
   as evidence that something works, is fixed, or exists. These are
   historical/aspirational documents that have repeatedly disagreed with
   each other and with the real code on this project. Every claim in them is
   a hypothesis to verify against real source, not a fact to build on. Where
   a doc and the code disagree, the code is correct and the doc is wrong —
   note the discrepancy, don't resolve it in the doc's favor.
4. No assumptions, ever. If you cannot verify something by reading the actual
   file, running the actual code, or executing an actual test, it goes in the
   log as "UNVERIFIED" — never "assumed working," never "should be fine."
5. Small, isolated changes per item. Never bundle unrelated fixes into one
   change. Never refactor something that isn't broken while fixing something
   that is. Never batch multiple subsystems' fixes into a single commit-sized
   change — verify each one before moving to the next.
6. After EVERY single completed unit of work (one finding verified, one fix
   applied, one test run) — not after a whole phase — update
   AUDIT_EXECUTION_LOG.md per the Checkpoint Protocol below. This file is the
   only thing guaranteed to survive a context/session boundary. If it isn't
   in that file, it didn't happen, as far as the next session is concerned.
7. Do not rewrite any architecture .md file (SYSTEM.MD, api_design.md, the
   Master Blueprint, UPLOAD_ARCHITECTURE.md, etc.) as part of this task —
   doc rewrites are out of scope for a code-fix pass. Where those docs are
   found to be stale or wrong, log the discrepancy plainly so the user knows
   a separate regeneration pass is needed; do not silently "fix" the docs
   yourself.

================================================================================
CHECKPOINT PROTOCOL — READ THIS BEFORE DOING ANYTHING ELSE
================================================================================
This task may be executed across multiple sessions and potentially multiple
different AI models. The mechanism that makes this safe is a single file:

    AUDIT_EXECUTION_LOG.md   (repo root)

STEP 0 OF EVERY SESSION, WITHOUT EXCEPTION:
  1. Check whether AUDIT_EXECUTION_LOG.md exists.
  2. If it does NOT exist: this is session 1. Create it using the template
     below and proceed to Phase 0.
  3. If it DOES exist: this is a resumed session. Read the ENTIRE file before
     writing or fixing anything. Find the most recent entry with status
     `IN_PROGRESS` or the first `PENDING` item after the last `DONE` item.
     Do not re-verify or re-fix anything already marked `DONE` unless its
     entry explicitly says it needs re-verification. Do not skip ahead of
     an `IN_PROGRESS` or `BLOCKED` item without resolving or explicitly
     re-triaging it first. Continue from exactly that point.

LOG FILE TEMPLATE (create with this structure if it doesn't exist):

```
# RoomBae Audit Execution Log
Started: <ISO date>
Last updated: <ISO date, update every entry>
Current phase: <phase number and name>
Current status: <NOT_STARTED | IN_PROGRESS | BLOCKED | DONE>

## How to resume this log (read this first if you're a new session/model)
Find the last entry below with status IN_PROGRESS or BLOCKED, or the first
PENDING entry after the last DONE entry. Continue from there. Do not redo
DONE items. Do not skip PENDING/BLOCKED items.

## Ground Truth (filled in during Phase 0 — do not proceed past Phase 0
## without every field below being a real, verified value, not a doc quote)
- Real Prisma version (from package.json):
- Real Node version:
- Real Express version:
- Is Redis actually used in the live code right now? (yes/no + evidence):
- If yes: which subsystems depend on it (rate limiting store / idempotency
  cache / tokenVersion cache / JWT blacklist / bed-hold lock / OTP & device-
  risk cache / Socket.IO adapter / BullMQ / route response cache), and is
  REDIS_URL (or equivalent) actually configured as required in this
  environment?
- Redis removal status (set once Phase 0.5 completes): NOT_STARTED |
  IN_PROGRESS | DONE | NOT_APPLICABLE (already fully Redis-free)
- Real Role enum values (verbatim from schema.prisma):
- Real Prisma model names for Payment, MealSchedule, PG/Property, User,
  Owner, Resident (verbatim from schema.prisma):
- Real middleware order (verbatim from app.ts, in order):
- Real signup flow: single-step registration+onboarding, OR multi-step
  wizard with draft persistence? (verify against actual routes/controllers,
  not the doc — the docs disagree with each other on this)
- Does BullMQ / OutboxService actually exist in code, or only in docs?
- Does the SOAP /soap/billing endpoint actually exist in code right now?

## Findings & Fixes Log (append one entry per unit of work, never edit
## past entries except to update their status)

### [phase].[item-number] — <short title>
Status: PENDING | IN_PROGRESS | BLOCKED | DONE
Found: <what you observed, with exact file path + line number>
Root cause: <why it's happening, grounded in the actual code>
Fix applied: <exact change made, or "none yet">
Verification: <exact command run and its real output, or "not yet run">
Blocked reason: <only if BLOCKED — e.g. "needs env var X, cannot proceed
  without a value from the user">
```

Every phase below produces entries in this format. Do not summarize multiple
findings into one entry — one entry per distinct issue, so a resuming session
can tell precisely what's done and what isn't.

================================================================================
PHASE 0 — GROUND TRUTH RECONCILIATION (mandatory, blocks everything else)
================================================================================
Do this before touching any code. Populate every field in the "Ground Truth"
section of the log with a value you personally verified by reading the file
or running a command — not by quoting a doc.

0.1. Read backend/package.json — record real Prisma, Node, Express, Redis
     client library (if any), BullMQ (if any), and Socket.IO versions.
0.2. Read backend/prisma/schema.prisma in full. Record: every model name,
     every field on Payment and MealSchedule specifically (this resolves the
     known seed.ts bug addressed in Phase 4.1), and the exact Role enum
     values.
0.3. Grep the entire backend/src tree — plus backend/prisma, package.json,
     package-lock.json, and any deploy config (render.yaml, Dockerfile,
     etc.) — case-insensitively for: redis, ioredis, node-redis, Redlock,
     redlock, RedisStore, bullmq, BullMQ, createClient(, REDIS_URL,
     REDIS_HOST, REDIS_TLS, REDIS_PASSWORD, "OutboxEvent", "OutboxService".
     For every hit, record: file, line, what it does, and whether it's on a
     live code path (imported/mounted from app.ts or server.ts) or
     dead/unreferenced. Record a definitive yes/no on whether Redis is a
     real, live runtime dependency right now, and if yes, exactly which
     features depend on it.
0.4. If Redis IS live: confirm REDIS_URL (or equivalent) is actually present
     in this environment's configuration (check env.ts's required-vars list,
     not the value itself). If the code requires Redis but no such env var
     is validated as required, this is itself a finding — log it in Phase 7.
0.5. If Redis is NOT live (fully removed already): confirm zero remaining
     runtime references — any hit from 0.3 that isn't dead code is a
     regression, log it as a Phase 7 finding immediately.
0.6. Read backend/src/app.ts top to bottom. Record the real, exact middleware
     registration order — do not copy any doc's version, even if it looks
     right; read the actual file.
0.7. Read backend/src/routes/apiRouter.ts and every *.routes.ts file it
     mounts. Build the REAL route inventory (method, path, middleware chain,
     controller). This supersedes every route table in every .md file in
     this repo, including api_design.md and SYSTEM.MD, which have shown
     drift from each other and are not to be trusted as-is.
0.8. Determine which signup flow is REAL: search for register-step1,
     profile-draft, business-profile, owner-kyc endpoints (the "7-step
     wizard" described in the Master Blueprint) vs. a single owners/onboard
     10-step-transaction endpoint (described in earlier api_design.md
     revisions). These are materially different flows — only one can be
     real, or some hybrid exists. Read the actual controller/route files to
     determine which, and record it precisely. Do not assume the newest doc
     is correct just because it's newest.
0.9. Confirm whether BullMQ workers and an OutboxService/OutboxEvent model
     genuinely exist and are wired up (queue processor running, model in
     schema.prisma), or whether this is architecture-doc language with no
     backing code. This finding is a direct input to Phase 0.5 (Redis
     removal) — do not proceed into Phase 0.5's BullMQ step without it.
0.10. Confirm whether /soap/billing is actually mounted in server.ts/app.ts.
0.11. Confirm the 4 items previously fixed in earlier work are still intact:
      safe CSRF comparison (length-checked before crypto.timingSafeEqual),
      no dead Redis references (superseded by 0.3-0.5's fuller check),
      app.set("trust proxy", 1) present and correct, rate limiters present
      on login/register/refresh/OTP routes.
0.12. Once every Ground Truth field is filled with a verified value, mark
      Phase 0 DONE in the log and proceed to Phase 0.5.

================================================================================
PHASE 0.5 — COMPLETE REDIS REMOVAL & FULL REDIS-FREE RESTRUCTURE
================================================================================
This phase acts directly on Phase 0's findings about Redis and must not run
before Phase 0 is DONE — it depends on Phase 0.3-0.5's inventory and 0.9's
BullMQ/Outbox finding to know what it's working with.

TRIGGER CONDITION: Run this phase in full if Phase 0 found ANY live Redis
reference, OR found a half-migrated/inconsistent state (some code paths
assume Redis, none is actually configured — the most likely production-bug
scenario given prior symptoms on this project, matching the classic "GET
works everywhere, every POST/PUT/PATCH/DELETE 500s" pattern). If Phase 0
already confirmed zero Redis references anywhere, skip straight to 0.5.6,
log that confirmation, set Redis removal status to NOT_APPLICABLE in the
Ground Truth block, and proceed to Phase 1.

--------------------------------------------------------------------------------
0.5.1 — FULL INVENTORY (build before deleting or changing anything)
--------------------------------------------------------------------------------
Using the grep results already gathered in Phase 0.3, classify each LIVE hit
by subsystem:
  - rate limiting store
  - idempotency cache
  - tokenVersion / session cache
  - JWT blacklist
  - bed-hold distributed lock (Redlock)
  - OTP attempt counters / device-risk preauth step-up cache
  - Socket.IO horizontal-scaling adapter (pub/sub)
  - BullMQ job queue
  - generic Redis-backed route response cache

Write this full inventory into AUDIT_EXECUTION_LOG.md as its own labeled
subsection before changing any code. This is the map every later step in
this phase works against — don't start replacing things before it's complete.

--------------------------------------------------------------------------------
0.5.2 — REPLACE SUBSYSTEM BY SUBSYSTEM (one change at a time, each verified
before moving to the next — never batch multiple subsystems into one change)
--------------------------------------------------------------------------------
For each subsystem found in 0.5.1, replace using the equivalent Redis-free
pattern already established elsewhere in this project. Reuse an existing
real implementation where one already exists rather than writing a new one.

a) Rate limiting store → express-rate-limit's default in-memory store.
   Log explicitly: this makes limits per-process, not global across
   replicas, if this project ever runs more than one instance. State this
   as an accepted, known tradeoff — don't silently hide it.

b) Idempotency cache → the MongoDB-backed IdempotencyRequest collection
   pattern (confirm idempotencyMiddleware already has, or can be given, a
   non-Redis path — reuse it rather than building a parallel mechanism).

c) TokenVersion / session cache → an in-memory, short-TTL (~10s) fast-path
   cache (e.g. Map<userId, {version, expiresAt}>) checked before falling
   through to a Prisma read of the authoritative User.tokenVersion,
   invalidated immediately on logout / password reset / session revoke. If
   no real implementation of this exists yet (only described in docs),
   build the minimal real version — don't leave it as a doc-only concept.

d) JWT blacklist → the same in-memory pattern as (c), keyed by token
   jti/hash, TTL set to exactly (exp - now) so entries self-expire and never
   leak memory for tokens that would have expired anyway.

e) Bed-hold distributed lock (Redlock) → MongoDB optimistic locking via a
   lockExpiresAt timestamp comparison, using a single atomic conditional
   write (e.g. a findOneAndUpdate-style query that checks lockExpiresAt is
   null or in the past AS PART OF the same write) — not a read-then-write
   pattern, which would silently reintroduce the exact race condition
   Redlock existed to prevent in the first place.

f) OTP attempt counters / device-risk preauth step-up cache → a MongoDB
   record with an expiry field (TTL index or a checked expiresAt field),
   not an in-memory Map — these need to survive a process restart and be
   correct even before (c)/(d)'s in-memory caches have warmed up.

g) Socket.IO horizontal-scaling adapter (Redis pub/sub) → confirm the REAL
   current deployment topology first (single instance vs. multiple). If
   single instance: remove the Redis adapter and rely on Socket.IO's
   default in-memory adapter. If genuinely running multiple instances right
   now: STOP, do not remove this, and log it as BLOCKED — removing it
   without another real cross-instance broadcast mechanism will silently
   break real-time events for a subset of users, and that decision needs an
   explicit answer from the user, not a guess in either direction.

h) BullMQ job queue → only act on this if Phase 0.9 confirmed it's real and
   actually wired to a running worker. If so, this is the highest-risk item
   in this phase — do not rush it. The lowest-risk Redis-free replacement is
   a MongoDB-backed job table (status field + a simple polling worker) rather
   than trying to replicate BullMQ's retry/backoff semantics exactly.
   Explicitly test failure and retry behavior, not just the happy path,
   before marking this done. If it's aspirational (docs only, no real
   worker), just log that finding — do not build BullMQ's replacement for a
   feature that was never actually running.

i) Generic Redis-backed route response cache (if found) → either remove
   entirely (fall back to direct DB reads) or replace with a small
   in-memory TTL cache scoped to that one route only if its read load
   genuinely warrants it. Do not reintroduce Redis-level caching complexity.

--------------------------------------------------------------------------------
0.5.3 — DELETE DEAD REDIS CODE
--------------------------------------------------------------------------------
Once every subsystem from 0.5.1 is either replaced (0.5.2) or explicitly
logged as BLOCKED for a human decision:
  - Delete the actual Redis client initialization file(s).
  - Remove ioredis / node-redis / bullmq / redlock (if unused after 0.5.2h's
    resolution) from package.json, then run a fresh install to confirm the
    dependency tree no longer pulls them in at all.
  - Grep one final time for every 0.5.1 search term across the whole repo.
    The only acceptable remaining hits are in comments/docs explicitly
    describing the historical removal, or in AUDIT_EXECUTION_LOG.md itself.

--------------------------------------------------------------------------------
0.5.4 — UPDATE CONFIG TO MATCH REALITY (docs and .env excluded — see below)
--------------------------------------------------------------------------------
  - Remove REDIS_* entries from env.ts's validation schema if no code path
    requires them anymore.
  - Do NOT touch any real .env file — this remains covered by Hard
    Constraint #2. Instead, log the exact list of REDIS_* keys that are now
    safe for the user to manually delete from their own .env files / Render
    dashboard themselves.
  - Do not rewrite any architecture .md file as part of this phase (Hard
    Constraint #7). Just log, plainly, that these docs currently describe
    Redis-dependent architecture that no longer matches reality once this
    phase completes, so the user knows those docs need a separate
    regeneration pass and shouldn't be trusted for anything Redis-related
    until then.

--------------------------------------------------------------------------------
0.5.5 — VERIFICATION (must pass before this phase is marked DONE)
--------------------------------------------------------------------------------
  - Full backend build (`npx prisma generate && tsc -p tsconfig.build.json`,
    or the project's real build command) passes with zero Redis-related
    import/type errors.
  - Server boots successfully with no Redis connection attempt visible in
    startup logs.
  - Re-run Phase 2.1's route × middleware table specifically for every route
    whose rate limiter, idempotency check, or lock logic was touched in
    0.5.2 — confirm each still returns its correct success/failure envelope,
    not a crash, now that the backing store has changed for that route.
  - Specifically re-test concurrent bed-hold creation (two near-simultaneous
    requests for the same bed) to confirm the MongoDB optimistic-lock
    replacement from 0.5.2(e) actually prevents a double-booking. This is
    the one replacement in this phase with a real correctness property to
    verify, not just "does it fail to crash" — test it properly.

--------------------------------------------------------------------------------
0.5.6 — LOG ENTRY FORMAT FOR THIS PHASE
--------------------------------------------------------------------------------
Use the same per-item entry format as the rest of the Checkpoint Protocol —
one log entry per subsystem from 0.5.1's inventory, not one entry for the
whole phase. Each entry must show: what was found, which replacement pattern
was used (or why it was left BLOCKED), the exact verification command/test
run, and its real output. If 0.5.1 found zero Redis references anywhere,
write a single entry confirming that, set Redis removal status to
NOT_APPLICABLE, and move on to Phase 1.

================================================================================
PHASE 1 — ENVIRONMENT & CONFIGURATION AUDIT
================================================================================
1.1. Read backend/src/config/env.ts. Confirm every required variable is
     actually validated at startup (fails fast if missing), matches what's
     actually consumed elsewhere in the code (grep for process.env./env.
     usages that AREN'T in this schema — those are unvalidated, silent-failure
     risks), and that no variable is read in two different files with two
     different names for the same underlying config (a known-risk pattern
     given this project's CORS config alone has been rewritten at least 3
     different ways across doc revisions).
1.2. Confirm the fail-closed OTP_DEV_OVERRIDE guard actually exists in code
     (not just in a doc) — find the literal file and line, and confirm there
     is a passing test that exercises it (search for
     otpDevOverrideFailClosed.test.ts or equivalent; if it doesn't exist,
     that's a finding — the doc claims one exists).
1.3. Confirm CORS origin logic is genuinely a single source of truth used by
     both REST and Socket.IO (grep both call sites, confirm they import the
     same function/array, not two independently maintained lists).
1.4. If a Vercel-pattern CORS regex (`/^https:\/\/.*\.vercel\.app$/`) is
     present in code, confirm whether this project is actually deployed to
     Vercel anywhere, or whether this is leftover/speculative config that
     should be removed (dead permissive CORS rules are a real, if minor,
     attack-surface finding).
1.5. Log one entry per discrepancy found. Fix only what's unambiguous (e.g.
     a genuinely dead/unused env var reference); anything requiring a human
     decision (e.g. "should Vercel CORS actually be supported?") goes in the
     log as BLOCKED with the question spelled out, not guessed at.

================================================================================
PHASE 2 — MIDDLEWARE & SECURITY PIPELINE AUDIT
================================================================================
Using the REAL middleware order from Phase 0.6:
2.1. Confirm every mutating route (POST/PUT/PATCH/DELETE) across the entire
     real route inventory (Phase 0.7) actually carries validateCsrf,
     authenticate (where required), authorize(...) (where role-gated), and
     an appropriate rate limiter — build this as a literal table in the log,
     one row per route, with a checkmark or a finding for each missing piece.
     This is the single most valuable table in this whole audit — do not
     skip or sample it, cover every mutating route.
2.2. Confirm the CSRF comparison function is crash-proof (length/undefined
     guards before crypto.timingSafeEqual, catches thrown errors, returns a
     clean 403 rather than an unhandled exception).
2.3. Confirm rate limiter configuration doesn't silently depend on Redis if
     Phase 0/0.5 determined Redis is not live (a rate limiter configured for
     a RedisStore with no Redis connection is a guaranteed crash-on-first-hit
     bug, and matches the exact "POST works nowhere, GET works everywhere"
     symptom pattern this project has hit before).
2.4. Confirm idempotencyMiddleware's real storage backend and that it fails
     safe (never throws) on a cache-miss vs. a store-unreachable condition.
2.5. Confirm tenantMiddleware's real isolation logic — does every query that
     should be scoped to a PG/owner actually filter by tenant context, or
     are there routes that trust a client-supplied ID without cross-checking
     ownership? This is a real authorization-bypass class of bug worth
     explicitly checking on at least: property update/delete, resident
     directory, billing/invoices, complaint status updates.

================================================================================
PHASE 3 — AUTHENTICATION, SIGNUP & LOGIN FLOW — LIVE FUNCTIONAL TRACE
================================================================================
Using the REAL signup flow determined in Phase 0.8, trace and live-test
(not just read) the entire flow end to end, for both Owner and Resident:
3.1. Registration/first step: submit real test data, confirm a User record
     is actually created with the correct real Role enum value (from Phase
     0.2 — not any doc's guess at the enum), correct password hash, and
     correct initial status.
3.2. OTP: trigger phone + email OTP with OTP_DEV_OVERRIDE enabled in a
     non-production environment, confirm the override codes actually work,
     confirm a real OTP record is still written with real expiry (not
     bypassed entirely), confirm verify-otp actually flips
     phoneVerified/emailVerified.
3.3. Profile/business/KYC steps (whichever real steps exist per 0.8): submit
     real data, confirm it persists to the correct real models.
3.4. Property/room/bed creation (owner) or bed selection/hold (resident):
     confirm real inventory records are created/updated, confirm bed hold
     locking actually works under a simulated concurrent request (two
     near-simultaneous hold attempts on the same bed — confirm only one
     succeeds).
3.5. Agreement signing: confirm real PDF generation, confirm the SHA-256/
     HMAC signature hash is actually computed and stored, confirm the
     agreement status transitions correctly.
3.6. Payment step: confirm Razorpay order creation, and — without needing a
     real payment — confirm the webhook/verify signature-check logic is
     sound by unit-testing it against a known-good and a known-bad HMAC
     signature.
3.7. Session activation: confirm real JWT issuance (RS256, correct claims,
     correct tokenVersion), confirm the refresh cookie is set with the real
     (not documented) attributes, confirm Socket.IO connects and joins the
     correct rooms.
3.8. Login flow: test with correct credentials (success), wrong password
     (clean 401, not a crash), unverified account (correct block), and
     confirm the device-risk/FingerprintJS step doesn't hard-block a normal
     first-time login on a clean test device.
3.9. Refresh flow: confirm rotation actually invalidates the old token,
     confirm presenting an already-rotated (reused) refresh token actually
     triggers family revocation and tokenVersion bump — this is a security
     property worth actually testing, not just reading.
3.10. Log one entry per step, PASS or FAIL with the real observed behavior,
      not the expected/documented behavior.

================================================================================
PHASE 4 — DATABASE / SCHEMA / SEED CONSISTENCY AUDIT
================================================================================
4.1. KNOWN ISSUE TO RESOLVE FIRST — Open backend/prisma/schema.prisma and
     find the real field names on the Payment and MealSchedule models. Then
     fix prisma/seed.ts:
       - Around line 526: 'transactionId' is not a field on Payment. Either
         rename it to match the real field name on Payment, or remove it if
         no such field/concept exists on that model.
       - Around line 564: 'breakfast' is not a field on MealSchedule. Either
         rename it to match the real field/shape on MealSchedule (it may be
         nested inside a JSON field rather than a flat boolean), or remove
         it if it doesn't belong there.
     Do NOT modify schema.prisma unless the intended data genuinely needs a
     new field that doesn't exist yet — if so, add the field, generate a
     migration, and note this explicitly in the log rather than silently
     expanding the schema. After fixing, run:
       npx prisma generate && tsc -p tsconfig.build.json
     and paste the real output into the log as verification. This alone
     must pass before Phase 4 continues, since it currently blocks every
     deploy.
4.2. Beyond the two known lines, scan the REST of prisma/seed.ts the same
     way — for every model it writes to, diff the fields it sets against
     the real schema fields, and fix every mismatch found using the same
     rename-or-remove logic (never silently expand the schema).
4.3. Cross-check every Prisma model referenced by any service/repository
     file against schema.prisma for the same class of drift (a service
     calling `prisma.payment.create({ data: { someField } })` where
     someField doesn't exist would currently fail at compile time in
     TypeScript — but confirm there's no `any`-typed escape hatch anywhere
     hiding an equivalent runtime bug).
4.4. Confirm every `@@index` and `@unique` constraint claimed in any doc
     actually exists in schema.prisma — sparse-index handling for optional
     unique fields (residentCode, googleSubId, aadhaarNumber-equivalent) was
     previously flagged as a specific risk; confirm it's real.
4.5. Confirm every multi-document mutation that should be atomic (resident
     checkout + bed release, onboarding wizard steps, payment verify +
     invoice update) actually uses `prisma.$transaction([...])` in the real
     code, not just in the docs' description of it.

================================================================================
PHASE 5 — API ROUTE SURFACE CONSISTENCY AUDIT (frontend ↔ backend)
================================================================================
5.1. Using the REAL route inventory from Phase 0.7, cross-check against
     every frontend api.* call site (grep frontend/src/services/api.ts and
     every hook that calls it). For each frontend call: does a matching real
     backend route exist? Flag every orphaned frontend call (calls a route
     that doesn't exist — a guaranteed 404 in production) and every orphaned
     backend route (exists but nothing in the frontend calls it — not a bug,
     but worth noting as dead surface or an incomplete feature).
5.2. For every route flagged as a mismatch, determine and log which side is
     "real" (recently built, actively used) vs. "stale" (leftover from an
     earlier architecture revision) by checking git blame / file modify
     times, then fix the stale side to match — do not invent a third path.

================================================================================
PHASE 6 — REAL-TIME (SOCKET.IO) AUDIT
================================================================================
6.1. Confirm the real event catalog (grep every `io.emit`/`socket.emit` call
     site) against whatever doc claims to be authoritative — expect drift,
     document it.
6.2. Confirm Socket.IO CORS origin logic imports the same source as REST
     (Phase 1.3).
6.3. Confirm the WebSocket handshake auth failure path returns a clean
     disconnect, not a raw 400 (previously observed in production on this
     project).
6.4. If Phase 0/0.5 found Redis is NOT live: confirm there is no lingering
     assumption of a Redis-backed Socket.IO adapter for horizontal scaling —
     if the project ever runs more than one instance, cross-instance event
     delivery will silently fail. Document this as a known, accepted
     single-instance limitation if that's the current deployment reality —
     don't silently fix it by reintroducing Redis without being asked.

================================================================================
PHASE 7 — ASYNC INFRASTRUCTURE AUDIT (Redis / BullMQ / Outbox — final
confirmation after Phase 0.5)
================================================================================
7.1. Write a definitive statement in the log: is this project currently
     Redis-free, Redis-dependent, or in a state that Phase 0.5 has now fully
     resolved? Back this with file/line evidence, not doc quotes.
7.2. If Phase 0.5 was BLOCKED on anything (e.g. the Socket.IO adapter
     question in 0.5.2(g), or the BullMQ worker question in 0.5.2(h)),
     confirm those blocked items are still correctly logged and have not
     been silently worked around.
7.3. If BullMQ/OutboxService don't actually exist in code: note in the log
     that this is aspirational architecture, not implemented — do not build
     it as part of this audit unless a specific defect requires it; flag it
     as a gap for a separate, explicitly-scoped task instead.
7.4. If they DO exist and Phase 0.5.2(h) determined the worker should stay:
     confirm the queue actually has a running worker process wired up in
     server.ts (a BullMQ queue with no worker silently accumulates jobs
     forever with nothing processing them — a real and easy-to-miss bug).

================================================================================
PHASE 8 — THIRD-PARTY INTEGRATION AUDIT
================================================================================
8.1. Razorpay: confirm order creation and webhook/verify HMAC-SHA256 logic
     against real Razorpay docs' current signature format, confirm amounts
     are handled in paise (integer) not rupees (float) throughout to avoid
     floating-point drift.
8.2. Cloudinary: confirm signed-upload flow (if the "direct client-to-CDN"
     architecture from UPLOAD_ARCHITECTURE.md is real) actually generates
     time-limited signatures and doesn't expose the API secret to the
     client bundle.
8.3. Twilio / Brevo: confirm graceful failure behavior when either service
     is unreachable — does an SMS/email send failure block the entire
     signup transaction, or degrade gracefully with a retry/outbox path?
8.4. Google OAuth: confirm the callback URL registered with Google matches
     the real, current backend domain exactly (a stale callback URL from an
     earlier `pg-management-system-boxb.onrender.com` vs
     `pg-management-system.onrender.com` naming, which appears inconsistently
     across the docs you've shared, is worth checking directly).
8.5. SOAP /soap/billing (if Phase 0.10 confirms it's real): confirm the
     X-API-Key guard and XXE pre-filter actually exist and are exercised by
     at least one real test.

================================================================================
PHASE 9 — ERROR HANDLING & RESILIENCE AUDIT
================================================================================
9.1. Confirm globalErrorHandler is registered last, catches both sync throws
     and async rejections (verify an asyncHandler/catchAsync wrapper is
     applied to every controller method across every module, not just
     auth/payments — list any module missing it).
9.2. Confirm the full error-mapping table (ZodError, Prisma P2002/P2025,
     JsonWebTokenError, TokenExpiredError, CSRF errors, MulterError) is
     really implemented, with a fallback branch for anything unrecognized
     that still returns the standard envelope, never a raw Express error
     page.
9.3. Confirm production stack traces are masked in the response but always
     logged server-side with the request's correlation ID.

================================================================================
PHASE 10 — END-TO-END FUNCTIONAL PASS (every remaining feature)
================================================================================
For every module not already covered by Phase 3 (billing/invoices,
complaints, agreements beyond signing, tours/shortlist/applications,
messages, move-in, media upload, dashboard analytics, admin/settings/audit
logs): exercise the real route with both a valid and an invalid payload,
confirm the real response matches the standard envelope in both cases, and
log PASS/FAIL per route — not a blanket summary.

================================================================================
PHASE 11 — FINAL REPORT
================================================================================
Once every phase above shows DONE in the log with no remaining PENDING or
BLOCKED items (or every BLOCKED item has an explicit, human-readable
question logged for the user to answer), produce a top-of-file summary in
AUDIT_EXECUTION_LOG.md containing:
  - The final Ground Truth block (Phase 0), unchanged from when it was first
    verified, as the permanent record of what's actually real in this repo
  - A count of issues found, issues fixed, and issues blocked-pending-human-input
  - The full route × middleware coverage table from Phase 2.1
  - The full frontend↔backend route consistency table from Phase 5.1
  - Explicit confirmation of the seed.ts fix (Phase 4.1) and its passing
    build output
  - Explicit confirmation of the Redis removal (Phase 0.5) and what the
    real, current state is
  - Explicit confirmation that no .env file was modified and no git push
    occurred
  - A short "if you're picking this up next" note only if anything remains
    BLOCKED — otherwise state plainly that the audit is complete

Do not declare the project issue-free unless every phase's real test output
is captured in the log. A summary claim without the underlying verification
entries backing it is exactly the failure pattern this project has hit
before with its own self-authored reports — do not repeat it here.
