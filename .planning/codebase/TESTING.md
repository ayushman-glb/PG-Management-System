# Testing Architecture & Patterns

**Analysis Date:** 2026-08-07

## Test Framework & Tools
- **Runner**: Jest `^30.4.2` with `ts-jest` `^29.4.12`
- **HTTP Assertions**: Supertest `^7.2.2` for testing Express endpoints.
- **Location**: `backend/src/__tests__/` and `backend/src/tests/`

## Running Tests
To run backend tests:
```bash
cd backend
npm test
```

## Mocking & Isolation Strategy
- Database isolation via mock Prisma client or test DB seeds (`prisma/seedDemoData.ts`).
- Supertest used to execute REST endpoints directly against the Express `app` instance without needing a live external HTTP port listening.
- Environment variables injected via `dotenv` in test setup fixtures.

## Test Coverage Priorities
1. **Authentication & Authorization**: `auth.test.ts` (Login, registration, JWT validation, Google OAuth flow).
2. **Frontend Config & URL handling**: `frontendUrl.test.ts`.
3. **Billing & Rent Payment**: Invoice generation and payment processing validations.

---
*Codebase analysis: 2026-08-07*
