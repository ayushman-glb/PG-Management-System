# Technical Debt & Area Concerns

**Analysis Date:** 2026-08-07

## Security & Environment Concerns
- **Fallback Secret Values**: Some environment files or fallback logic contain default fallback keys for development (e.g. JWT secrets or fallback URLs). Production deployments must strictly enforce populated `.env` values.
- **CORS Allowed Origins**: Ensure `frontendUrl.ts` strict origin checking is enabled in staging/production environments to prevent wildcard access.

## Codebase & Refactoring Opportunities
- **Frontend Test Suite**: The frontend currently lacks an automated component test suite (e.g., Vitest or React Testing Library). Adding unit/integration tests for critical user flows (e.g. `OwnerOnboardingWizard`, `PayRentModal`) will increase confidence.
- **Duplicated Test Folders**: Both `backend/src/__tests__/` and `backend/src/tests/` exist. Standardizing on `backend/src/__tests__/` will improve organization.

## Performance & Scalability Considerations
- **Media Upload Processing**: Sharp image optimization and Cloudinary uploads should be offloaded to a background worker queue (e.g. BullMQ with Redis) for large bulk file uploads.
- **WebSocket Connection Scaling**: Scaling Socket.io across multiple backend container instances requires Redis Pub/Sub adapter setup (`@socket.io/redis-adapter`).

---
*Codebase analysis: 2026-08-07*
