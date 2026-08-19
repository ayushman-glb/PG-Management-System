# Redis Production-Hardening Prompt — RoomBae Backend — For Antigravity / Gemini Coding Agent

You are hardening the existing Redis implementation in this project **in place**. Redis stays.
You are not removing it, not replacing it with MongoDB, and not changing which subsystems use
it. You are fixing eight specific correctness/security gaps identified in a prior audit.

---

## 0. Non-negotiable constraints

1. **Do not modify any `.env` file.** You may *read* new env vars if a fix genuinely requires
   one (e.g. `REDIS_REQUIRED`), but if a new var is needed, list it explicitly in your final
   report instead of writing it into `.env` yourself — I will add it.
2. **Do not touch unrelated modules.** Every change in this prompt is scoped to the files
   listed under each phase. If a fix requires touching a file not listed, stop and tell me
   before proceeding.
3. **Work in the phases below, in order, as separate commits/steps.** After each phase,
   produce a short status note (what changed, which files, any risk) before moving to the
   next phase. Do not batch all phases into one giant diff.
4. **Do not introduce a new dependency without flagging it first** (e.g. if you want a Lua
   scripting helper library beyond what `redis` v4's `EVAL`/`defineCommand`-equivalent already
   supports). Prefer using the existing `redis` client's built-in `eval`/script capabilities.
5. **Preserve all existing external behavior** (API responses, status codes, header names like
   `X-Cache`) unless a phase explicitly says to change it. This is a hardening pass, not a
   feature or API-contract change.
6. At the end of all phases, produce a single Markdown file at
   `docs/redis-hardening-phases.md` documenting what was done in each phase, for future
   reference — mirroring the format of this prompt.

---

## Phase 1 — Hash tokens before using them as Redis keys

**Files:** `backend/src/services/tokenBlacklistService.ts`,
`backend/src/middleware/authMiddleware.ts`, `backend/src/modules/auth/auth.service.ts`,
anywhere else a raw JWT or raw OTP/refresh token is interpolated directly into a Redis key
string.

- Change every key of the form `jwt:blacklist:<token>` to `jwt:blacklist:<sha256(token)>`.
  Use Node's built-in `crypto.createHash("sha256").update(token).digest("hex")` — same
  pattern already used for OTP/refresh-token hashing elsewhere in the codebase, so match that
  existing convention/helper if one already exists (check `RedisOtpService.ts` for a reusable
  hash utility before writing a new one).
