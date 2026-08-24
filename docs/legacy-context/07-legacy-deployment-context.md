# 07 — Legacy Deployment Context

## 1. Legacy Environments
The repository previously had mixed deployment artifacts:
- **GitHub Pages**: `gh-pages` deployment configured in frontend `package.json`, pointing to `https://ayushman-glb.github.io/PG-Management-System/`.
- **Render**: Backend deployment scripts targeting `https://pg-management-system-boxb.onrender.com`.
- **Docker**: Dockerfiles for dev and prod containerization (`Dockerfile`, `Dockerfile.dev`, `docker-compose.dev.yml`).

## 2. Rebuild Strategy for Deployment
- **Active Environment**: Development (`NODE_ENV=development`, local Node.js + Express backend on port `5000`, Vite frontend dev server on port `5173`).
- **Pruned Items**:
  - Deprecated GitHub Pages deployment scripts.
  - Obsolete hardcoded Render production URLs in code.
- **Future Production Target**:
  - Frontend $\rightarrow$ Vercel.
  - Backend $\rightarrow$ Dedicated containerized production service.
  - Database $\rightarrow$ MongoDB Atlas ReplicaSet.
  - Configurable origin URLs via environment variables (`CLIENT_URL`, `API_BASE_URL`).
