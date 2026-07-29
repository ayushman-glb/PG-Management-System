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
- ❌ **DO NOT** animate `width`, `height`, `top`, `left`, `margin`, or `padding` — always use `transform` and `opacity`.
- ❌ **DO NOT** add animations without `prefers-reduced-motion` fallbacks.
- ❌ **DO NOT** use raw `setTimeout` for animation delays — use GSAP `delay` or Framer Motion `transition.delay`.

---

## 24. Motion Design Philosophy

RoomBae's animation system is built around three core principles:

### 24.1 Purpose Over Decoration
Every animation **must serve a function**: directing attention, confirming interaction, communicating state change, or providing spatial context for navigation. Gratuitous animations are explicitly banned.

### 24.2 Physics-Driven Motion
Animations feel **natural and physical**:
- Spring physics (`type: "spring"`) for element entrances and hover states
- Exponential easing (`Math.min(1, 1.001 - Math.pow(2, -10 * t))`) for scroll momentum
- Cubic-bezier curves (`[0.25, 0.1, 0.25, 1]`) for page-level transitions

### 24.3 Performance First
All animations run exclusively on **GPU-composited properties**:
- `transform: translateX/Y/Scale/Rotate`
- `opacity`
- `filter` (blur only, used sparingly)
- `clip-path` (entrance reveal only)

Properties that trigger browser layout reflow (`width`, `height`, `top`, `left`) are **strictly forbidden** in animation targets.

---

## 25. Animation Stack Reference

| Library | Version | Role | When to Use |
| :--- | :--- | :--- | :--- |
| **GSAP** | `^3.x` | Primary orchestration engine | Complex timelines, scroll triggers, global reveals, mouse parallax |
| **GSAP ScrollTrigger** | Plugin | Scroll-linked effects | Section reveals, counter animations, parallax, navbar hide/show |
| **Lenis** | `^1.x` | Premium smooth scroll | Application-wide smooth scroll with momentum easing |
| **Framer Motion** | `^11.x` | React component animations | Mount/unmount, hover, tap, route transitions, modal open/close |
| **Typed.js** | `^2.x` | Text typewriter effects | Hero headline rotating keywords |

### Architecture Decision

- **GSAP** owns the **document-level** animation layer: timelines that span multiple elements, scroll-triggered effects, and global utilities.
- **Framer Motion** owns the **component-level** animation layer: local state transitions, React lifecycle animations, and `AnimatePresence` exit states.
- **Lenis** owns the **scroll layer**: smooth scroll momentum, synchronized with GSAP ticker via `lenis.on("scroll", ScrollTrigger.update)`.

These layers do **not compete** — they are synchronized at the RAF level via `gsap.ticker`.

---

## 26. Global Animation Guidelines

### 26.1 Duration Scale

| Context | Duration | Use Case |
| :--- | :--- | :--- |
| **Micro** | `0.15s` | Hover states, icon transitions, button press |
| **Short** | `0.25–0.35s` | Dropdown open, badge pop, skeleton fade |
| **Medium** | `0.5–0.7s` | Card entrance, section reveal, page content fade |
| **Long** | `0.75–0.9s` | Hero mockup, modal entrance, splash transition |
| **Lenis scroll** | `1.15s` | Full scroll momentum duration |

### 26.2 Easing Reference

| Name | Value | Use Case |
| :--- | :--- | :--- |
| `power3.out` | GSAP ease | Hero entrance, navbar reveal — fast start, smooth settle |
| `power2.out` | GSAP ease | Scroll reveals, card entrances — gentle ease-out |
| `power2.inOut` | GSAP ease | Navbar hide/show — symmetric smooth transition |
| Spring `damping:20 stiffness:110` | Framer Motion | Text reveals, word stagger — natural physical feel |
| `[0.25, 0.1, 0.25, 1]` | CSS cubic-bezier | Page transitions — neutral, balanced |

### 26.3 Scroll Trigger Thresholds

| Element Type | ScrollTrigger Start |
| :--- | :--- |
| Full sections (`.reveal-section`) | `"top 87%"` |
| Individual cards | `"top 90%"` |
| Hero counters | `"top 85%"` |
| Clip-path reveals | `"top 85%"` |

