# 🖥️ RoomBae Frontend Architecture & Responsive Design Specification (`frontend/DESIGN.md`)

> **Visual Design Specification, Component Architecture & Responsive Systems Blueprint** for the RoomBae React 19 + Vite 6 + TypeScript Single Page Application (SPA).

---

## 📋 Executive Overview

**RoomBae** is an ultra-luxury, high-performance Paying Guest (PG) & Co-Living Management SaaS Web Application. The frontend architecture relies on a **component-driven design system** built with **Tailwind CSS v4**, **Framer Motion**, **GSAP 3**, **Lenis Smooth Scroll**, and **Lucide React**.

This document details the visual design system, relative unit architecture, fluid typography clamp scales, responsive 19-tier breakpoint grid system, accessibility standards (WCAG AA), component hierarchy, motion guidelines, and state management patterns.

---

## 🎨 1. Global Visual Language & Design Tokens

RoomBae replaces cold industrial SaaS aesthetics with warm, inviting luxury tones built using relative units (`rem`, `em`, `%`, `vw`, `vh`, `clamp()`):

### 1.1 Color Palette & Theme Tokens

#### Light Theme (`Warm Sand & Luxury Amber`)
- **Canvas Background (`--bg-primary`)**: `#FFF8F2` — Soft warm cream.
- **Surface / Sidebar (`--bg-surface`)**: `#F8EEE5` — Warm neutral container fill.
- **Card Fills (`--bg-card`)**: `#FFFDFB` — Elevated card background.
- **Primary Gold Accent (`--accent-gold`)**: `#D9A87C` — Primary CTAs, active highlights.
- **Secondary Bronze Accent (`--accent-bronze`)**: `#C58B63` — Hover states, gradient endpoints.
- **High-Contrast Text (`--text-main`)**: `#3B2A24` — Deep espresso brown.
- **Secondary Text (`--text-muted`)**: `#6E5A52` — Muted labels, subtitles.
- **Structural Borders (`--border-main`)**: `#E6D7CA` — Subtle 1px dividers.

#### Dark Theme (`Espresso Charcoal & Gold`)
- **Dark Canvas (`--bg-primary-dark`)**: `#1D1B1A` — Dark charcoal canvas.
- **Dark Surface (`--bg-surface-dark`)**: `#2B2725` — Dark container surface.
- **Dark Cards (`--bg-card-dark`)**: `#332D2B` — Elevated dark card fill.
- **Gold Accent (`--accent-gold-dark`)**: `#C89A4B` — Metallic gold highlights.
- **Dark Text (`--text-main-dark`)**: `#F7F3EE` — Warm off-white body copy.
- **Dark Borders (`--border-main-dark`)**: `#4A443F` — Muted dark dividers.

### 1.2 Fluid Responsive Typography Scale (`clamp()`)

All font sizes, line heights, and margins dynamically adapt using CSS `clamp()` without layout jumps:

```css
/* Typography Scale */
.text-clamp-hero {
  font-size: clamp(2.2rem, 5.5vw, 4.75rem);
  line-height: 1.08;
  letter-spacing: -0.025em;
}

.text-clamp-h1 {
  font-size: clamp(1.75rem, 3.8vw, 2.75rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.text-clamp-h2 {
  font-size: clamp(1.35rem, 2.8vw, 2rem);
  line-height: 1.25;
}

.text-clamp-body {
  font-size: clamp(0.95rem, 1.4vw, 1.15rem);
  line-height: 1.6;
}

.text-clamp-sub {
  font-size: clamp(0.85rem, 1.2vw, 1rem);
  line-height: 1.5;
}
```

---

## 📐 2. Responsive Grid System & Breakpoint Tiers

RoomBae supports 19 screen resolution tiers (from 320px mobile up to 2560px 4K displays):

```
+-----------------------------------------------------------------------+
| 320px - 479px  | Single-Column Flex Stack | Touch Targets: 44px min   |
| 480px - 639px  | 4-Column Grid           | Collapsed Search Icon     |
| 640px - 767px  | 4-Column Grid           | Tablet Drawer Navigation  |
| 768px - 1023px | 8-Column Grid           | 2-Column Dashboard Cards  |
| 1024px - 1439px| 12-Column Grid          | Persistent Left Sidebar   |
| 1440px - 2560px| 12-Column Grid          | Centered max-w-7xl Grid   |
+-----------------------------------------------------------------------+
```