- Update every **write** site (logout, token revocation) and every **read/check** site
  (`authMiddleware`'s blacklist check) to hash the token the same way before building the key.
- Audit `refresh_token:<tokenHash>` in `auth.service.ts` — confirm it already hashes (the name
  implies it does) and that the hash algorithm is SHA-256 or stronger, not something weaker or
  reversible.
- Grep the whole `backend/src` tree for any other Redis key template literal that embeds a
  variable which could contain a raw secret/token/password, and apply the same fix.
- Confirm no logging statement (Winston/Morgan/console) anywhere near these call sites logs the
  raw token value. If one does, redact it.

## Phase 2 — Atomic rate-limit increment + expire

**File:** `backend/src/middleware/rateLimiter.ts` (`DistributedRedisStore`)

- Replace whatever two-step `INCR` + `EXPIRE` sequence currently exists in the `increment()`
  method with a single atomic Lua script executed via the Redis client's `eval`/script
  capability:

  ```lua
  local current = redis.call("INCR", KEYS[1])
  if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return current
  ```

- Pass the window size (in seconds) as `ARGV[1]`, the rate-limit key as `KEYS[1]`.
- This must guarantee: on the very first hit for a key, the TTL is set in the same atomic
  operation as the increment — no window where a key exists without an expiry.
- Do not change the existing per-route limits (`loginLimiter`: 5/15min, `registerLimiter`:
  5/1hr, `sendOtpLimiter`: 3/10min, `phoneVerifyLimiter`: 10/15min, `generalApiLimiter`:
  100/15min) — only the underlying atomicity of the counter mechanism changes.
- Add a small internal utility script (can live under `backend/src/scripts/` — not run
  automatically, just available for me to run manually) that scans `rl:*` keys and reports any
  with `TTL == -1` (no expiry) — this is the signature of the old bug having already occurred.
  Do not wire this into the app's runtime; it's a one-off diagnostic script.

## Phase 3 — Safe cache invalidation + cache stampede protection

**Files:** `backend/src/services/cache.service.ts`, `backend/src/middleware/cacheMiddleware.ts`

**3a. `invalidatePattern(pattern)`:**

- Replace any "collect all matching keys via SCAN, then issue one large/unbounded DEL" pattern
  with: `SCAN` in cursor-based batches (COUNT ~100–500 per iteration), and delete each batch
  immediately using `UNLINK` (non-blocking reclaim) instead of `DEL`, pipelined within the
  batch.
- Add a hard cap (e.g. 10,000 keys) on how many keys a single `invalidatePattern` call will
  delete before it logs a warning and stops, so a broad/mistaken pattern can't turn into an
  unbounded full-keyspace scan.

**3b. `remember<T>(key, ttlSeconds, fetcher)` stampede protection:**

- On a cache miss, before calling `fetcher()`, attempt to acquire a short-lived lock:
  `SET lock:<key> 1 NX PX 5000` (5-second auto-expiring lock — never can deadlock).
- If the lock is acquired: call `fetcher()`, write the result via `SET key value EX
  ttlSeconds`, then delete the lock.
- If the lock is **not** acquired (another request is already repopulating this key): either
  (a) poll the cache key a couple of times with a short delay and return it once populated, or
  (b) if a stale previous value is still readable, return that instead of hitting the
  underlying fetcher — pick whichever fits the existing return-type contract of `remember()`
  with the least disruption to callers, and note which you chose in your phase status report.
- Do not change the public signature of `remember()` — this is an internal implementation
  change only.

## Phase 4 — Explicit, non-silent Redis-down behavior in production

**Files:** `backend/src/config/redis.ts`, `backend/src/services/cache.service.ts`,
`backend/src/middleware/rateLimiter.ts`, `backend/src/infrastructure/otp/RedisOtpService.ts`

- Introduce a `REDIS_REQUIRED` env var (boolean-style string, e.g. `"true"`/`"false"`) — read
  it via the existing config-loading pattern used elsewhere in this project (do not invent a
  new config-loading style). If it's not set in `.env`, treat it as `false` (dev-safe default)
  and tell me in your final report that I should set it to `true` in production's `.env`.
- **When `REDIS_REQUIRED=true` (production) and Redis is unreachable:**
  - Rate limiter and OTP service must **not** silently fall back to a private in-memory `Map`.
    Instead: OTP service falls back to the existing MongoDB `OtpToken` collection (this
    fallback already exists per the prior audit — just make sure it's actually reachable and
    used when Redis is down, not only when Redis was never configured).
    Rate limiter should fail closed in a way that's safe, not silently ineffective — e.g. serve
    a `503` on rate-limited routes if neither Redis nor a Mongo-backed counter is available,
    rather than admitting unlimited traffic. Only implement a Mongo-backed rate-limit fallback
    if this doesn't require inventing new schema without my sign-off — if it does, stop and
    ask me first rather than designing new persistence on your own.
  - General route/query cache (`CacheService`, `cacheMiddleware`) MAY continue to use the
    existing in-memory `Map` fallback even in production — this subsystem is disposable by
    design and the "silent divergence across instances" risk here is low-severity, unlike
    rate-limiting/OTP/blacklist.
- **When `REDIS_REQUIRED=false` (dev/local):** keep all existing fallback behavior exactly as
  it is today.
- Whenever any subsystem falls back away from Redis (regardless of `REDIS_REQUIRED`), emit a
  structured log line at `warn` or `error` level (not just `console.log`) so it's visible in
  whatever logging/monitoring is already wired up (check for existing Winston usage and match
  its format) — don't just print to stdout.

## Phase 5 — Tie blacklist TTL to actual configured token expiry

**Files:** `backend/src/services/tokenBlacklistService.ts`, wherever `JWT_ACCESS_EXPIRATION` (or
equivalent config value) is currently read.

- Replace the hardcoded `900` (or whatever literal is currently used) for blacklist entry TTL
  with a value derived from the actual configured access-token expiration
  (`config.JWT_ACCESS_EXPIRATION`, parsed to seconds — reuse whatever expiry-parsing utility
  already exists in this codebase for JWT signing; do not write a second one).
- Add a unit test (place alongside existing tests, matching this project's existing test
  structure/framework) asserting: blacklist TTL set at revocation time is always `>=` the
  actual remaining lifetime of the specific token being revoked (not just `>=` the full
  configured expiry — a token revoked 10 minutes before its own expiry only needs ~10 more
  minutes of blacklist TTL, not the full window; deriving from the token's own `exp` claim is
  more precise than deriving from config, so decode the token being revoked and compute
  `exp - now` as the TTL, falling back to the full configured expiry only if `exp` can't be
  read).

## Phase 6 — Separate disposable cache from security-critical keys; set eviction policy

**Files:** `backend/src/config/redis.ts`, deployment/infra config (document, don't assume you
can change the actual managed Redis provider's dashboard setting yourself).

- Determine whether the current Redis provider (check `REDIS_URL`/provider docs referenced in
  the project, e.g. Render/Upstash/Redis Cloud) supports multiple logical DBs (`SELECT`) or
  only a single DB (common on free/managed tiers).
- **If multiple logical DBs are available:** route disposable cache/route-cache keys to one DB
  index and security-critical keys (rate-limit counters, OTP, blacklist, refresh-token session
  cache) to a separate DB index, via two client configs or `client.select(n)` at the start of
  each relevant service. Document which DB index holds what in `docs/redis-hardening-phases.md`.
- **If only a single DB is available:** don't invent a workaround — instead, document in your
  final report that `maxmemory-policy` needs to be set at the provider level (I will do this
  manually in the dashboard/config, not you) to `noeviction` if there's memory headroom, or at
  minimum flag that eviction risk remains for security-critical keys on this tier, and suggest
  I consider a separate low-cost Redis instance for the security-critical subset if this
  matters enough to me.
- Do not attempt to programmatically change `maxmemory-policy` from application code unless
  the current hosting setup clearly allows `CONFIG SET` (many managed providers block this) —
  check first and tell me what you find rather than assuming.

## Phase 7 — Validate TLS/URL configuration at startup

**File:** `backend/src/config/redis.ts`

- Before establishing the connection, parse the configured `REDIS_URL` (or `REDIS_HOST`/
  `REDIS_PORT` fallback) and compare its scheme (`redis://` vs `rediss://`) against the
  `REDIS_TLS` flag.
- If they disagree — e.g. `REDIS_TLS=true` with a `redis://` URL, or `REDIS_TLS=false`/unset
  with a `rediss://` URL — throw a clear, specific startup error naming both conflicting
  values (e.g. `"REDIS_TLS=true but REDIS_URL uses redis:// (expected rediss://) — check your
  environment configuration"`). Fail fast at boot, don't let it reach a runtime crash-loop.
- Apply the same validation to the `REDIS_HOST`/`REDIS_PORT` fallback path if `REDIS_URL`
  isn't set.
- This must not change behavior when the configuration is actually consistent — only add the
  validation, don't alter the working connection logic otherwise.

## Phase 8 — Observability additions

**Files:** wherever the existing health/metrics endpoint is defined (locate it — likely
`backend/src/server.ts` or a dedicated routes file referenced in the prior audit's mention of
k8s health/ready/live/metrics endpoints).

- Extend the existing health/metrics endpoint (do not create a second one) to report:
  - Redis connection status (already exists per `isRedisReady()`/`pingRedis()` — just surface
    it if not already exposed there).
  - Cache hit/miss counters for the route-cache middleware (simple in-process counters are
    fine, reset on restart — no need for persistence).
  - Current count of `rl:*`, `otp:*`, and `jwt:blacklist:*` keys (via `SCAN` count, not a
    blocking `KEYS *`).
- Keep this addition lightweight — no new external monitoring dependency, just data exposed on
  the existing endpoint for whatever's already scraping it.

## Phase 9 — Verification checklist (do this last, report results)

- [ ] Confirm no raw token/secret ever appears in a Redis key name anymore (grep audit).
- [ ] Confirm rate-limit keys always have a TTL under load-test/manual test (increment a
      counter, immediately check `TTL` in Redis CLI or via the diagnostic script from Phase 2).
- [ ] Confirm `invalidatePattern` with a broad pattern against a large test keyset doesn't
      block the event loop noticeably (basic timing check is enough, not a full benchmark).
- [ ] Confirm concurrent cache-miss requests for the same key don't all hit MongoDB
      simultaneously (log/count fetcher invocations under a simple concurrent test).
- [ ] Confirm killing/pausing Redis locally with `REDIS_REQUIRED=true` causes rate-limited
      routes to fail closed (503) rather than silently allowing unlimited traffic, and that
      OTP requests fall back to MongoDB correctly.
- [ ] Confirm a revoked token's blacklist TTL matches its actual remaining `exp` at the moment
      of revocation, not a flat constant.
- [ ] Confirm the startup TLS/URL mismatch check actually throws when values disagree (test
      with an intentionally mismatched local `.env.test` — do not touch the real `.env`).
- [ ] Confirm the health/metrics endpoint now reports the new fields without breaking its
      existing response shape for anything already consuming it.

Report back anything in this spec that conflicts with what you actually find in the codebase,
instead of silently resolving the conflict yourself — especially in Phase 4 and Phase 6 where
you're explicitly told to stop and ask before inventing new persistence/config.
