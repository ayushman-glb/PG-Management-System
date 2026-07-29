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

---

## 8. Theme System & Tokens

```css
@theme {
  --font-sans: "Poppins", sans-serif;
  --color-lux-bg: #FFF8F2;
  --color-lux-surface: #F8EEE5;
  --color-lux-card: #FFFDFB;
  --color-lux-accent: #D9A87C;
  --color-lux-accent2: #C58B63;
  --color-lux-text: #3B2A24;
  --color-lux-border: #E6D7CA;
  --color-dark-bg: #1D1B1A;
  --color-dark-surface: #2B2725;
  --color-dark-card: #332D2B;
  --color-dark-accent: #C89A4B;
  --color-dark-text: #F7F3EE;
  --radius: 20px;
}
```
