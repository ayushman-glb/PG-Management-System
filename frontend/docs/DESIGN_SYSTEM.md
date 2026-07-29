# Luxury Hospitality Design System Specification

**Project:** PG Management System (Room Bae)  
**Design Philosophy:** Boutique Luxury Stay & Premium Living (Inspired by Airbnb, Booking.com, Linear, Stripe, Apple)  

---

## 🎨 Color Palette & Tokens

### ☀️ Theme 1 — Light Mode (Warm Boutique Luxury)

- **Background:** `#FFF8F2` (Warm Soft Cream)
- **Surface:** `#F8EEE5` (Secondary Cream Surface)
- **Cards:** `#FFFDFB` (Pure Cream Card Container)
- **Primary Accent:** `#D9A87C` (Warm Bronze)
- **Secondary Accent:** `#C58B63` (Deep Bronze/Terracotta)
- **Highlight:** `#E7C4A0` (Gold Sand Highlight)
- **Text Primary:** `#3B2A24` (Deep Warm Espresso)
- **Text Secondary:** `#6E5A52` (Muted Cocoa)
- **Border:** `#E6D7CA` (Subtle Cream Border)
- **Success:** `#5E9F72` (Soft Forest Sage)
- **Warning:** `#D9A441` (Warm Honey Amber)
- **Danger:** `#D96B5D` (Soft Muted Crimson)

---

### 🌙 Theme 2 — Dark Mode (Rolex / Luxury Night Mode)

- **Background:** `#1D1B1A` (Deep Obsidian Espresso)
- **Surface:** `#2B2725` (Charcoal Surface)
- **Cards:** `#332D2B` (Warm Dark Card Container)
- **Primary Gold:** `#C89A4B` (Refined Gold Accent)
- **Secondary Gold:** `#D8B36A` (Champagne Gold Accent)
- **Highlight Gold:** `#E8C98A` (Bright Gold Highlight)
- **Text Primary:** `#F7F3EE` (Warm Off-White)
- **Text Secondary:** `#C6B9AE` (Muted Warm Taupe)
- **Borders:** `#4A433F` (Deep Charcoal Border)

---

## 🔤 Typography System

- **Font Family:** `Poppins`, sans-serif (Google Fonts)
- **Scale:**
  - `Display / Hero`: `2.5rem` / `3.5rem` (40px / 56px), `font-black`, line-height `1.1`
  - `Heading 1`: `1.875rem` (30px), `font-black` / `font-bold`, line-height `1.2`
  - `Heading 2`: `1.5rem` (24px), `font-bold`, line-height `1.3`
  - `Heading 3`: `1.25rem` (20px), `font-bold`, line-height `1.3`
  - `Body`: `0.875rem` / `1rem` (14px / 16px), `font-normal` / `font-medium`, line-height `1.6`
  - `Caption / Eyebrow`: `0.75rem` (12px), `font-semibold` / `font-bold`, tracking `0.05em`

---

## 🔘 Component Utility Classes (`src/index.css`)

### Primary Button
```css
.luxury-btn-primary {
  background: linear-gradient(135deg, #D9A87C 0%, #C58B63 100%);
  color: #FFFFFF;
  border-radius: 0.75rem;
  box-shadow: 0 4px 14px rgba(217, 168, 124, 0.35);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
html.dark-theme .luxury-btn-primary {
  background: linear-gradient(135deg, #C89A4B 0%, #D8B36A 100%);
  color: #1D1B1A;
  box-shadow: 0 4px 14px rgba(200, 154, 75, 0.3);
}
```

### Secondary Button
```css
.luxury-btn-secondary {
  background: #FFFDFB;
  border: 1.5px solid #E6D7CA;
  color: #3B2A24;
  border-radius: 0.75rem;
}
html.dark-theme .luxury-btn-secondary {
  background: #332D2B;
  border: 1.5px solid #4A433F;
  color: #F7F3EE;
}
```

### Inputs & Selects
```css
.luxury-input {
  background: #FFFDFB;
  border: 1.5px solid #E6D7CA;
  color: #3B2A24;
  border-radius: 0.75rem;
  padding: 0.625rem 1rem;
}
.luxury-input:focus {
  border-color: #D9A87C;
  box-shadow: 0 0 0 3px rgba(217, 168, 124, 0.2);
}
```

---

## ♿ Accessibility & Focus Standards
- Minimum Touch Target: `44px x 44px`
- Focus Rings: Visible `2px` focus-visible ring with theme accent colors
- Color Contrast: WCAG 2.1 AA compliant across text/background pairings
