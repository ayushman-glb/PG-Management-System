# 🐳 RoomBae Docker & Valkey/Redis Architecture

This document provides clear guidelines for local containerized development and explains the separation between local Valkey/Redis containers and Render-managed production Redis.

---

## 🏗️ Architecture & Component Overview

```text
Local Development (Host / Docker)
┌─────────────────────────────────────────────────────────────┐
│ Workflow A: Full Docker Stack                               │
│  • app (Dockerfile.dev -> ts-node-dev hot reload, Port 5000)│
│  • redis (valkey/valkey:8, Port 6379)                       │
│  • Atlas MongoDB (cloud connection via DATABASE_URL)        │
│                                                             │
│ Workflow B: Hybrid Development (Fastest DX)                 │
│  • Node.js process runs natively on Host (npm run dev)      │
│  • Redis runs in Docker (docker compose up redis -d)        │
└─────────────────────────────────────────────────────────────┘

Production Deployment (Render)
┌─────────────────────────────────────────────────────────────┐
│  • Backend Web Service: Render-managed Node runtime         │
│  • Key-Value Store: roombae-redis (Valkey 8 with TLS)       │
│  • Secrets & Config: Set via Render Environment Dashboard   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Local Development Workflows

### Workflow 1: Full Docker Stack (App + Redis Containerized)

Use this workflow to run both the backend API and the Valkey/Redis store in isolated Docker containers with hot-reload volume mounts.

```bash
# Build and start all services in foreground
docker compose -f docker-compose.dev.yml up --build

# Or run in detached background mode
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker compose -f docker-compose.dev.yml logs -f app

# Stop containers
docker compose -f docker-compose.dev.yml down
```

- **App URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`
- **Internal Networking**: Inside Docker, `app` connects to Valkey via `redis:6379`.

---

### Workflow 2: Hybrid (Redis in Docker + Node.js on Host)

Use this workflow for the fastest local development feedback loop with local debugging.

```bash
# 1. Start only the Valkey/Redis container in the background
docker compose -f docker-compose.dev.yml up redis -d

# 2. Verify Redis container is healthy
docker ps --filter "name=roombae-redis-dev"

# 3. Start backend on host (from ./backend directory)
cd backend
npm run dev
```

- **Host Networking**: The backend reads `.env.development` and connects to `localhost:6379` with the configured password.
- **In-Memory Fallback**: If Redis is not started, the application automatically falls back to an active in-memory cache and Redlock simulator without crashing.

---

### 🧪 Verification & Audit Script

To verify your local Redis connection independently of the web server:

```bash
cd backend
npx ts-node scripts/testRedisDevPipeline.ts
```

---

## 🔒 Production Redis Notice

- **Managed Service**: Production uses Render Key-Value (`roombae-redis`, Valkey 8).
- **Security & TLS**: Connections strictly require TLS (`rediss://` scheme and `REDIS_TLS=true`).
- **Configuration Files**: `.env.production` is a read-only source of truth; all production secrets are injected via the Render Environment Dashboard. Docker Compose files are never used in production on Render.

---

## 🛠️ Process Lifecycle & Port Management (Windows / Cross-Platform)

### 1. Automated Stale Port Clearing (`predev` & `prebuild`)

- **Root Cause**: On Windows, when `ts-node-dev` is terminated via `SIGINT` (Ctrl+C), orphaned background `node.exe` worker processes can occasionally hold locks on port 5000/5001 or on Prisma query engine binary DLLs (`node_modules/.prisma/client/query_engine-windows.dll.node`).
- **Solution**: Cross-platform npm pre-hooks (`predev` and `prebuild`) invoke `kill-port 5000 5001` before starting the server or generating binaries.
- **Watcher Configuration**: `dev` script explicitly ignores `node_modules` (`--ignore-watch node_modules`) to avoid open file descriptors on compiled engines.

### 2. Resilient Prisma Generation (`scripts/generate-with-retry.js`)

- `npm run build` and `npm run prisma:generate` wrap `prisma generate` in an exponential retry loop (up to 3 attempts with 1.5s delay) to gracefully absorb transient Windows OS file-rename locks during fast reload/rebuild cycles.