### 2.1 Grid Layout Column Strategy
- **Desktop / 4K (`1280px - 2560px`)**: 12-column responsive CSS Grid (`grid-cols-12`).
- **Laptop (`1024px - 1279px`)**: 12-column compressed grid (`lg:grid-cols-12`).
- **Tablet (`768px - 1023px`)**: 8-column grid (`md:grid-cols-8`).
- **Mobile (`480px - 767px`)**: 4-column grid (`sm:grid-cols-4`).
- **Ultra Small Mobile (`320px - 479px`)**: Single-column flex stack (`grid-cols-1`).

---

## 🧩 3. Component Architecture & System Design

The application is built using reusable design system primitives:

```
src/
├── components/
│   ├── ui/
│   │   ├── Logo.tsx               # Responsive brand logo (full, compact, icon-only)
│   │   ├── Button.tsx             # Design system button (sm, md, lg, 44px touch min)
│   │   ├── Avatar.tsx             # User avatar with status indicator
│   │   └── AnimatedBadge.tsx      # Status badge with glow pill
│   ├── animations/
│   │   └── TypedText.tsx          # Zero-CLS width-reserved typewriter animation
│   └── layouts/
│       └── DashboardLayout.tsx    # Responsive shell layout with drawer navigation
└── features/
    ├── dashboard/                 # Bento Grid & Metrics
    ├── properties/                # Property Cards & Room Matrix
    ├── residents/                 # Resident Directory & Resident Portal
    ├── billing/                   # Invoices, Razorpay & GST Calculator
    └── complaints/                # SLA Helpdesk Kanban Boards
```

### 3.1 Key UI Components

1. **`<Logo />` (`Logo.tsx`)**:
   - Renders `full` (Icon + Text + Badge), `compact`, or `icon-only` variants.
   - Preserves aspect ratio with `flex-shrink-0` to eliminate text clipping or logo distortion on mobile viewports.
2. **`<Button />` (`Button.tsx`)**:
   - Supports `primary`, `secondary`, `outline`, `ghost`, and `danger` variants.
   - Enforces a minimum 44px touch target height for mobile ergonomics with `focus-visible` accessibility rings.
3. **`<TypedText />` (`TypedText.tsx`)**:
   - Layout-shift-free typewriter effect using reserved inline container width (`min-w-[280px] sm:min-w-[360px]`).
4. **`<DashboardLayout />` (`DashboardLayout.tsx`)**:
   - Top header search bar collapses to an icon button on mobile (`<sm`), while action buttons (`Verification Queue`, `Issue Fine`) collapse text labels on tablet (`<md`) to icon badges.

---

## ♿ 4. Accessibility (WCAG AA Compliance)

1. **Keyboard Accessibility**: Every interactive element features visible `focus-visible:ring-2` focus indicators.
2. **Touch Targets**: All buttons, links, inputs, and controls adhere to the 44px × 44px minimum touch target guideline.
3. **Color Contrast**: Color pairings meet the WCAG AA contrast ratio threshold of **4.5:1** for body text and **3:1** for large headings.
4. **ARIA & Semantics**: Accessible names via `aria-label`, `role="switch"`, `aria-checked`, and semantic HTML5 tags (`<header>`, `<nav>`, `<main>`, `<aside>`, `<article>`).

---

## 🚀 5. Performance Guidelines & Motion Architecture

1. **Cumulative Layout Shift (CLS < 0.05)**: Standardized aspect ratios (`aspect-video`, `aspect-square`) and reserved widths for animated text.
2. **Largest Contentful Paint (LCP < 1.5s)**: Lazy-loading images (`loading="lazy"`), system font fallbacks, and optimized SVG icons.
3. **Reduced Motion**: Respects `prefers-reduced-motion` media query to disable heavy parallax animations for motion-sensitive users.
