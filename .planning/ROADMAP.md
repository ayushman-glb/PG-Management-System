# RoomBae PG Management System — GSD Roadmap

## Active Milestone: Full System Rebuild (v2.0)

## Phase Overview & Dependencies

| P# | Phase Title | Objective | Depends On | Est. Effort |
|----|-------------|-----------|------------|-------------|
| 0 | Repository Discovery | Inspect entire repo, map architecture, identify problems | none | done |
| 1 | Existing System Audit | Audit all subsystems, identify broken/incomplete/dead code | Phase 0 | medium |
| 2 | Requirements & Business Logic Reconstruction | Reconstruct business requirements, map flows, document intended behavior | Phase 0 | medium |
| 3 | Architecture & GSD Planning | Finalize architecture, create API design, DB design, security plan | Phase 1, 2 | medium |
| 4 | Database / Prisma Reconstruction | Audit & fix Prisma schema, migrations, seeds | Phase 3 | large |
| 5 | REST API Architecture | Establish clean REST architecture, remove GraphQL | Phase 3, 4 | large |
| 6 | Authentication & Authorization | JWT, OAuth, OTP, RBAC, cookie security | Phase 3, 4, 5 | large |
| 7 | Third-Party Integrations | Cloudinary, Razorpay, Email, Redis config | Phase 5, 6 | medium |
| 8 | Core Backend Modules | Property, Room, Bed, Resident, Owner, Complaint modules | Phase 5, 6, 7 | xlarge |
| 9 | Frontend Architecture | Clean up entry, routing, providers, state, services | Phase 5, 6 | large |
| 10 | Design System | Unified design tokens, component library, theme | Phase 9 | medium |
| 11 | Complete UI Rebuild | Rebuild all pages with design system | Phase 9, 10 | xlarge |
| 12 | API Integration | Wire frontend to real REST APIs | Phase 8, 11 | large |
| 13 | Payments & Billing | Razorpay orders, webhooks, refunds, invoices | Phase 8, 12 | large |
| 14 | Documents / PDF / Uploads | PDF generation, file uploads, downloads | Phase 8, 12 | large |
| 15 | Notifications / Realtime | Socket.IO events, real-time updates | Phase 8, 12 | medium |
| 16 | Analytics | Real data analytics from database | Phase 8, 12 | medium |
| 17 | Security Hardening | Full security audit, fix vulnerabilities | Phase 6, 8, 13 | medium |
| 18 | Performance Optimization | Bundle, queries, caching, lazy loading | Phase 11, 14 | medium |
| 19 | Automated Testing | Unit + integration tests for backend | Phase 8, 5 | large |
| 20 | E2E Testing | End-to-end flow verification | Phase 19, 12 | medium |
| 21 | Documentation | Sync all docs with final implementation | Phase 23 | medium |
| 22 | Production Verification | Build, deploy, verify all endpoints | Phase 19, 21 | medium |
| 23 | Final Full-System Audit | Independent re-audit, FINAL_AUDIT_REPORT.md | Phase 22 | large |

## Phase 0 — Repository Discovery
- **Status**: completed
- **Deliverables**: Full codebase mapping, inventory of files, documentation review

## Phase 1 — Existing System Audit
- **Status**: in-progress
- **Objective**: Audit every subsystem, identify broken/incomplete/dead code, GraphQL usage, mock data, console logs
- **Tasks**:
  - Audit backend modules, routes, controllers, services, middleware
  - Audit frontend entry points, pages, components, hooks, services
  - Identify all GraphQL references and remove
  - Identify all hardcoded mock data and replace with real functionality
  - Identify duplicate/stub files in frontend
  - Identify broken imports and circular dependencies
  - Document all findings
- **Deliverables**: AUDIT_REPORT.md

## Phase 2 — Requirements & Business Logic Reconstruction
- **Status**: pending
- **Objective**: Reconstruct the complete business domain and user flows
- **Tasks**:
  - Map all user roles (SUPER_ADMIN, ADMIN, OWNER, MANAGER, STAFF, RESIDENT, PUBLIC)
  - Map all business entities from Prisma schema
  - Document Resident flow: Register → Verify → Login → Dashboard → Profile → PG → Room → Bed → Agreement → Rent Payment → Invoice → Complaint → Notification → Logout
  - Document PG Owner flow: Register → Verify → Login → PG Management → Rooms → Beds → Residents → Agreements → Payments → Invoices → Complaints → Analytics → Refunds → Logout
  - Document Auth flow: Register → OTP → Verification → Login → OAuth → Logout → Password Reset
  - Document Payment flow: Create Payment → Razorpay → Verification → Webhook → Database → Invoice → Analytics
  - Document Security Deposit flow: Resident Leaves → Eligibility → Owner Refund → Payment Provider → Webhook → Database → Notification
