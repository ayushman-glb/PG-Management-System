# 🖥️ RoomBae Comprehensive Frontend UI & UX Design Specification (`FRONTEND_UI_DESIGN.md`)

> **Architectural Specification & Visual Design Blueprint** for the RoomBae React 19 + Vite 6 + TypeScript Single Page Application (SPA).

---

## 📋 Executive Overview

**RoomBae** is an ultra-luxury, high-performance Paying Guest (PG) & Co-Living Management Web Application. The frontend architecture relies on a **component-driven design system** powered by **Tailwind CSS v4**, **Framer Motion**, **GSAP 3**, **Lenis Smooth Scroll**, and **Lucide React**.

This document outlines the detailed UI/UX specification for every single page, component, design token, motion primitive, loading skeleton, form interaction, modal overlay, and responsive breakpoint.

---

## 🎨 1. Global Visual Language & Design System

### 1.1 Color Engine & Palette System
RoomBae replaces cold industrial SaaS aesthetics with warm, inviting luxury tones:

#### Light Theme (`Warm Sand & Luxury Amber`)
- **Canvas Background (`--color-lux-bg`)**: `#FFF8F2` — Soft warm cream.
- **Surface / Sidebar (`--color-lux-surface`)**: `#F8EEE5` — Warm neutral container fill.
- **Card Fills (`--color-lux-card`)**: `#FFFDFB` — Elevated card background.
- **Primary Gold Accent (`--color-lux-accent`)**: `#D9A87C` — Primary CTAs, active highlights.
- **Secondary Bronze Accent (`--color-lux-accent2`)**: `#C58B63` — Hover states, gradient endpoints.
- **High-Contrast Text (`--color-lux-text`)**: `#3B2A24` — Deep espresso brown.
- **Secondary Text (`--color-lux-text2`)**: `#6E5A52` — Muted labels, subtitles.
- **Structural Borders (`--color-lux-border`)**: `#E6D7CA` — Subtle 1px dividers.

#### Dark Theme (`Espresso Charcoal & Gold`)
- **Dark Canvas (`--color-dark-bg`)**: `#1D1B1A` — Dark charcoal canvas.
- **Dark Surface (`--color-dark-surface`)**: `#2B2725` — Dark container surface.
- **Dark Cards (`--color-dark-card`)**: `#332D2B` — Elevated dark card fill.
- **Gold Accent (`--color-dark-accent`)**: `#C89A4B` — Metallic gold highlights.
- **Dark Text (`--color-dark-text`)**: `#F7F3EE` — Warm off-white body copy.
- **Dark Borders (`--color-dark-border`)**: `#4A443F` — Muted dark dividers.

---

## 📐 2. Page-by-Page Detailed UI Breakdown

---

### Page 1: Landing & Discovery Page (`Landing.tsx`)
- **Purpose**: Public marketing showcase and PG discovery experience.
- **Hero Section**:
  - Rotating keyword typewriter effect using `TypedText.tsx` ("Luxury Living", "Effortless Booking", "Smart PG Management").
  - Hero background grid with dynamic cursor parallax glow (`.hero-bg-parallax`).
  - Dual CTAs: Primary gradient button ("Explore PGs") and secondary outline button ("Owner Portal").
  - Live statistics pillars (Total Residents, Partner PGs, Cities) featuring `AnimatedCounter`.
- **Feature Showcase**: 6-card interactive grid (`SpotlightCard`) with cursor tracking radial spotlight effect.
- **Interactive Pricing Matrix**: 3 tier cards (Basic, Professional, Enterprise) with monthly/annual toggle pill.
- **Testimonials Carousel**: Framer Motion staggered customer review cards with gold star ratings.

---

### Page 2: Public PG Listing & Search (`PGListing.tsx`)
- **Purpose**: Public PG search, geo-location distance filtering, and price exploration.
- **Search Header**: Location input with auto-detect button, city selector dropdown (Bengaluru, Mumbai, Delhi-NCR, Hyderabad), and rent range slider (₹5,000 - ₹35,000/mo).
- **Filter Bar**: Gender pills (`Men's`, `Women's`, `Co-Living`), Room types (`Single`, `Double`, `Triple`), Amenities (`Wi-Fi`, `AC`, `3x Meals`, `Gym`, `Biometric Access`).
- **Property Grid**: 4-column responsive card grid rendering:
  - Property thumbnail carousel with image badges.
  - Occupancy indicator pill (`AnimatedBadge`).
  - Rent price tag (`₹12,500/mo onwards`).
  - Distance badge (`1.2 km from Indiranagar Metro`).