### 26.4 Stagger Values

| Group | Stagger Delay |
| :--- | :--- |
| Sidebar nav items | `0.04s` per item |
| Feature cards (per row) | `0.07s` per card |
| Testimonial cards | `0.10s` per card |
| Pricing cards | `0.12s` per card |
| Hero stats | `0.07s` per stat |
| Word reveals | `0.07s` per word |
| Character reveals | `0.025s` per character |

---

## 27. Component-Level Animation Catalog

### 27.1 Hero Section (`Landing.tsx`)

| Element | Class | Animation |
| :--- | :--- | :--- |
| Launch badge | `.hero-badge` | Fade in from `y: -18` → GSAP |
| Main headline | `.hero-title` | Clip-path reveal `inset(100% → 0%)` + fade + y |
| Subtitle | `.hero-sub` | Fade + y offset → GSAP |
| CTA buttons | `.hero-cta` | Fade + scale `0.96 → 1` → GSAP |
| Stat pillars | `.hero-stats` | Stagger fade-up → GSAP |
| Dashboard mockup | `.hero-mockup` | Fade + y:52 + scale → GSAP |
| Parallax glow | `.hero-bg-parallax` | Mouse-tracking X/Y translate → GSAP |

### 27.2 Navbar (`Landing.tsx`)

- **Attach**: `navRef` ref attached to `<nav>` element with `navbar-animated` CSS class
- **Logic**: GSAP ScrollTrigger `onUpdate` monitors scroll direction
  - Scroll down > 140px → `gsap.to(nav, { y: "-110%" })` — hide
  - Scroll up → `gsap.to(nav, { y: "0%" })` — reveal

### 27.3 Scroll Reveals

| Class | Target | Effect |
| :--- | :--- | :--- |
| `.reveal-section` | Section containers | Fade + `y:36` → `y:0` on scroll |
| `.feature-card` | Feature grid cards | Scale `0.97→1` + fade per row stagger |
| `.testimonial-card` | Testimonial cards | Fade + y, stagger 0.1s |
| `.pricing-card` | Pricing plan cards | Scale `0.97→1` + fade, stagger 0.12s |

### 27.4 Sidebar Navigation (`DashboardLayout.tsx`)

- **Mount stagger**: Each `motion.button` item has `initial={{ opacity:0, x:-12 }}` with `delay: index * 0.04s`
- **Hover**: `whileHover={{ x: 5 }}` (translation only, no layout change)
- **Icon hover**: Nested `motion.span` with `whileHover={{ rotate: -5, scale: 1.1 }}`
- **Mobile overlay**: `AnimatePresence` wraps the backdrop for fade in/out

### 27.5 Page Transitions (`App.tsx`)

- **Direction tracking**: `directionRef` (`1` = forward, `-1` = backward)
- **Enter**: `x: dir * 22 → 0` + `opacity: 0 → 1`
- **Exit**: `x: 0 → dir * -16` + `opacity: 1 → 0`
- **Duration**: `0.3s` cubic-bezier `[0.25, 0.1, 0.25, 1]`

### 27.6 Mobile Menu (`Landing.tsx`)

- `AnimatePresence` wraps the menu drawer
- Enter: `{ opacity: 0, y: -8 } → { opacity: 1, y: 0 }` in `0.22s`
- Exit: `{ opacity: 0, y: -8 }` on close

### 27.7 New Motion Primitives (`MotionPrimitives.tsx`)

| Component | Animation |
| :--- | :--- |
| `RevealOnScroll` | IntersectionObserver-triggered fade/scale/slide. Variants: `fadeUp`, `fadeLeft`, `fadeRight`, `scale`, `fade` |
| `StaggerContainer` + `StaggerItem` | Parent-child stagger cascade using Framer Motion variants |
| `RippleButton` | Click origin ripple: `scale: 0→4`, `opacity: 0.4→0` in `0.55s` |
| `MorphingIcon` | `AnimatePresence mode="wait"` between two icon states with rotate + scale |

