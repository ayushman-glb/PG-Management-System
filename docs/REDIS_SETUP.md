# RoomBae Enterprise SaaS — Production Redis & Docker Integration Guide

This document provides a comprehensive overview of the Redis 7 Alpine infrastructure, Docker deployment, backend services, caching mechanisms, token revocation, OTP lifecycle, distributed rate-limiting, real-time WebSocket scaling, and operational runbooks for RoomBae.

---

## 1. Architectural Topology

```text
                  ┌──────────────────────────────────────────────┐
                  │           Client Applications / SPA          │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             Nginx / Reverse Proxy            │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
     ┌────────────────────────────────────────────────────────────────────────┐
     │                      RoomBae Backend Service (Node.js)                   │
     │                                                                        │
     │  ┌───────────────────────┐ ┌───────────────────┐ ┌──────────────────┐ │
     │  │  Auth & Token Black-  │ │ Distributed Rate  │ │ HTTP Response    │ │
     │  │  list Middleware      │ │ Limiter Store     │ │ Cache Middleware │ │
     │  └───────────┬───────────┘ └─────────┬─────────┘ └────────┬─────────┘ │
     │              │                       │                    │           │
     │              └───────────────────┐   │   ┌────────────────┘           │
     │                                  ▼   ▼   ▼                            │
     │                         ┌───────────────────────────┐                 │
     │                         │ CacheService & RedisClient│                 │
     │                         └─────────────┬─────────────┘                 │
     └───────────────────────────────────────┼────────────────────────────────┘
                                             │ (TCP 6379 / TLS)
                                             ▼
     ┌────────────────────────────────────────────────────────────────────────┐
     │                       Docker Network: roombae-network                  │
     │                                                                        │
     │                         ┌───────────────────────────┐                 │
     │                         │     roombae-redis (7-Alpine)│                 │
     │                         │   - Memory: 256MB (LRU)   │                 │
     │                         │   - Persistence: AOF+RDB  │                 │
     │                         └───────────────────────────┘                 │
     └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & File Structure

```text
PG-Management-System/
├── docker/
│   └── redis/
│       └── redis.conf                 # Production Redis 7 configuration
├── docker-compose.yml                 # Master docker infrastructure with Redis, Mongo & Backend
├── docker-compose.prod.yml            # Production compose overrides (logging & restart policies)
├── docs/
│   └── REDIS_SETUP.md                 # This enterprise documentation
└── backend/
    ├── Dockerfile                     # Multi-stage production container build
    ├── .env.example                   # Baseline environment variables template
    ├── .env.development               # Development env with Redis configuration
    ├── .env.production                # Production env template
    └── src/
        ├── config/
        │   ├── env.ts                 # Zod validated env schema with Redis parameters
        │   └── redis.ts               # Singleton Redis client with lazy connect & exponential backoff
        ├── services/
        │   ├── cache.service.ts       # Full-featured CacheService with generics & memory fallback
        │   └── tokenBlacklistService.ts # Access token revocation blacklist
        ├── infrastructure/
        │   └── otp/
        │       └── RedisOtpService.ts # 5-min TTL OTP store with attempt counter & Mongo fallback
        ├── middleware/
        │   ├── authMiddleware.ts      # Token blacklist verification on incoming HTTP requests
        │   ├── rateLimiter.ts         # Distributed Redis sliding-window rate limiters
        │   └── cacheMiddleware.ts     # Route caching middleware with user isolation & bypass headers
        ├── socket/
        │   └── socketServer.ts        # Socket.IO initialization with Redis adapter support
        └── app.ts                     # Express app with real-time /health endpoint Redis ping probe