---

### Page 3: Property Details View (`PGDetails.tsx`)
- **Purpose**: Detailed single PG property showcase and visit booking.
- **Media Gallery**: Masonry layout with main hero image and 4 secondary grid thumbnails with lightbox preview.
- **Room Breakdown Grid**: Interactive floor-by-floor room selector. Selecting a room expands bed availability (e.g. Room 204 - Bed A: Occupied, Bed B: Available).
- **Amenities List**: Icon grid showcasing high-speed Wi-Fi, laundry, 3-tier security, gaming lounge, and daily housekeeping.
- **Schedule Visit Modal**: Modal dialog with date picker, time slot selection (Morning, Afternoon, Evening), and contact form.

---

### Page 4: Owner Management Dashboard (`Dashboard.tsx`)
- **Purpose**: Central control hub for PG owners.
- **Header Summary**: Owner greeting, current date, and active property selector dropdown.
- **Metrics Grid**: 4 `SpotlightCard` stat widgets:
  1. Total MRR (Monthly Recurring Revenue) with month-over-month trend % tag.
  2. Occupancy Rate % with visual progress ring.
  3. Total Residents (Active vs Move-In Pending).
  4. Pending Dues & Unresolved Complaints count.
- **Charts Section**: Recharts Area Chart for revenue collection trends & Pie Chart for room occupancy distribution.
- **Quick Action Bar**: Buttons for "Add Property", "Onboard Resident", "Collect Rent", "Issue Gate Pass".

---

### Page 5: Property & Room Management (`Properties.tsx`)
- **Purpose**: Manage properties, room configurations, and bed matrix.
- **Property Cards**: Multi-property list displaying property address, total rooms, total beds, and GSTIN.
- **Add Property Modal**: 3-step wizard (Basic Info, Amenities & Location, Room & Bed Grid Generator).
- **Room Matrix Grid**: Floor accordion (`1st Floor`, `2nd Floor`, `3rd Floor`) expanding room cards with bed allocation status pills.

---

### Page 6: Operations & Inventory Matrix (`Operations.tsx`)
- **Purpose**: High-density operational inventory control.
- **Bed Status Matrix**: Visual grid representing every bed across properties.
- **Status Legends**:
  - 🟢 `AVAILABLE` (Green halo pill).
  - 🔴 `OCCUPIED` (Red filled pill with tenant name tooltip).
  - 🟡 `LOCKED_FOR_BOOKING` (Amber pulse tag).
  - ⚪ `MAINTENANCE` (Grey muted tag).
- **Quick Re-allocation**: Drag-and-drop or select-to-move bed allocation control.

---

### Page 7: Resident Directory (`Residents.tsx`)
- **Purpose**: Complete resident master directory.
- **Search & Filter**: Search by resident name, resident code (`RES1001`), room number, or status (`ACTIVE`, `NOTICE_PERIOD`, `VACATED`).
- **Master-Detail Split View**:
  - Left panel: Resident avatar list with room number and rent status badge.
  - Right panel: Selected resident profile card displaying personal details, emergency contacts, KYC status, rent payment history, and agreement PDF download link.

---

### Page 8: 5-Step Digital KYC Resident Registration (`ResidentRegister.tsx`)
- **Purpose**: Digital onboarding wizard for new residents.
- **Step 1: Personal Info**: Full name, email, mobile, DOB, occupation, college/company name.
- **Step 2: KYC Document Upload**: Aadhaar/PAN input with drag-and-drop file uploader and live PDF/image preview thumbnail.
- **Step 3: Address & Guardian Info**: Permanent address, current address, emergency contact name and phone.
- **Step 4: PG & Room Selection**: Property dropdown, floor selector, room and bed chooser.
- **Step 5: Bank & Payment Review**: Rent start date, security deposit amount, UPI ID, and digital declaration checkbox.

---

### Page 9: Billing, GST Invoicing & Payments (`Billing.tsx`)
- **Purpose**: Owner billing engine, payment reconciliation, and GST tax invoice generation.
- **Financial Summary Cards**: Total Billed, Total Collected, Total Outstanding Dues, GST Tax Collected (CGST 9% + SGST 9%).
- **Invoices Table**: Paginated list displaying Invoice Code (`INV-2025-089`), Tenant Name, Room No, Base Rent, Tax Amount, Total, Status Badge (`PAID`, `PENDING`, `OVERDUE`), and "Download PDF" action button.
- **Record Cash/Manual Payment Modal**: Direct payment entry for offline cash/bank transfers.

