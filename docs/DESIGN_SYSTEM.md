# 🎨 RoomBae Aether Design System Specification (`docs/DESIGN_SYSTEM.md`)

> **Document Purpose**: Technical reference for the RoomBae design system tokens, typography, component radius guidelines, and theme contrast rules derived from the Aether design specification (`aether-traverse-the-unknown-DESIGN.md`).

---

## 🎨 1. Design Tokens & Color Palette

The RoomBae interface implements the **Aether Design System**, anchored in warm bronze/tan accents and deep dark surfaces for high-density dashboard layouts, paired with a readable high-contrast light theme.

| Token Name | CSS Variable | Light Theme | Dark Theme | Purpose |
|---|---|---|---|---|
| **Primary** | `--color-aether-primary` | `#B08D6A` | `#B08D6A` | Core brand color, active highlights, primary buttons |
| **Secondary** | `--color-aether-secondary` | `#FAF9F6` | `#000000` | Canvas background |
| **Accent** | `--color-aether-accent` | `#8E7B68` | `#8E7B68` | Subdued borders, secondary metrics |
| **Surface** | `--color-dark-surface` | `#F4F1EA` | `#121212` | Card backgrounds, drawer panels |
| **Card** | `--color-dark-card` | `#FFFFFF` | `#18181B` | Elevated bento cards, data grid items |
| **Text Primary** | `--color-dark-text` | `#18181B` | `#FFFFFF` | High-contrast headings and body text |
| **Text Muted** | `--color-dark-text2` | `#52525B` | `#A1A1AA` | Subtitles, labels, metadata |
| **Border** | `--color-dark-border` | `#E4E4E7` | `#27272A` | Structural container dividers |

---

## ✒️ 2. Typography Hierarchy

- **Display & Headings**: `Inter` (`font-display` / `font-sans`) - Weights 600, 700, 800, 900.
- **Body & Editorial Copy**: `Oswald` (`font-body`) - Weights 400, 500, 600.
- **Technical Metadata & Status Badges**: `JetBrains Mono` (`font-mono`) - Monospaced 12px / 10px uppercase labels, transaction IDs, status pills.

---

## 📐 3. Spacing & Border Radius

- **Card Radius**: `11px` (`rounded-xl` / `var(--radius)`).
- **Control Radius**: `11px` (`rounded-xl` for input fields, primary buttons).
- **Pill Radius**: `9999px` (`rounded-full` for status tags, filter tabs).
- **Grid Gap Base**: `16px` (`gap-4`).
- **Card Content Padding**: `24px` (`p-6`).

---

## 🌓 4. Accessibility & Dual-Theme Support

Both Light and Dark themes strictly adhere to **WCAG AA contrast requirements**:
- Dark theme utilizes true black `#000000` canvas with `#18181B` elevated cards for low eyestrain.
- Light theme utilizes clean off-white `#FAF9F6` canvas with high-contrast `#18181B` primary text.
- Focus rings are styled with `focus-visible:ring-2 focus-visible:ring-[#B08D6A]`.