```

---

## 3. How Redis Works in RoomBae

### 3.1. High-Performance Caching (`CacheService`)

- Location: `src/services/cache.service.ts`
- **Features**: Automatic JSON serialization, `remember()` pattern, pattern invalidation (`invalidatePattern("pg:*")`), integer increment/decrement, and TTL inspection.
- **Failover Guarantee**: If Redis is offline or unreachable, `CacheService` seamlessly redirects reads and writes to a non-blocking in-memory store.

### 3.2. JWT Token Revocation & Blacklisting (`TokenBlacklistService`)

- Location: `src/services/tokenBlacklistService.ts`
- When a user logs out, their current JWT access token is stored in Redis under `jwt:blacklist:<token>` with a TTL equal to the token's remaining lifespan.
- `authMiddleware.ts` checks Redis on every authenticated API request. Revoked tokens are rejected immediately with `401 TOKEN_INVALIDATED`.

### 3.3. Refresh Token Session Management

- Location: `src/modules/auth/auth.service.ts`
- Active refresh tokens are saved in MongoDB and cached in Redis under `refresh_token:<hash>`.
- Token rotation and revocation clean up Redis cache entries instantly.

### 3.4. OTP Lifecycle & Security (`RedisOtpService`)

- Location: `src/infrastructure/otp/RedisOtpService.ts`
- 5-minute strict expiration (`OTP_TTL_SECONDS = 300`).
- Attempt counter key (`otp:...:attempts`) blocks requests exceeding 5 attempts within 10 minutes.
- Successful verification deletes both the OTP key and attempt counter to enforce single-use semantics.

### 3.5. Distributed Rate Limiting (`rateLimiter.ts`)

- Location: `src/middleware/rateLimiter.ts`
- Protects `/login`, `/register`, `/send-otp`, `/verify-otp`, `/upload`, and general API routes.
- Uses `DistributedRedisStore` with key namespaces (`rl:login:`, `rl:gen:`, `rl:upload:`), ensuring rate limits operate uniformly across multiple horizontally scaled backend containers.

### 3.6. WebSocket Scaling (Socket.IO Redis Adapter)

- Location: `src/socket/socketServer.ts`
- Leverages `@socket.io/redis-adapter` when Redis is active to broadcast real-time events across multiple backend workers.

---

## 4. Environment Variables

| Variable | Default Value | Description |
| --- | --- | --- |
| `REDIS_URL` | `redis://localhost:6379` | Full connection URI (auto-constructed if HOST/PORT supplied) |
| `REDIS_HOST` | `localhost` | Redis server hostname (`roombae-redis` in Docker) |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | `""` | Password authentication string |
| `REDIS_TLS` | `"false"` | Set to `"true"` for encrypted Cloud Redis connections |
| `CACHE_TTL` | `"3600"` | Default cache TTL in seconds (1 hour) |
| `SESSION_TTL` | `"86400"` | Default session TTL in seconds (24 hours) |

---

## 5. Docker Infrastructure Setup

### 5.1. Running Local Stack with Docker Compose

```bash
# Build and launch all services in background
docker-compose up -d --build

# View Redis container logs
docker-compose logs -f redis

# Execute redis-cli inside container
docker-compose exec redis redis-cli -a roombae_secure_redis_password_2026 ping
```

### 5.2. Production Deployment Command

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 6. Health & Diagnostic Probes

Requesting `GET /health` returns:

```json
{
  "success": true,
  "status": "UP",
  "version": "1.0.0",
  "environment": "production",
  "uptimeSeconds": 1420,
  "redis": {
    "status": "CONNECTED",
    "latencyMs": 2,
    "readyState": true
  },
  "mongodb": {
    "provider": "mongodb",
    "status": "CONNECTED",
    "latencyMs": 5
  }
}
```

---

## 7. Operational Runbook & Common CLI Commands

### 7.1. Basic Redis Commands

```bash
# Connect to Redis CLI with password
redis-cli -a <REDIS_PASSWORD>

# Check connectivity
127.0.0.1:6379> PING
PONG

# View memory usage & metrics
127.0.0.1:6379> INFO memory

# List all keys matching a pattern
127.0.0.1:6379> KEYS "jwt:blacklist:*"
127.0.0.1:6379> KEYS "rl:*"

# Inspect remaining TTL of a key
127.0.0.1:6379> TTL "otp:email:user@example.com"
```

### 7.2. Backup & Restore

- **Backup**: Redis is configured with `appendonly yes` and periodic snapshot saving (`save 900 1`). Persistent files (`appendonly.aof` and `dump.rdb`) are saved in Docker volume `roombae-redis-data`.

```bash
# Force manual snapshot write to disk
docker-compose exec redis redis-cli -a <REDIS_PASSWORD> BGSAVE
```

- **Restore**: Mount the `roombae-redis-data` volume into a replacement Redis container; Redis automatically reloads AOF and RDB files on startup.

---

## 8. Security & Best Practices

1. **Authentication**: Redis is protected with `--requirepass` in production.
2. **Network Isolation**: Redis is attached exclusively to the internal bridge network `roombae-network` and is not exposed to the public internet.
3. **Memory Eviction**: Configured with `maxmemory-policy allkeys-lru` to automatically evict least recently used keys when memory limit (256MB) is reached, preventing OOM crashes.