- **Deliverables**: REQUIREMENTS.md, BUSINESS_LOGIC.md

## Phase 3 — Architecture & GSD Planning
- **Status**: pending
- **Objective**: Finalize architecture, create design docs
- **Tasks**:
  - Update ARCHITECTURE.md with final architecture
  - Create API_DESIGN.md (REST-only, no GraphQL)
  - Create DATABASE_DESIGN.md (Prisma/MongoDB)
  - Update SECURITY.md
  - Update TESTING.md
  - Update DEPLOYMENT.md
  - Create/update UI_UX.md
  - Update INTEGRATIONS.md
  - Create IMPLEMENTATION_STATUS.md
- **Deliverables**: All architecture and design documents

## Phase 4 — Database / Prisma Reconstruction
- **Status**: pending
- **Objective**: Audit and fix Prisma schema, ensure migrations work
- **Tasks**:
  - Audit Prisma schema for data model correctness
  - Verify sparse indexes for optional unique fields
  - Audit cascade behavior, foreign keys, indexes
  - Ensure seed data works
  - Fix any schema issues
- **Deliverables**: Fixed schema.prisma, working seeds

## Phase 5 — REST API Architecture
- **Status**: pending
- **Objective**: Clean REST API architecture, remove GraphQL
- **Tasks**:
  - Remove GraphQL references from env.ts and swagger.ts
  - Standardize response structure
  - Ensure proper HTTP methods, status codes, validation
  - Add pagination, filtering, sorting, searching
  - Create/update API_DESIGN.md
- **Deliverables**: Clean REST API architecture

## Phase 6 — Authentication & Authorization
- **Status**: pending
- **Objective**: Full auth system audit and fix
- **Tasks**:
  - Fix hardcoded OTP verification (currently always passes with "123456")
  - Fix hardcoded email verification (currently always returns success)
  - Audit JWT token generation, verification, rotation
  - Audit cookie security (httpOnly, secure, sameSite)
  - Audit RBAC for all routes
  - Fix role escalation defense in register
  - Ensure no frontend-only auth
- **Deliverables**: Working auth system

## Phase 7 — Third-Party Integrations
- **Status**: pending
- **Objective**: Audit and finish all integrations
- **Tasks**:
  - Cloudinary: configuration, initialization, error handling
  - Razorpay: order creation, webhook verification, refunds
  - Brevo SMTP: email service, templates, error handling
  - Google OAuth: passport config, callback handling
  - Redis: connection, cache, locks
  - Firebase: if used
- **Deliverables**: Working integrations

## Phase 8 — Core Backend Modules
- **Status**: pending
- **Objective**: Audit and rebuild all backend modules
- **Tasks**:
  - Properties: CRUD, search, amenities
  - Rooms: room management, transfers
  - Beds: inventory, holds, assignment
  - Residents: directory, KYC, status history
  - Owners: onboarding, KYC, business
  - Complaints: tickets, status, replies
  - Agreements: contracts, signatures
  - Billing: invoices, payments
  - Search: multi-entity search
  - Analytics: real data
  - Notifications: real-time + history
  - Tours, Applications, Messages, Move-in
- **Deliverables**: Working backend modules

## Phase 9 — Frontend Architecture
- **Status**: pending
- **Objective**: Clean up frontend architecture
- **Tasks**:
  - Remove duplicate files (root pages/stubs, root components stubs)
  - Clean up vite.config.ts (figma plugins)
  - Fix routing (client-side state routing is fine, but ensure consistent navigation)
  - Update providers, hooks, services
  - Remove @graphql path alias
  - Fix theme system
- **Deliverables**: Clean frontend architecture

## Phase 10 — Design System
- **Status**: pending
- **Objective**: Single coherent design system
- **Tasks**:
  - Consolidate Tailwind tokens
  - Unified color palette
  - Component library (Button, Card, Input, Modal, Avatar, Badge, etc.)
  - Typography system
  - Spacing system
  - Animation system (consolidate to Framer Motion)
  - Loading/skeleton system
- **Deliverables**: Design system docs, reusable components

## Phase 11 — Complete UI Rebuild
- **Status**: pending
- **Objective**: Rebuild all UI from ground up with design system
- **Tasks**:
  - Landing page
  - Dashboard
  - Properties listing/details
  - Residents directory
  - Billing/invoices
  - Complaints
  - Analytics
  - Resident portal
  - Resident register
  - Auth pages
  - Operations pages
  - All content pages
