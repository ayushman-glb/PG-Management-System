# RoomBae PG Management System — Deployment Guide

---

## 1. Environment Preparation

Before deploying RoomBae to production:

1. **Node.js**: Ensure Node.js `>=18.0.0` (tested on `v24.19.0`) is installed on host servers.
2. **MongoDB Atlas**: Provision a MongoDB replica set cluster (required by Prisma for `$transaction` support).
3. **Environment Variables**: Configure `.env.production` files in both `frontend` and `backend`.

---

## 2. Docker & Multi-Container Deployment

Run the included `docker-compose.yml` configuration:

```bash
# Build and start container services in detached mode
docker compose up -d --build
```

### Services Orchestrated

- **Backend Container**: Express app running on port `5000`.
- **MongoDB Container**: MongoDB `7.0` running replica set `rs0` on port `27017`.
- **Redis Container**: Redis `7.2` caching service running on port `6379`.
- **Nginx Container**: Reverse-proxy and SSL termination handling frontend client & API routing.

---

## 3. Kubernetes Deployment (`k8s/`)

Deploy using Kubernetes manifests:

```bash
kubectl apply -f k8s/deployment.yaml
```

---

## 4. GitHub Actions CI/CD Pipeline

The `.github/workflows/ci.yml` pipeline automatically performs:

1. TypeScript static analysis & typecheck (`tsc --noEmit`).
2. Frontend production build (`vite build`).
3. Backend production build (`tsc -p tsconfig.build.json`).
4. Automated unit and integration test execution.
