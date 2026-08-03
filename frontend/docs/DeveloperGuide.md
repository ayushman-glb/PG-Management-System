# RoomBae Developer Guide

## 1. Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Build Verification
```bash
cd frontend
npm run build
```

### Backend Setup
```bash
cd backend
npm install
npm run build
```

---

## 2. Coding Guidelines

1. **Path Aliases**: Always use standardized path aliases (e.g. `@features/residents`, `@components/ui/Button`, `@services/auth.service`) instead of relative paths (`../../../../`).
2. **Domain Isolation**: Place feature-specific UI, pages, and hooks inside `src/features/[domain]/`.
3. **State Management**:
   - Use **Zustand** (`@store/useUIStore`) for global UI drawer/modal toggles.
   - Use **Apollo Client / React Query** for server state.
   - Use **Context** only for global scope tree values (e.g., `ThemeProvider`, `NavigationProvider`).
4. **Form Validation**: Define Zod schemas in `@schemas/` and infer TypeScript types using `z.infer<typeof schema>`.
5. **Route Access**: Protect routes using `@guards/RouteGuard`, `@guards/RoleGuard`, or `@guards/PermissionGuard`.