- **Deliverables**: Complete UI

## Phase 12 — API Integration
- **Status**: pending
- **Objective**: Wire frontend to real REST APIs
- **Tasks**:
  - Replace all mock/fake data with real API calls
  - Fix API response handling
  - Implement proper error/empty/loading states
  - Fix all API service modules
- **Deliverables**: Frontend ↔ Backend API integration

## Phase 13 — Payments & Billing
- **Status**: pending
- **Objective**: Working payment system
- **Tasks**:
  - Razorpay order creation (real, not mock order IDs)
  - Payment verification (server-side, with signature)
  - Webhook handling (HMAC verification)
  - Invoice PDF generation
  - Payment status tracking
  - Late fees
  - Refunds
- **Deliverables**: Working payment system

## Phase 14 — Documents / PDF / Uploads
- **Status**: pending
- **Objective**: PDF generation, file uploads
- **Tasks**:
  - Invoice PDF generation (real data)
  - Agreement PDF generation
  - Receipt PDF generation
  - KYC document handling
  - File upload pipeline (Multer → Sharp → Cloudinary)
  - MIME validation
  - Security scanning
- **Deliverables**: Working PDF/upload system

## Phase 15 — Notifications / Realtime
- **Status**: pending
- **Objective**: Socket.IO real-time events
- **Tasks**:
  - Socket connection, auth, rooms
  - Real-time notifications
  - Event cleanup
  - Memory leak prevention
- **Deliverables**: Working realtime system

## Phase 16 — Analytics
- **Status**: pending
- **Objective**: Real analytics from database
- **Tasks**:
  - Replace hardcoded analytics with DB queries
  - Revenue, occupancy, residents, PG performance
  - Complaints, refunds, collection status
  - Trend charts
- **Deliverables**: Real analytics

## Phase 17 — Security Hardening
- **Status**: pending
- **Objective**: Full security audit
- **Tasks**:
  - Secrets management
  - JWT security
  - Cookie security
  - CORS, CSRF
  - XSS, injection prevention
  - Rate limiting
  - Password hashing
  - Helmet/security headers
  - Error leakage prevention
  - ID enumeration prevention
- **Deliverables**: SECURITY.md, security audit complete

## Phase 18 — Performance Optimization
- **Status**: pending
- **Objective**: Optimize performance
- **Tasks**:
  - Frontend: bundle size, lazy loading, image optimization, caching
  - Backend: N+1 queries, indexes, pagination, connection pooling
  - Network: payload size, compression, caching headers
- **Deliverables**: PERFORMANCE.md

## Phase 19 — Automated Testing
- **Status**: pending
- **Objective**: Comprehensive test suite
- **Tasks**:
  - TypeScript checks
  - ESLint
  - Backend: unit tests, integration tests, API tests
  - Frontend: component tests, service tests
  - Database tests
- **Deliverables**: TESTING.md, passing tests

## Phase 20 — E2E Testing
- **Status**: pending
- **Objective**: End-to-end flow verification
- **Tasks**:
  - Resident flow E2E
  - PG Owner flow E2E
  - Auth flow E2E
  - Payment flow E2E
  - Security deposit flow E2E
- **Deliverables**: E2E tests passing

## Phase 21 — Documentation
- **Status**: pending
- **Objective**: Sync all docs with implementation
- **Tasks**:
  - Update PROJECT.md, REQUIREMENTS.md, ROADMAP.md
  - Update ARCHITECTURE.md, API_DESIGN.md, DATABASE_DESIGN.md
  - Update SECURITY.md, TESTING.md, DEPLOYMENT.md
  - Update UI_UX.md, INTEGRATIONS.md, IMPLEMENTATION_STATUS.md
  - Update README
- **Deliverables**: Updated documentation

## Phase 22 — Production Verification
- **Status**: pending
- **Objective**: Verify production builds
- **Tasks**:
  - Frontend production build
  - Backend production build
  - API base URL, CORS, cookies, proxy
  - Database connection
  - Static assets, uploads
  - OAuth callbacks, payment callbacks/webhooks, email
  - Realtime connections
- **Deliverables**: Production verified

## Phase 23 — Final Full-System Audit
- **Status**: pending
- **Objective**: Independent re-audit of everything
- **Deliverables**: FINAL_AUDIT_REPORT.md

---

## Quality Gates (per phase)

Each phase must pass before advancing:
- [ ] Implementation complete
- [ ] TypeScript checks pass
- [ ] Lint passes
- [ ] Tests pass (where applicable)
- [ ] Security checked
- [ ] Performance checked
- [ ] UI checked (where applicable)
- [ ] Documentation updated
