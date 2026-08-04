# RoomBae PG Management System — Fix Plan

## Critical: Live Backend DB Auth

- [ ] Update `DATABASE_URL` in Render dashboard with correct MongoDB Atlas credentials (user action)
- [ ] Verify backend connects to MongoDB after env update

## Code Fixes

- [ ] Fix route mismatch: frontend `/properties/owner/summary` → backend `/properties/owner-summary`
- [ ] Add aggregate `/owners/onboard` endpoint that OwnerService.runFullOnboarding calls
- [ ] Fix signup flow so "Next Step" works without phone OTP/strong password blocking
- [ ] Make dashboard fully dynamic (pull from API instead of hardcoded metrics)
- [ ] Add owner data entry for building/floor/beds/sharing and user details
- [ ] Add graceful fallback when DB is unreachable (show demo data, log warning)
- [ ] Ensure all API calls match backend routes

## Verification

- [ ] Frontend build passes
- [ ] Backend tsc passes
- [ ] Test live API endpoints