---

### Page 10: Helpdesk & Complaint Ticket System (`Complaints.tsx`)
- **Purpose**: Tenant issue resolution workflow.
- **Kanban Board**: 3 status columns (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
- **Complaint Cards**: Category tag (`Plumbing`, `Wi-Fi`, `Electrical`, `Housekeeping`), Priority badge (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), resident name, room number, timestamp, and status update selector.
- **New Ticket Modal**: Category dropdown, issue title, detailed description, and image attachment uploader.

---

### Page 11: Financial Analytics & Reports (`Analytics.tsx`)
- **Purpose**: Advanced financial reporting and occupancy analytics.
- **Monthly Revenue Chart**: Interactive multi-bar chart comparing projected vs actual rent collection.
- **Expense & Margin Breakdown**: Donut chart displaying operating costs (Electricity, Maintenance, Wi-Fi, Food Catering, Staff Salaries) vs Net Profit.
- **Export Reports**: One-click export to CSV/Excel for accounting reconciliation.

---

### Page 12: Resident Self-Service Portal (`ResidentPortal.tsx`)
- **Purpose**: 8-tab tenant dashboard.
- **Tabs**:
  1. **Overview & Dues**: Current month rent due card with instant "Pay via Razorpay" button.
  2. **KYC Status**: Verification status badge (`VERIFIED` / `PENDING`).
  3. **Roommate Profiles**: Roommate avatar list with phone number & shared Wi-Fi password copy box.
  4. **Payment Receipts**: PDF tax invoice download history.
  5. **Maintenance**: Personal ticket submission and resolution timeline.
  6. **Visitor Pass Generator**: Visitor pass creation with dynamic verification QR code payload.
  7. **Gate Pass Request**: Outing/Night-out pass request with departure/return date picker.
  8. **Meal Menu & Skip Toggle**: 7-day breakfast/lunch/dinner menu with "Skip Meal" toggles.

---

### Page 13: Authentication & Security (`Auth.tsx`)
- **Purpose**: Dual-role secure authentication portal.
- **Role Switcher**: `AnimatedTabs` sliding pill ("Property Owner" vs "Resident").
- **Login Modes**:
  - Email & Password.
  - Resident Code (`RES1001`) & Password.
  - Google OAuth 2.0 button.
- **2FA OTP Modal**: 6-digit cryptographic OTP input box with WebOTP auto-fill support and resend timer.

---

### Page 14: Navigation, Sidebar & Layout Architecture (`DashboardLayout.tsx`)
- **Sidebar Navigation**:
  - Expanded (`256px`) vs Collapsed (`64px`) state with smooth width translation.
  - Active route highlighting with warm gold background and left indicator bar.
  - User profile footer with theme toggle switch (`ThemeToggle.tsx`) and logout button.
- **Sticky Glass Header**: `backdrop-filter: blur(16px)` with global search bar, notification drawer badge, and quick action buttons.

---

## ⚡ 3. Motion Primitives & Animation System

- **Framer Motion Engine**: Spring physics (`stiffness: 400, damping: 32`), layout transitions (`layoutId`), staggered list animation (`AnimatePresence`).
- **Lenis Smooth Scroll**: 1.15s smooth inertia scroll on public pages.
- **GSAP 3 ScrollTrigger**: Section reveal timelines, navbar scroll hide/reveal, and counter count-up animations.
- **TypedText & TextReveal**: Dynamic character typewriter and headline reveal primitives.

---

## 🩻 4. Skeleton Loading Architecture

- **Session Intro**: 2.0-second branded splash overlay on first browser session start (`sessionStorage.getItem("loadingShown")`).
- **Theme-Aware Shimmer**: GPU-accelerated `.skeleton-shimmer` with light theme warm sand gradient and dark theme charcoal gradient.
- **Modular Skeletons**: `TableSkeleton`, `CardSkeleton`, `FormSkeleton`, `ResidentProfileSkeleton`, `PaymentSkeleton`.

---

## ♿ 5. Accessibility & Responsive Standards

- **WCAG 2.1 AA Compliant**: High contrast colors, clear `:focus-visible` offset rings (`3px`), ARIA labels, and `@media (prefers-reduced-motion)` fallbacks.
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px).
