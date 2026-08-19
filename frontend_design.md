# 🖥️ RoomBae Responsive Frontend UI & Design System Specification (`frontend_design.md`)

> **Visual Design Specification & Responsive Architecture Document** for the RoomBae React 19 + Vite 6 + TypeScript Single Page Application (SPA).

---

## 🎨 1. Global Visual Language & Responsive Design Tokens

RoomBae uses a warm, inviting luxury palette built on relative units (`rem`, `em`, `%`, `vw`) and fluid typography `clamp()` definitions:

### 1.1 Color Engine & Tokens

- **Canvas Background (`--bg-primary`)**: `#FFF8F2` (Light) / `#1D1B1A` (Dark).
- **Surface / Sidebar (`--bg-surface`)**: `#F8EEE5` (Light) / `#2B2725` (Dark).
- **Card Fills (`--bg-card`)**: `#FFFDFB` (Light) / `#332D2B` (Dark).
- **Primary Gold Accent (`--accent-gold`)**: `#D9A87C` (Light) / `#C89A4B` (Dark).
- **Secondary Bronze Accent (`--accent-bronze`)**: `#C58B63` (Light) / `#D8B36A` (Dark).
- **High-Contrast Text (`--text-main`)**: `#3B2A24` (Light) / `#F7F3EE` (Dark).
- **Secondary Text (`--text-muted`)**: `#6E5A52` (Light) / `#C6B9AE` (Dark).
- **Structural Borders (`--border-main`)**: `#E6D7CA` (Light) / `#4A443F` (Dark).

### 1.2 Fluid Typography Scale (`clamp()`)

- **Hero Display**: `font-size: clamp(2.2rem, 5.5vw, 4.75rem); line-height: 1.08;`
- **Section Heading H1**: `font-size: clamp(1.75rem, 3.8vw, 2.75rem); line-height: 1.15;`
- **Card Heading H2**: `font-size: clamp(1.35rem, 2.8vw, 2rem); line-height: 1.25;`
- **Body Large**: `font-size: clamp(0.95rem, 1.8vw, 1.25rem); line-height: 1.6;`

---

## 📐 2. Responsive Breakpoint Rules (320px to 2560px)

RoomBae implements a 14-tier responsive breakpoint strategy:

1. **Ultra Small Mobile (`320px - 374px`)**: Icon-only logo, hidden text labels on action buttons, single column stack, 44px min touch target buttons.
2. **Small Mobile (`375px - 413px`)**: Compact search pill icon, hamburger menu drawer, responsive stat cards.
3. **Standard Mobile (`414px - 639px`)**: 1-column grid, full-width modal drawers, scrollable navigation tabs.
4. **Tablet Portrait (`640px - 767px`)**: 2-column feature cards, compact header spacing, responsive stat widgets.
5. **Tablet Landscape (`768px - 1023px`)**: Sidebar navigation drawer, 3-column feature grid, fluid hero text scaling.
6. **Laptop & Desktop (`1024px - 1439px`)**: Persistent left sidebar, 4-column metrics grid, visible search bar (`Ctrl+K`).
7. **Ultra-Wide & 4K (`1440px - 2560px`)**: Centered max-w-7xl container, floating stat card overlays (`-left-8`, `-right-8`), high-resolution visual hierarchy.

---

## 🧩 3. Core Reusable Design System Components

1. **`<Logo />` (`Logo.tsx`)**:
   - Responsive brand logo featuring `full` (Icon + Text), `compact`, and `icon-only` variants.
   - Guaranteed zero text clipping and high-contrast color tokens across light/dark themes.
2. **`<Button />` (`Button.tsx`)**:
   - Centralized UI button supporting `primary`, `secondary`, `outline`, `ghost`, and `danger` variants.
   - Meets WCAG AA 44px minimum touch target size with loading spinners and focus rings (`focus-visible`).
3. **`<TypedText />` (`TypedText.tsx`)**:
   - Layout-shift-free typing animation component with reserved container width (`min-w-[280px] sm:min-w-[360px]`).
4. **`<DashboardLayout />` (`DashboardLayout.tsx`)**:
   - Header with responsive search bar, icon-collapsed action buttons (`Verification Queue`, `Issue Fine`), and overflow protection.
