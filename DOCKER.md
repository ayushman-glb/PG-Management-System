# 🐳 RoomBae Docker Ecosystem & Container Architecture

This document provides a comprehensive reference for how, where, and why **Docker** and containerization are utilized across the RoomBae ecosystem. It covers project file structures, multi-stage build workflows, development stacks, production images, and Nginx reverse proxy configurations.

---

## 1. Project Docker File Structure

All Docker assets are organized logically across the root, backend, frontend, and dedicated infrastructure directories:

```text
PG-Management-System/
├── docker-compose.dev.yml          # Root development container orchestration
├── docker/
│   └── nginx.conf                  # Production reverse proxy template (SPA + API + WebSockets)
│
├── backend/
│   ├── Dockerfile                  # Multi-stage production container build (non-root runner)
│   ├── Dockerfile.dev              # Development container with hot reload & Prisma generation
│   ├── .dockerignore               # Ignores node_modules, dist, logs, and local env files
│   └── src/
│       └── server.ts               # Production backend server with native in-memory caching
│
└── frontend/
    ├── Dockerfile                  # Multi-stage container (Vite build -> Nginx Alpine runner)
    ├── nginx.conf                  # Nginx configuration for SPA routing & /api/ reverse proxy
    └── .dockerignore               # Ignores node_modules, dist, and build caches
```

---

## 2. Container Architecture & Connection Topology

```
                                  [ Browser / Client ]
                                           │
                                           │ Port 80 / 5173
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │       Frontend Container (Nginx Alpine)          │
                 │   • Serves React Single Page App (try_files)     │
                 │   • Reverse Proxies /api/  ─► http://backend:5000│
                 │   • Reverse Proxies /socket.io/ ─► WebSocket     │
                 └─────────────────────────┬────────────────────────┘
                                           │
                        roombae-dev-network│(Bridge DNS: 127.0.0.11)
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │      Backend Container (Node 20 Alpine)          │
                 │   • Express REST API Server (Port 5000)          │
                 │   • Socket.IO WebSocket Engine                   │
                 │   • In-Memory Fast Cache & Rate Limiting         │
                 └─────────────────────────┬────────────────────────┘
                                           │
                                           │ External Cloud Connection
                                           ▼
                                ┌─────────────────────────────────┐
                                │   MongoDB Atlas (Cloud Cluster) │
                                │ • DATABASE_URL Connection       │
                                │ • Prisma ORM Client             │
                                └─────────────────────────────────┘
```

---

## 3. Dockerfiles Breakdown

### A. Backend Production Image (`backend/Dockerfile`)
Built using a hardened, **3-stage multi-stage build** adhering to zero-trust production security principles:

1. **Stage 1 (`deps`)**: Installs only production dependencies (`npm ci --omit=dev`) with native Alpine build tools (`python3`, `make`, `g++`).
2. **Stage 2 (`builder`)**: Installs full dependencies, compiles TypeScript source tree (`npm run build`), and generates Linux-compatible Prisma Client query engines (`npx prisma generate`).
3. **Stage 3 (`runner`)**: 
   - Minimal Node.js 20 Alpine base.
   - Runs as an unprivileged system user (`roombae:nodejs`, UID 1001) rather than `root`.
   - Copies only compiled `dist/`, production `node_modules/`, and generated `.prisma` engines.
   - Includes automatic healthcheck probe: `wget --spider http://localhost:5000/health`.

### B. Backend Development Image (`backend/Dockerfile.dev`)
Optimized for developer experience and instantaneous feedback:
- Runs `npm run dev` with volume mounts mapped to the host filesystem.
- Includes `curl` and `openssl` for health check diagnostics and key generation.
- Generates Prisma client bindings automatically upon container launch.

### C. Frontend Production Image (`frontend/Dockerfile`)
Multi-stage build converting React/Vite source code into static assets served via Nginx:
1. **Stage 1 (`builder`)**: Ingests build-time ARGs (`VITE_API_BASE_URL`, `VITE_APP_ENV`), installs packages, and compiles production bundles with Vite (`npm run build`).
2. **Stage 2 (`runner`)**: 
   - Minimal `nginx:alpine` image.
   - Copies compiled `dist/` into `/usr/share/nginx/html`.
   - Injects custom `nginx.conf` supporting SPA HTML5 history routing and dynamic upstream reverse proxying.

---

## 4. Reverse Proxy & Network Routing (`nginx.conf`)

The Nginx configuration located at `frontend/nginx.conf` and `docker/nginx.conf` manages reverse proxy routing between the frontend client and backend API container:

- **Single Page Application Routing**:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
- **REST API Reverse Proxy**:
  Proxies all `/api/` traffic to the backend container alias (`http://backend:5000`):
  ```nginx
  location /api/ {
      set $backend_upstream http://backend:5000;
      proxy_pass $backend_upstream;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```
- **WebSocket Socket.IO Upgrade Proxy**:
  Maintains persistent bi-directional WebSocket tunnels with `Connection "Upgrade"`:
  ```nginx
  location /socket.io/ {
      set $backend_socket http://backend:5000;
      proxy_pass $backend_socket;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_read_timeout 86400;
  }
  ```

---

## 5. Development Orchestration (`docker-compose.dev.yml`)

The root `docker-compose.dev.yml` orchestrates the local stack on the bridge network `roombae-dev-network`:

### Services Defined:

1. **`app` (Backend API Server)**:
   - **Build Context**: `./backend/Dockerfile.dev`
   - **Ports**: `5000:5000`
   - **Live Volume Sync**: Mounts `./backend` to `/app` while preserving container-native `/app/node_modules` and `/app/dist`.
   - **Healthcheck**: Queries `curl -f http://localhost:5000/live` every 15 seconds.

---

## 6. How to Run & Work with Docker

```bash
# 1. Build and launch backend service in container
docker compose -f docker-compose.dev.yml up --build

# 2. Or run in background detached mode
docker compose -f docker-compose.dev.yml up -d --build

# 3. Stream backend container logs
docker compose -f docker-compose.dev.yml logs -f app

# 4. Stop and tear down containers
docker compose -f docker-compose.dev.yml down
```

---

## 7. Summary of Ports & Network Endpoints

| Service | Container Port | Host Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (Nginx)** | `80` | `80` / `5173` | HTTP / WS | Web UI, SPA routing, Reverse proxy |
| **Backend API** | `5000` | `5000` | HTTP / WS | Express REST API, SOAP ERP, Socket.IO |
| **MongoDB Atlas** | Cloud | Cloud | TCP / TLS | Database persistence layer |
