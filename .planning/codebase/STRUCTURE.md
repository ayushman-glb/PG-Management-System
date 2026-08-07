# Directory Structure & Layout

**Analysis Date:** 2026-08-07

## Repository Root Layout
```
PG Management system2/
├── .agents/                 # Local GSD agents, skills, and runtime configurations
├── .github/                 # Workflows & CI/CD pipelines
├── backend/                 # Node.js + Express + Prisma Backend Service
│   ├── prisma/              # Prisma schema & seed scripts
│   ├── src/                 # Backend source files
│   │   ├── __tests__/       # Integration and unit tests
│   │   ├── config/          # Environment & service configurations
│   │   ├── controllers/     # Controller implementations
│   │   ├── middlewares/     # Auth, rate-limit, and security middlewares
│   │   ├── modules/         # Modular route domain handlers
│   │   ├── services/        # Third-party & helper services
│   │   ├── tests/           # Dedicated test suites
│   │   ├── utils/           # Utility functions & PDF/QR generators
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point
│   └── Dockerfile           # Backend container build specification
├── frontend/                # React 19 + Vite + Tailwind v4 Frontend App
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── app/             # Application providers & layout routes
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature modules (billing, owners, residents, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and WebSocket client services
│   │   ├── stores/          # Zustand state stores
│   │   ├── types/           # Shared TypeScript interfaces
│   │   └── utils/           # Helper functions
│   └── vite.config.ts       # Vite build configuration
├── docs/                    # Architectural & integration documentation
├── k8s/                     # Kubernetes deployment manifests
├── docker-compose.yml       # Docker compose orchestration
├── nginx.conf               # Reverse proxy configuration
└── package.json             # Root monorepo script orchestrator
```

## Key Code Locations
- **Backend Entry Point**: `backend/src/server.ts`
- **Backend App Config**: `backend/src/app.ts`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Frontend Entry Point**: `frontend/src/main.tsx` & `frontend/src/App.tsx`
- **Frontend State**: `frontend/src/stores/`
- **Documentation**: `README.md`, `AUTH_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md`, `CLOUDINARY_SETUP.md`

---
*Codebase analysis: 2026-08-07*