---

## 28. Scroll Animation System

### 28.1 Lenis Configuration (`SmoothScroll.tsx`)

```typescript
new Lenis({
  duration: 1.15,               // Full scroll momentum duration
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential
  smoothWheel: true,
  touchMultiplier: 1.8,         // Natural mobile feel
  wheelMultiplier: 0.9,         // Slightly damped luxury feel
})
```

Synchronized with GSAP:
```typescript
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0); // Prevents scroll judder
```

### 28.2 GSAP Utilities (`GSAPAnimations.tsx`)

All hooks exported from `src/components/GSAPAnimations.tsx`:

| Hook | Signature | Description |
| :--- | :--- | :--- |
| `useScrollReveal` | `(ref, config)` | Fade+Y reveal with ScrollTrigger |
| `useStaggerReveal` | `(ref, opts)` | Stagger children reveal |
| `useParallax` | `(ref, speed)` | Scroll-driven Y parallax |
| `useCounterAnimation` | `(ref, target)` | Number counter on scroll entry |
| `useNavbarHide` | `(navRef)` | Scroll-direction navbar hide/show |
| `useHeroTimeline` | `(containerRef)` | Cinematic hero entrance timeline |
| `useClipReveal` | `(ref, opts)` | Clip-path scroll reveal |
| `useFadeInSection` | `(ref, opts)` | Simple fade+Y on scroll |
| `useMouseParallax` | `(ref, strength)` | Mouse-tracking X/Y for decorative elements |

### 28.3 CSS Data Attributes for GSAP Targets

Elements can declare their initial hidden state using `data-gsap`:

```html
<div data-gsap="fade-up">   <!-- opacity:0, y:28 initially -->
<div data-gsap="clip-reveal"> <!-- clip-path: inset(100%) initially -->
<div data-gsap="scale-up">  <!-- opacity:0, scale:0.94 initially -->
```

Under `prefers-reduced-motion`, all `[data-gsap]` elements are immediately visible.

---

## 29. Performance & Accessibility Contract

### 29.1 Performance Rules

1. **60fps target**: Only `transform` and `opacity` animated. Zero layout-triggering properties.
2. **`will-change`**: Set only on known animated targets (`hero-bg-parallax`, `navbar-animated`, `[data-gsap]`). Never blanket-applied.
3. **GSAP Context**: All GSAP animations wrapped in `gsap.context()`. Cleaned up with `ctx.revert()` on unmount to prevent memory leaks.
4. **RAF sync**: Lenis RAF runs inside GSAP ticker — single frame budget per animation frame.
5. **Lazy ScrollTrigger**: `toggleActions: "play none none none"` prevents re-triggering on scroll-up for permanent reveals.

### 29.2 Accessibility Rules

1. **`prefers-reduced-motion: reduce`**: All GSAP hooks check `window.matchMedia("(prefers-reduced-motion: reduce)")` before creating animations. Reduced-motion sets elements to final visible state immediately.
2. **CSS fallback**: The `@media (prefers-reduced-motion: reduce)` block in `index.css` kills all CSS animations AND sets `[data-gsap]` elements to fully visible.
3. **Framer Motion**: All custom `Variants` include a reduced-motion path (`{ opacity: 1 }`, `{ duration: 0 }`).
4. **Focus**: Animations never interfere with keyboard focus order. Tab order is always logical.
5. **`aria-hidden`**: All purely decorative animated elements (`.hero-bg-parallax`, ripple rings) have `aria-hidden="true"`.
6. **ARIA live regions**: Page skeleton transitions do not affect ARIA tree structure.

### 29.3 Mobile Strategy

| Device Type | Strategy |
| :--- | :--- |
| Touch devices | Lenis `touchMultiplier: 1.8` for natural inertia |
| Mobile (<768px) | GSAP mouse parallax disabled (no `mousemove` on touch) |
| Reduced viewports | Stagger delays preserved, `start: "top 90%"` ensures reveals fire reliably |
| Foldables | Fluid layout — no animation values depend on fixed pixel viewport |

---
