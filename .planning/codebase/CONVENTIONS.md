# Coding Conventions & Development Guidelines

**Analysis Date:** 2026-08-07

## Naming Conventions
- **Files & Directories**:
  - React components: PascalCase (e.g. `OwnerOnboardingWizard.tsx`, `PayRentModal.tsx`)
  - Controllers, Services, Utils: camelCase (e.g. `billingController.ts`, `cloudinary.service.ts`, `QrCodeService.ts`)
  - Test files: `.test.ts` / `.spec.ts` suffix inside `__tests__/` or `tests/`
- **Variables & Functions**: camelCase for variables, functions, and methods; PascalCase for Types, Interfaces, and Classes; UPPER_SNAKE_CASE for constants.

## TypeScript Practices
- **Strict Mode**: `tsconfig.json` configured with strict type checks (`noEmit: true` on check).
- **Schema Validation**: Zod schemas used for API payload validation on backend endpoints and frontend forms.
- **Type Imports**: Explicit `import type { ... }` where applicable.

## Error Handling
- **Centralized Error Handling**: Express global error handler middleware catching unhandled errors and formatting standard JSON error payloads.
- **Custom Error Classes**: Standardized HTTP exception handlers with appropriate status codes (400, 401, 403, 404, 500).

## Code Style & Formatting
- **Frontend Code Formatting**: Configured with `oxfmt` (`npm run format` in `frontend`).
- **Imports Grouping**: Third-party modules first, followed by internal absolute or relative path imports.

---
*Codebase analysis: 2026-08-07*
