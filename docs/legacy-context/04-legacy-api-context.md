# 04 — Legacy API Context & Route Inventory

## 1. REST API Routing Architecture
All routes are mounted under the versioned prefix `/api/v1/*`.

### Key Domain Routes:
1. **Auth & Identity** (`/api/v1/auth`):
   - `POST /register/resident` — Resident signup with OTP dispatch
   - `POST /register/owner` — Owner signup with OTP dispatch
   - `POST /verify-otp` — Phone/Email OTP validation
   - `POST /login` — Multi-credential authentication
   - `POST /verify-2fa` — Step-up email OTP verification
   - `POST /refresh-token` — Token rotation
   - `POST /logout` — Invalidate session and revoke refresh tokens
   - `GET /me` — Current user profile & permissions
   - `POST /device/transfer-primary` — Primary device transfer

2. **Owner Subscriptions** (`/api/v1/subscriptions`):
   - `GET /plans` — Retrieve available subscription tiers
   - `POST /create-order` — Create Razorpay subscription order
   - `POST /verify` — Verify Razorpay payment and activate subscription
   - `GET /my-subscription` — Active plan status, usage limits, renewal date

3. **PG & Inventory Management** (`/api/v1/pgs`, `/api/v1/rooms`, `/api/v1/beds`):
   - `POST /pgs` — Create PG listing (triggers `PENDING_ADMIN_VERIFICATION`)
   - `GET /pgs/owner` — List owner properties
   - `POST /pgs/:id/floors` — Add floor
   - `POST /floors/:id/rooms` — Add room
   - `POST /rooms/:id/beds` — Add bed
   - `PATCH /beds/:id/status` — Update bed status (Maintenance / Available)

4. **Resident Search & Discovery** (`/api/v1/search`):
   - `GET /pgs` — Public geo-search with radius, filters (gender, sharing, AC, food, price), pagination
   - `GET /pgs/:id` — Detailed public PG profile

5. **Bookings & Kanban** (`/api/v1/bookings`):
   - `POST /apply` — Resident room/bed application
   - `GET /owner-kanban` — Owner booking cards grouped by state
   - `PATCH /:id/status` — State machine transition (Accept / Reject)
   - `POST /:id/allocate` — Transaction-safe room & bed allocation
   - `POST /:id/room-change` — Room change request workflow

6. **Billing, GST & Payments** (`/api/v1/billing`, `/api/v1/payments`):
   - `GET /invoices/resident` — Resident rent bills & dues
   - `POST /payments/razorpay/order` — Create payment order
   - `POST /payments/razorpay/webhook` — Idempotent webhook handler
   - `POST /payments/manual` — Submit manual payment proof (UTR, screenshot)
   - `PATCH /payments/manual/:id/verify` — Owner verification of manual payment
   - `GET /invoices/:id/receipt` — Download PDF receipt

7. **Agreements & Signatures** (`/api/v1/agreements`):
   - `GET /:id` — Fetch agreement contract details
   - `POST /:id/sign` — Sign agreement (resident/owner)
   - `GET /:id/pdf` — Download signed agreement PDF

8. **Complaints** (`/api/v1/complaints`):
   - `POST /` — Submit complaint to PG owner
   - `GET /` — List complaints
   - `PATCH /:id/status` — Status transition (Acknowledge, Resolve)
   - `PATCH /:id/acknowledge-resolution` — Resident resolution confirmation / reopen

9. **Admin Console** (`/api/v1/admin`):
   - `GET /overview` — Platform metrics & system health
   - `GET /pgs/queue` — Pending PG verification queue
   - `PATCH /pgs/:id/verify` — Approve / Reject / Request changes
   - `GET /users` — Manage residents and owners
   - `GET /kyc/queue` — Owner & resident KYC reviews
   - `GET /audit-logs` — Immutable audit trail
