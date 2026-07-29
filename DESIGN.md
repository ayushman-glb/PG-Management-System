# 🎨 RoomBae Design System & UI Architecture (`DESIGN.md`)

> **Single Source of Truth** for the RoomBae UI/UX Visual Language, Design System, Motion Primitives, Component Guidelines, Theme Tokens, Loading System, Accessibility Standards, and Layout Specifications.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design Principles](#2-design-principles)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing System](#5-spacing-system)
6. [Layout System](#6-layout-system)
7. [Component Library & Motion Primitives](#7-component-library--motion-primitives)
8. [Iconography](#8-iconography)
9. [Motion Design & Animation Engine](#9-motion-design--animation-engine)
10. [Theme System (Light & Dark Mode)](#10-theme-system-light--dark-mode)
11. [Loading Architecture & Skeleton System](#11-loading-architecture--skeleton-system)
12. [Forms & Input Design](#12-forms--input-design)
13. [Accessibility Standards (WCAG 2.1 AA)](#13-accessibility-standards-wcag-21-aa)
14. [Responsiveness & Grid Breakpoints](#14-responsiveness--grid-breakpoints)
15. [Shadows, Elevation & Glassmorphism](#15-shadows-elevation--glassmorphism)
16. [Border Radius & Corner System](#16-border-radius--corner-system)
17. [Interaction Patterns](#17-interaction-patterns)
18. [UI States](#18-ui-states)
19. [Page-by-Page Architectural Breakdown](#19-page-by-page-architectural-breakdown)
20. [Design Tokens Reference](#20-design-tokens-reference)
21. [File & Directory Architecture](#21-file--directory-architecture)
22. [Future UI Guidelines](#22-future-ui-guidelines)
23. [Do's and Don'ts](#23-dos-and-donts)

---

## 1. Project Overview

### Product Vision
**RoomBae** is a luxury, modern SaaS platform engineered for premium Paying Guest (PG) accommodation and co-living space management. It bridges property owners, operational staff, and residents with an ultra-polished, responsive digital experience.

### Brand Personality
- **Sophisticated & Warm**: Replaces cold industrial SaaS aesthetics with warm, inviting luxury tones (`Warm Sand`, `Muted Bronze`, `Champagne Gold`, `Espresso Dark Charcoal`).
- **High-Performance & Fluid**: Silky smooth 60fps animations, hardware-accelerated transitions, and zero Cumulative Layout Shift (CLS).
- **Intuitive & Empathetic**: Minimal cognitive load with progressive disclosure of complex management controls.

### Target Audience
1. **PG Owners & Property Managers**: Require high-density data clarity (Occupancy, Revenue, Complaints, Billing, Resident Registrations).
2. **Residents & Guests**: Require clean, effortless self-service portals (Rent Payments, Room Bookings, Complaint Lodging, Visitors).

---

## 2. Design Principles

1. **Luxury Warmth**: Avoid harsh `#000000` blacks or stark `#FFFFFF` whites. Use curated warm neutral tones (`#FFF8F2` warm canvas in light mode, `#1D1B1A` dark charcoal in dark mode).
2. **Intentional Hierarchy**: Establish strong visual emphasis through typographic scale, weight contrasts, glassmorphic elevation, and subtle accent highlights.
3. **Motion Primitives First**: Utilize spring-driven Framer Motion primitives (`AnimatedTabs`, `SpotlightCard`, `AnimatedCounter`, `AnimatedDialog`, `AnimatedBadge`, `FloatingTooltip`) for tactile, physical user feedback.
4. **Predictable Layout Math**: Maintain rigid spatial consistency using an 8px grid system. Skeletons and actual components share identical dimensions to eliminate layout shifts.
5. **Universal Accessibility**: WCAG 2.1 AA compliance with high-contrast text, clear `:focus-visible` rings, ARIA landmarks, and automatic `prefers-reduced-motion` fallbacks.

---

## 3. Color System

RoomBae uses a dual-palette luxury color engine with CSS custom properties (`@theme` in Tailwind CSS v4) and theme class overrides (`html.dark-theme`).

### 3.1 Light Theme Palette

| Token | CSS Variable / Tailwind | Hex Code | Visual Role |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--color-lux-bg` | `#FFF8F2` | Main page background |
| **Surface / Sidebar** | `--color-lux-surface` | `#F8EEE5` | Secondary containers, sidebar background |
| **Card Background** | `--color-lux-card` | `#FFFDFB` | Elevated card surfaces, tables, forms |
| **Primary Accent** | `--color-lux-accent` | `#D9A87C` | Primary buttons, active highlights, gradients |
| **Secondary Accent** | `--color-lux-accent2` | `#C58B63` | Gradient endpoints, hover states, icons |
| **Highlight** | `--color-lux-highlight` | `#E7C4A0` | Subtle active fills, pill badges, active borders |
| **Text Primary** | `--color-lux-text` | `#3B2A24` | Primary headings, body copy, high contrast |
| **Text Secondary** | `--color-lux-text2` | `#6E5A52` | Subtitles, labels, metadata, captions |
| **Border / Divider** | `--color-lux-border` | `#E6D7CA` | Structural borders, card outlines, table rows |
| **Success** | `--color-lux-success` | `#5E9F72` | Paid status, resolved complaints, active beds |
| **Warning** | `--color-lux-warning` | `#D9A441` | Pending rent, warnings, partial occupancy |
| **Danger / Error** | `--color-lux-danger` | `#D96B5D` | Overdue status, urgent complaints, delete |

---

### 3.2 Dark Theme Palette

| Token | CSS Variable / Tailwind | Hex Code | Visual Role |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--color-dark-bg` | `#1D1B1A` | Main dark background |
| **Surface / Sidebar** | `--color-dark-surface` | `#2B2725` | Dark surface containers, sidebar |
| **Card Background** | `--color-dark-card` | `#332D2B` | Elevated dark card surfaces, tables, forms |
| **Primary Accent** | `--color-dark-accent` | `#C89A4B` | Dark mode gold accent, primary buttons |
| **Secondary Accent** | `--color-dark-accent2` | `#D8B36A` | Soft gold highlights, gradient fills |
| **Highlight** | `--color-dark-highlight` | `#E8C98A` | Text highlights, active state glows |
| **Text Primary** | `--color-dark-text` | `#F7F3EE` | Dark mode high-contrast text |
| **Text Secondary** | `--color-dark-text2` | `#C6B9AE` | Muted subtitles, descriptions |
| **Muted Text** | `--color-dark-muted` | `#756A63` | Placeholders, disabled states |
| **Border / Divider** | `--color-dark-border` | `#4A443F` | Dark mode borders, structural dividers |

---

### 3.3 Contrast Strategy & Elevation
- Light surfaces overlay soft warm shadows (`rgba(93, 55, 28, 0.08)`).
- Dark surfaces use stacked charcoal values (`#1D1B1A` canvas → `#2B2725` surface → `#332D2B` card → `#3D3632` hover) with ambient golden glows (`rgba(200, 154, 75, 0.12)`).

---

## 4. Typography

RoomBae uses **Poppins** from Google Fonts as its core typeface across all viewports.

### 4.1 Typographic Scale

| Role | Font Size | Line Height | Weight | Letter Spacing | Usage Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `3.5rem` (56px) | `1.1` | 800 (ExtraBold) | `-0.02em` | Landing Hero Headline |
| **Heading 1 (H1)** | `2.25rem` (36px) | `1.2` | 700 (Bold) | `-0.01em` | Main Page Titles |
| **Heading 2 (H2)** | `1.75rem` (28px) | `1.25` | 700 (Bold) | `0` | Section Titles, Modals |
| **Heading 3 (H3)** | `1.25rem` (20px) | `1.3` | 600 (SemiBold) | `0.01em` | Card Headers, Widget Titles |
| **Heading 4 (H4)** | `1.0rem` (16px) | `1.4` | 600 (SemiBold) | `0.01em` | Table Headers, Sub-sections |
| **Body Large** | `1.125rem` (18px) | `1.6` | 400 / 500 | `0.01em` | Lead paragraphs |
| **Body Base** | `0.875rem` (14px) | `1.5` | 400 (Regular) | `0.01em` | Standard text, inputs |
| **Body Small** | `0.75rem` (12px) | `1.5` | 500 (Medium) | `0.02em` | Metadata, badges, table cells |
| **Caption / Micro**| `0.625rem` (10px) | `1.4` | 600 (SemiBold) | `0.05em` | Micro labels, uppercase tags |

---

## 5. Spacing System

The spacing system relies on an **8px base grid** (with 4px micro-steps).

```css
--spacing-1: 4px;   /* Micro gaps, icon padding */
--spacing-2: 8px;   /* Small gaps, badge padding */
--spacing-3: 12px;  /* Button padding, internal input spacing */
--spacing-4: 16px;  /* Standard container padding, card gaps */
--spacing-6: 24px;  /* Large card padding, section gaps */
--spacing-8: 32px;  /* Modal margins, page headers */
--spacing-12: 48px; /* Section separation */
--spacing-16: 64px; /* Hero section padding */
```

---

## 6. Layout System

### 6.1 Core Layout Architecture
- **Dashboard View**: Sidebar + Sticky Glass Header + Scrollable Main Content Area (`h-screen overflow-hidden`).
- **Public & Content Views**: Full-width smooth scroll canvas with fixed navigation header.

### 6.2 Structural Dimensions
- **Sidebar Width**: `256px` (Expanded `w-64`), `64px` (Collapsed `w-16`).
- **Header Height**: `64px` (`h-16`).
- **Max Width Containers**: `max-w-7xl` (1280px) for listings/dashboard, `max-w-4xl` (896px) for content/forms.
- **Grid Systems**: 12-column responsive layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).

---

## 7. Component Library & Motion Primitives

In addition to base UI components, RoomBae includes a dedicated suite of **Motion Primitives** (`MotionPrimitives.tsx`):

### 7.1 Motion Primitives (`src/components/MotionPrimitives.tsx`)

#### 1. `AnimatedTabs`
- **Purpose**: Tab navigation switcher with a fluid sliding pill indicator.
- **Physics**: Framer Motion `layoutId` with spring animation (`stiffness: 400, damping: 32`).
- **Usage**: Role switcher in `Auth.tsx` ("Owner" vs "Resident"), status filters in `Complaints.tsx`.

#### 2. `SpotlightCard`
- **Purpose**: Interactive card component with a mouse-tracking radial spotlight glow.
- **Behavior**: Tracks relative cursor coordinates `(x, y)` on mouse move and renders a hardware-accelerated radial spotlight layer.
- **Usage**: Main statistics widget grid in `Dashboard.tsx`.

#### 3. `AnimatedCounter`
- **Purpose**: Smooth spring-based numeric interpolation for stats and monetary values.
- **Behavior**: Interpolates numbers using `useSpring` and `useTransform` with locale formatting.

#### 4. `AnimatedAccordion`
- **Purpose**: Collapsible item container.
- **Behavior**: Auto-height collapse/expand using `AnimatePresence` and 180° chevron icon rotation.

#### 5. `AnimatedDialog`
- **Purpose**: Accessible modal overlay dialog.
- **Behavior**: Backdrop blur opacity fade with spring scale/slide modal entrance (`scale: 0.95, y: 16` → `scale: 1, y: 0`).

#### 6. `AnimatedBadge`
- **Purpose**: Status pill tag.
- **Variants**: `success`, `warning`, `danger`, `info`, `neutral`.
- **Behavior**: Includes a subtle animated pulsing halo indicator ring.
- **Usage**: Priority tags in `Complaints.tsx`.

#### 7. `FloatingTooltip`
- **Purpose**: Hover tooltip container.
- **Positions**: `top`, `bottom`, `left`, `right`.

#### 8. `AnimatedList` & `AnimatedListItem`
- **Purpose**: Layout primitive for dynamic item insertion, removal, and reordering animations.

---

### 7.2 Standard UI Components

#### Primary Button (`.luxury-btn-primary`)
- **Background**: `linear-gradient(135deg, #D9A87C, #C58B63)` (Light) / `linear-gradient(135deg, #C89A4B, #D8B36A)` (Dark).
- **Text**: `#FFFDFB` (Bold, 14px).
- **Radius**: `12px` (`rounded-xl`).
- **Hover**: `translateY(-2px)` + brightness filter + shadow (`0 8px 24px rgba(197, 139, 99, 0.45)`).

#### Secondary Button (`.luxury-btn-secondary`)
- **Background**: `#FFFDFB` (Light) / `#332D2B` (Dark).
- **Border**: `1.5px solid #D9A87C` (Light) / `1.5px solid #C89A4B` (Dark).
- **Text**: `#C58B63` (Light) / `#C89A4B` (Dark).

#### Cards (`.luxury-card` & `MotionCard`)
- **Background**: `#FFFDFB` (Light) / `#332D2B` (Dark).
- **Border**: `1px solid #E6D7CA` (Light) / `1px solid #4A443F` (Dark).
- **Radius**: `20px` (`rounded-2xl`).

#### Inputs (`.luxury-input`)
- **Background**: `#FFFDFB` (Light) / `#2B2725` (Dark).
- **Border**: `1.5px solid #E6D7CA` (Light) / `1.5px solid #4A443F` (Dark).
- **Focus State**: `border-color: #D9A87C` with `ring-3 ring-[#D9A87C]/20`.

#### Avatar Engine (`Avatar.tsx`)
- **Sizes**: `xs` (24px), `sm` (32px), `md` (36px), `lg` (40px), `xl` (56px), `2xl` (64px).
- **Palettes**: `luxury`, `gold`, `amber`, `bronze`, `rose`, `emerald`, `multi`.

---

## 8. Iconography

- **Library**: `lucide-react`.
- **Standard Sizes**: `w-4 h-4` (16px small), `w-5 h-5` (20px standard), `w-6 h-6` (24px headers).
- **Icon Styling**: Stroke width `1.75px` or `2px` with smooth stroke alignment.

---

## 9. Motion Design & Animation Engine

RoomBae relies on an integrated animation engine:

1. **Framer Motion Primitives**: Spring physics (`stiffness: 400, damping: 32`), sliding `layoutId` pills, layout list transitions, and `AnimatePresence`.
2. **Lenis Smooth Scroll**: 1.2s smooth wheel inertia on public pages (`SmoothScroll.tsx`).
3. **GSAP & ScrollTrigger**: Ticker sync for high-performance scroll triggers.
4. **Typed.js**: Dynamic character typing effect for hero headlines (`TypedText.tsx`).
5. **Magnetic Physics**: `MagneticButton` and `TiltCard` cursor offset perspective transforms (`rotateX`, `rotateY`).

---

## 10. Theme System (Light & Dark Mode)

- **Provider**: `ThemeProvider` in `src/theme.tsx`.
- **Class Identifier**: `html.dark-theme`.
- **Persistence**: `localStorage.getItem("pg-manager-theme")` with `prefers-color-scheme` fallback.
- **Theme Toggle Component**: `ThemeToggle` renders a sliding pill (`w-14 h-7`) with gold/amber gradient backgrounds and smooth knob translation (`translate-x-7`).

---

## 11. Loading Architecture & Skeleton System

The loading experience consists of **two isolated systems**:

### 11.1 One-Time 2.0-Second Branded Loading Screen (Session Level)
- **Trigger**: Appears **ONLY ONCE** when a user first opens RoomBae in a browser session.
- **Duration**: **EXACTLY 2.0 Seconds (2000ms)**.
- **Session Memory**: Controlled via `sessionStorage.getItem("loadingShown")`.
- **Exclusion**: Never rendered during route changes, API data re-fetches, or internal page navigation.

```
Browser Opens -> Check sessionStorage("loadingShown")
↓
If FALSE -> Render RoomBae Splash Overlay for EXACTLY 2.0s -> Set sessionStorage = true -> Render App
↓
If TRUE -> Render App Immediately (Skip Overlay)
```

### 11.2 Theme-Aware Skeleton Loaders (Data Level)
- **Render Condition**: Displays only when page data is loading (or when `ENABLE_SKELETON_DEBUG_DELAY = true`).
- **Styling**: Uses `.skeleton-shimmer` with GPU hardware acceleration (`will-change: background-position`).
- **Light Theme Shimmer**: Warm neutral gradient (`#F8EEE5` → `#FFFDFB` → `#E7C4A0`).
- **Dark Theme Shimmer**: Charcoal surface gradient (`#2B2725` → `#3D3632` → `#4A443F`).
- **Modular Component Skeletons**: Exported `TableSkeleton`, `FormSkeleton`, `CardSkeleton`, `ResidentProfileSkeleton`, `ResidentListSkeleton`, `PaymentSkeleton`, `SettingsSkeleton`, `NotificationSkeleton`.
- **Accessibility**: Includes `aria-busy="true"` on wrapper containers and `aria-hidden="true"` on skeleton blocks.

### 11.3 Developer Testing & Debug Configuration
- Debug delay can be controlled cleanly via the `ENABLE_SKELETON_DEBUG_DELAY` and `SKELETON_DEBUG_DELAY_MS` constants in `src/components/Skeletons.tsx`.
- Keeps the user interface 100% production-clean without floating development badges or intrusive overlays.

---

## 12. Forms & Input Design

- **Input Structure**: Top-aligned bold labels (`text-xs font-semibold uppercase`).
- **Validation Feedback**: Soft colored alert boxes (`bg-red-50 text-red-600 border-red-200`).
- **File Upload Component**: Drag-and-drop zone with animated upload progress bars, file size previews, and item removal actions.

---

## 13. Accessibility Standards (WCAG 2.1 AA)

1. **Focus Rings**: `:focus-visible` enforces an offset 3px ring (`rgba(217, 168, 124, 0.5)`).
2. **Screen Reader Support**: All non-text interactive elements include `aria-label` attributes.
3. **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` disables Lenis smooth scroll, Typed.js, magnetic physics, and transforms skeleton shimmers into static muted blocks.

---

## 14. Responsiveness & Grid Breakpoints

- **`sm` (640px)**: Single column layouts, collapsible mobile scroll helpers (`mobile-scroll-x`).
- **`md` (768px)**: 2-column grids, visible text back buttons.
- **`lg` (1024px)**: 3-column grids, fixed desktop sidebar.
- **`xl` (1280px)**: 4-column cards, full dashboard statistics.
- **`2xl` (1536px)**: Ultra-wide layout container centering (`max-w-7xl`).

---

## 15. Shadows, Elevation & Glassmorphism

- **Glassmorphism (`.glass`)**: `backdrop-filter: blur(16px)` with `background: rgba(255, 253, 251, 0.75)`.
- **Dark Glass (`.glass-dark`)**: `backdrop-filter: blur(16px)` with `background: rgba(43, 39, 37, 0.8)`.
- **Card Shadow**: `0 10px 30px rgba(93, 55, 28, 0.08)` (Light) / `0 10px 30px rgba(0, 0, 0, 0.25)` (Dark).
- **Card Hover Shadow**: `0 18px 40px rgba(93, 55, 28, 0.15)` (Light) / `0 18px 40px rgba(200, 154, 75, 0.12)` (Dark).

---

## 16. Border Radius & Corner System

- **`rounded-lg` (8px)**: Internal buttons, small badges, stat icons.
- **`rounded-xl` (12px)**: Primary buttons, text inputs, dropdown menus.
- **`rounded-2xl` (20px)**: Standard cards, stat widgets, table containers.
- **`rounded-3xl` (24px - 32px)**: Modals, hero banners, search containers.
- **`rounded-full`**: Avatars, status indicators, theme switches.

---

## 17. Interaction Patterns

- **Hover**: Subtle vertical translation (`translateY(-2px)` or `-4px`), gradient brightness filter, cursor-following spotlight glow, and border accent highlighting.
- **Active / Pressed**: Scale compression (`scale(0.96)` or `scale(0.98)`).
- **Disabled**: `opacity-50 pointer-events-none cursor-not-allowed`.

---

## 18. UI States

1. **Default**: Complete populated content.
2. **Loading**: Page or component skeleton loader active.
3. **Empty**: Centered muted icon, descriptive heading, and primary CTA button.
4. **Error**: Soft red container with retry action button.

---

## 19. Page-by-Page Architectural Breakdown

| Page | Layout | Key Components & Motion Primitives | Primary Animations |
| :--- | :--- | :--- | :--- |
| **Landing** | Public Full-Width | Hero, Feature Grid, Pricing, Testimonials | Lenis scroll, TypedText, TextReveal, TiltCard |
| **Dashboard** | Sidebar + Header Layout | `SpotlightCard` Widgets, `AnimatedCounter`, Revenue Chart | Cursor spotlight glow, count-up numbers |
| **Residents** | Master-Detail Split View | Resident List, Search Bar, Resident Detail Panel, Avatar | AnimatePresence panel slide |
| **Properties** | 4-Column Grid | Property Cards, Occupancy Meter, Room Manager | MotionCard hover lift |
| **Billing** | Stat Row + Table | Summary Cards, Payment History Table, Status Badges | MotionRow hover highlight |
| **Complaints** | Kanban / Status Columns | Complaint Cards, `AnimatedBadge` Tags, Assignee Avatar | Drag / scale motion |
| **Analytics** | Dual Chart Layout | Area Chart, Bar Chart, Metric Cards | Recharts path draw animation |
| **Auth** | Centered Glass Card | `AnimatedTabs` Role Toggle, Luxury Input Form | Sliding pill layout transition |

---

## 20. Design Tokens Reference

```css
@theme {
  --font-sans: "Poppins", sans-serif;

  /* Light Luxury Palette */
  --color-lux-bg: #FFF8F2;
  --color-lux-surface: #F8EEE5;
  --color-lux-card: #FFFDFB;
  --color-lux-accent: #D9A87C;
  --color-lux-accent2: #C58B63;
  --color-lux-highlight: #E7C4A0;
  --color-lux-text: #3B2A24;
  --color-lux-text2: #6E5A52;
  --color-lux-border: #E6D7CA;
  --color-lux-success: #5E9F72;
  --color-lux-warning: #D9A441;
  --color-lux-danger: #D96B5D;

  /* Dark Luxury Palette */
  --color-dark-bg: #1D1B1A;
  --color-dark-surface: #2B2725;
  --color-dark-card: #332D2B;
  --color-dark-accent: #C89A4B;
  --color-dark-accent2: #D8B36A;
  --color-dark-highlight: #E8C98A;
  --color-dark-text: #F7F3EE;
  --color-dark-text2: #C6B9AE;
  --color-dark-border: #4A443F;
  --color-dark-muted: #756A63;

  --radius: 20px;
}
```

---

## 21. File & Directory Architecture

```
src/
├── App.tsx                     # Core Application Shell & Session Loading Manager
├── main.tsx                    # React Root Entry Point
├── index.css                   # Tailwind v4 Theme Tokens, Keyframes, Utilities
├── theme.tsx                   # ThemeProvider Context & ThemeToggle Component
├── navigation.tsx              # Navigation Context & BackButton Component
├── components/
│   ├── Avatar.tsx              # Luxury Multi-Palette Avatar Engine
│   ├── DashboardLayout.tsx     # Master Sidebar & Header Layout Component
│   ├── MagneticButton.tsx      # Magnetic Physics Button & 3D Tilt Card
│   ├── MotionCard.tsx          # Spring Motion Containers & Animated Rows
│   ├── MotionPrimitives.tsx    # Framer Motion Primitives Suite
│   ├── ScrollProgressBar.tsx   # Top Page Scroll Progress Indicator Bar
│   ├── Skeletons.tsx           # Page & Component Skeleton Loaders
│   ├── SmoothScroll.tsx        # Lenis & GSAP Scroll Integration
│   ├── TextReveal.tsx          # Staggered Word/Character Reveal Component
│   └── TypedText.tsx           # Typed.js Dynamic Character Animation
└── pages/                      # Page Component Views
```

---

## 22. Future UI Guidelines

When extending RoomBae with new pages or components, developers **MUST**:

1. **Use Motion Primitives**: Utilize components from `MotionPrimitives.tsx` (`AnimatedTabs`, `SpotlightCard`, `AnimatedBadge`, `AnimatedDialog`) for UI interactions.
2. **Use Theme Tokens**: Always reference `--color-lux-*` and `--color-dark-*` tokens or Tailwind utility classes.
3. **Support Dual Themes**: Ensure components specify both light and `dark-theme` styles.
4. **Use Skeleton Loaders**: Create matching skeleton placeholders in `Skeletons.tsx` for any new async data components.
5. **Maintain Spacing & Radius**: Follow the 8px spatial grid and 12px/20px border radius standards.
6. **Ensure Accessibility**: Add `:focus-visible` rings, ARIA labels, and respect reduced motion preferences.

---

## 23. Do's and Don'ts

### ✅ Do's
- ✅ **DO** use warm neutral tones (`#FFF8F2` / `#1D1B1A`) for background surfaces.
- ✅ **DO** use `sessionStorage` for session-scoped UI flags (like the 2s branded splash intro).
- ✅ **DO** use `AnimatedTabs` for tab switchers to provide smooth sliding pill indicators.
- ✅ **DO** use `SpotlightCard` for dashboard cards to provide cursor glow tracking.
- ✅ **DO** provide skeleton fallbacks with identical dimensions to prevent layout shifts.

### ❌ Don'ts
- ❌ **DO NOT** hardcode generic blue `#0000FF` or harsh black `#000000` colors.
- ❌ **DO NOT** trigger full-screen branded loading overlays on route navigation.
- ❌ **DO NOT** use `localStorage` for session-only splash loading screens.
- ❌ **DO NOT** omit focus rings or ARIA attributes on interactive icons and buttons.
