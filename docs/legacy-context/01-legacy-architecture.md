# 01 — Legacy Architecture Context

## 1. High-Level Legacy Topological Model
The legacy system attempted a multi-tiered architecture:
- **Frontend Tier**: React 19 SPA built with Vite, Tailwind CSS, Lucide icons, Framer Motion, Zustand state management, and custom in-memory auth tokens.
- **Backend Tier**: Express.js REST API with partial GraphQL adapters, TypeScript, Winston logging, Helmet, CORS, and Express rate-limiters.
- **Data Access Layer**: Prisma ORM targeting a MongoDB Atlas ReplicaSet.
- **Realtime Layer**: Socket.IO for event distribution (bed updates, complaints, notifications).
- **External Integrations**: Razorpay (payments/subscriptions), Cloudinary (media), Twilio (SMS/phone OTP), Gmail SMTP (email notifications/2FA OTP).

## 2. Legacy Deficiencies & Anti-Patterns
1. **Layer Bleed & Fat Controllers**:
   - Several controllers directly executed Prisma database queries instead of routing through application services and repositories.
   - Domain invariants (such as double-booking prevention and bed availability checks) were enforced inconsistently.
2. **GraphQL Overhead**:
   - Legacy GraphQL schemas duplicated REST functionality without complete CRUD support.
3. **Session & Token Fragility**:
   - Discrepancies between JWT cookies, authorization headers, and in-memory tokens caused 401/403 race conditions during page refreshes and multi-tab use.
4. **Direct Client Coupling**:
   - Frontend features frequently assumed implicit backend state or fell back to static mock data when API responses were incomplete.
