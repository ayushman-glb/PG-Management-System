# RoomBae Full-Stack Repair & Feature Completion — Progress Tracker

## Phase 1 — Fix Critical API & Connection Issues

- [x] 1. Fix `useAuth.ts` token mismatch (read `accessToken` not `token`)
- [x] 2. Fix `property.service.ts` `getOwnerSummary` → `/properties/owner-summary`
- [x] 3. Fix `/auth/me` backend to return valid current user (remove 404)
- [x] 4. Fix analytics frontend paths to match backend

## Phase 2 — Fix Registration (Signup) Flow

- [x] 5. Fix `Auth.tsx` so "Next Step" works in demo mode
- [x] 6. Ensure register→login→navigate flow works end-to-end

## Phase 3 — Fix Owner Onboarding

- [x] 7. Add `runFullOnboarding` to `owner.service.ts`
- [x] 8. Add aggregate `/owners/onboard` backend endpoint

## Phase 4 — Make Owner Data Entry Fully Functional

- [x] 9. Build working "Add Property" flow (building, floors, beds, sharing, user details)

## Phase 5 — Make Analytics & Operations Dynamic

- [x] 10. Backend analytics aggregating from DB + wire frontend Analytics
- [ ] 11. Wire Rooms/Beds/Visitors/Notifications to live backend data

## Phase 6 — Seed Data & DB Push

- [x] 12. Create seed demo-data file (JSON/TS)
- [ ] 13. Push to DB so live frontend shows real data

## Phase 7 — Verify & Build

- [ ] 14. Run frontend build, backend build, check CORS, verify endpoints
