# 00 — Legacy Project Context & Domain Summary

## 1. Project Background
RoomBae is an enterprise multi-tenant Coliving and Paying Guest (PG) property management ecosystem designed to streamline:
- PG and property onboarding, multi-floor hierarchies, rooms, and bed allocations.
- Resident discovery, geo-location search, filtering, and room applications.
- Booking lifecycle management with real-time Kanban state transitions.
- Multi-tier Owner SaaS subscriptions (₹1,499 for 4 PGs, ₹2,499 for 10 PGs, ₹4,999 for 20 PGs).
- Automated monthly rent schedules, GST (18%) invoicing, late fine calculations, and Razorpay/Manual payment verifications.
- Bi-party digital lease agreements with digital signatures (drawn, typed, uploaded) and PDF document generation.
- Two-party complaint management with resident acknowledgment and admin escalation.
- Resident move-out checkout workflows with deposit reconciliation and bed release.
- Device security with FingerprintJS, 2FA email OTP, and primary device transfer protocols.

## 2. Legacy Issues & Motivations for Rebuild
1. **Authentication Architecture**:
   - Mixed token storage strategies and insecure fallbacks.
   - Inconsistent session models across OAuth, standard email, and phone logins.
   - Broken token versioning and device verification edge cases.
2. **GraphQL and Obsolete Adapters**:
   - Unused or fragmented GraphQL schemas coexisting with REST endpoints causing cognitive overhead.
   - Incomplete controller/service separation in several backend modules.
3. **Database Consistency**:
   - Massive, un-normalized Prisma schema with overlapping models and unverified relationships.
   - Direct Prisma calls in controllers bypassing service and domain validations.
4. **Mocked/Hardcoded Business Data in Frontend**:
   - UI components relying on static dummy arrays for analytics, beds, and PG details.
   - Incomplete state synchronization after payment or booking state transitions.
5. **Deployment Configuration Inconsistencies**:
   - Legacy GitHub Pages frontend deployment scripts and outdated Render configurations with obsolete URLs.

## 3. Purpose of this Context Preservation
This legacy-context suite captures all valuable domain models, rate structures, tax calculation rules, and operational requirements so that the new architecture can be built cleanly from scratch without losing critical business logic.
