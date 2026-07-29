# PG Manager - Figma Handoff

## Purpose

This document is the source-of-truth handoff for recreating the current PG Manager web experience in Figma. It describes the implemented page inventory, visual system, responsive frames, reusable components, interaction states, and prototype connections.

The current app is a React/Vite prototype. The page navigation is represented as an in-app prototype flow rather than URL routes.

## Product Direction

PG Manager is a premium operations workspace for paying guest property owners and managers.

The experience should feel:

- Professional and trustworthy
- Calm during repeated operational work
- Data-dense but easy to scan
- Friendly to both property owners and residents
- Polished without looking decorative

## Figma File Structure

Create one Figma file with these pages:

1. `00 - Cover`
2. `01 - Foundations`
3. `02 - Components`
4. `03 - Public Website`
5. `04 - Owner Dashboard`
6. `05 - Resident Experience`
7. `06 - Responsive QA`
8. `07 - Prototype Flow`

### Cover

Include:

- Product name: PG Manager
- Subtitle: Paying Guest Management System
- Version: Web prototype handoff
- Theme samples: Light and Dark
- Breakpoint samples: Desktop, Tablet, Mobile
- Owner flow entry point: Landing -> Auth -> Dashboard

## Page Inventory

### Public Website

| Page             | Route key          | Primary purpose                                           |
| ---------------- | ------------------ | --------------------------------------------------------- |
| Landing          | `landing`          | Product introduction, features, pricing, FAQs, conversion |
| PG Listing       | `pg-listing`       | Search and browse available PG accommodations             |
| PG Details       | `pg-details`       | Inspect a property, select a room, book a visit           |
| About            | `about`            | Company and product story                                 |
| Blog             | `blog`             | Product and property-management guidance                  |
| Careers          | `careers`          | Hiring and company culture                                |
| Press            | `press`            | Company and media information                             |
| Changelog        | `changelog`        | Product updates                                           |
| Roadmap          | `roadmap`          | Upcoming product direction                                |
| Documentation    | `documentation`    | Product usage guidance                                    |
| Help Center      | `help-center`      | Support and troubleshooting entry point                   |
| API Reference    | `api-reference`    | Integration information                                   |
| Status           | `status`           | Service health overview                                   |
| Privacy Policy   | `privacy-policy`   | Privacy information                                       |
| Terms of Service | `terms-of-service` | Usage terms                                               |
| Cookie Policy    | `cookie-policy`    | Cookie information                                        |

### Authentication

| State           | Route key           | Primary purpose           |
| --------------- | ------------------- | ------------------------- |
| Sign in         | `auth`              | Owner/resident login      |
| Register        | internal Auth state | Create account            |
| Forgot password | internal Auth state | Start password reset      |
| OTP             | internal Auth state | Verify phone code         |
| Two-factor auth | internal Auth state | Verify authenticator code |

### Owner Workspace

| Page          | Route key       | Primary purpose                                       |
| ------------- | --------------- | ----------------------------------------------------- |
| Dashboard     | `dashboard`     | Portfolio overview and daily priorities               |
| Properties    | `properties`    | Property cards, occupancy, bed allocation             |
| Rooms         | `rooms`         | Room availability and maintenance overview            |
| Beds          | `beds`          | Bed assignment and status overview                    |
| Residents     | `residents`     | Resident list, profile, payments, timeline            |
| Payments      | `billing`       | Invoices and transactions                             |
| Complaints    | `complaints`    | Kanban complaint management                           |
| Visitors      | `visitors`      | Visitor activity overview                             |
| Expenses      | `billing`       | Expense entry point in current prototype              |
| Analytics     | `analytics`     | Revenue, occupancy, payments, complaints, predictions |
| Notifications | `notifications` | Alerts and activity overview                          |
| Settings      | `settings`      | Workspace settings overview                           |

## Frame Sizes

Create the following base frames for every major page:

- Desktop: `1440 x 1024`
- Laptop: `1280 x 900`
- Tablet: `834 x 1194`
- Mobile: `390 x 844`
- Small mobile: `320 x 780`

For the owner workspace, also create a wide dashboard frame at `1600 x 1000` to validate chart and table density.

## Foundations

### Colors

| Token           | Value     | Usage                                      |
| --------------- | --------- | ------------------------------------------ |
| Background      | `#F8FAFC` | Public page and workspace light background |
| Foreground      | `#0F172A` | Primary headings and high-emphasis text    |
| Card            | `#FFFFFF` | Cards, panels, forms                       |
| Muted           | `#F1F5F9` | Inputs, filters, secondary surfaces        |
| Muted text      | `#64748B` | Supporting copy and metadata               |
| Border          | `#E2E8F0` | Dividers and card outlines                 |
| Primary         | `#2563EB` | Main actions, links, active states         |
| Secondary       | `#7C3AED` | Gradients, premium accents                 |
| Accent          | `#14B8A6` | Positive or operational accent             |
| Success         | `#16A34A` | Paid, active, resolved                     |
| Warning         | `#F59E0B` | Due, pending, attention                    |
| Danger          | `#EF4444` | Late, high priority, destructive           |
| Dark background | `#020617` | Dark body background                       |
| Dark surface    | `#1E293B` | Dark cards and navigation                  |
| Dark border     | `#334155` | Dark dividers                              |
| Dark text       | `#F8FAFC` | Dark primary text                          |
| Dark muted text | `#CBD5E1` | Dark secondary text                        |

### Typography

- Font family: Inter
- Body: 14-16 px, line height 1.5
- Small metadata: 12 px
- Labels: 12-14 px, semibold
- Card headings: 16-20 px, bold
- Page headings: 28-32 px, black/900 weight
- Landing hero: 56-72 px on desktop, 40-48 px on mobile
- Use normal letter spacing; do not compress headings

### Shape and Elevation

- Default card radius: 16 px
- Large hero or CTA radius: 24 px
- Small controls: 8-12 px
- Primary buttons: 12-16 px
- Card border: 1 px `#E2E8F0`
- Card shadow: soft, low-opacity blue/slate shadow
- Glass navigation: white at 70-90% opacity, 12 px blur

### Spacing

Use an 8 px base grid:

- 4 px: icon gaps and tiny metadata spacing
- 8 px: compact control spacing
- 12 px: button and list spacing
- 16 px: card padding and section gaps
- 24 px: panel padding
- 32 px: page section spacing
- 48-96 px: marketing section spacing

## Global Components

Create components with variants in `02 - Components`:

### Navigation

- Public navbar: logo, Features, Pricing, About, Blog, Find PGs, Sign in, Start Free Trial
- Mobile navbar: logo, menu button, stacked menu
- Dashboard sidebar: icon, label, active, hover, collapsed
- Dashboard top bar: search, Back, theme selector, notifications, avatar
- Content-page header: logo and Back control

### Buttons

Variants:

- Primary blue
- Secondary outline
- Neutral surface
- Danger
- Icon-only
- Loading
- Disabled

States:

- Default
- Hover
- Pressed
- Focused
- Disabled
- Loading

### Theme Selector

Fixed top-left control with two choices:

- Light: sun icon + Light label
- Dark: moon icon + Dark label

Create both light and dark selected variants. It should not overlap the logo or page content.

### Back Button

Fixed top-right control on internal pages:

- Arrow-left icon
- `Back` label on tablet/desktop
- Icon-only presentation on very small screens
- Hover and focus states
- Returns to previous page in the prototype flow

### Cards

Variants:

- Standard content card
- Stat card
- Feature card
- Property card
- Testimonial card
- Pricing card
- Empty state card
- Dark surface card

### Forms

Components:

- Text input
- Password input
- Search input
- Select
- Date input
- Range slider
- Textarea
- OTP input
- Toggle
- Checkbox

States:

- Default
- Focus
- Filled
- Error
- Disabled
- Dark theme

### Feedback

- Loading overlay
- Loading dots
- Page entrance animation
- Toast success
- Toast error
- Empty state
- Modal overlay
- Confirmation dialog

## Page Specifications

### Landing Page

Frame sections in order:

1. Fixed glass navbar
2. Hero with headline, supporting copy, primary CTA, demo CTA
3. Dashboard mockup with floating cards
4. Trusted logos and statistics
5. Features grid
6. Dashboard preview cards
7. Why PG Manager timeline
8. Testimonials
9. Pricing cards with monthly/yearly toggle
10. FAQ accordion
11. Gradient conversion CTA
12. Footer

Prototype links:

- Logo -> Landing
- Features -> Features section
- Pricing -> Pricing section
- About -> About
- Blog -> Blog
- Find PGs -> PG Listing
- Sign in / Start Free Trial -> Auth
- Watch Demo -> Demo modal
- Dashboard preview -> Dashboard
- Complaint Status -> Complaints
- Recent Residents -> Residents
- Browse PG Listings -> PG Listing
- Footer pages -> matching content page

### Authentication

Create one frame per state:

- Sign in, owner selected
- Sign in, resident selected
- Register, owner selected
- Register, resident selected
- Forgot password
- OTP verification
- Two-factor authentication

Show the left image panel on desktop and hide it on mobile. Preserve a clear single-column form on mobile.

### Dashboard

Desktop layout:

- 256 px sidebar
- Top bar with search and actions
- Scrollable content region
- 6 KPI cards
- Revenue/expenses chart
- Occupancy donut
- Resident growth chart
- Payment status chart
- Recent activity
- Recent residents table

Mobile layout:

- Sidebar becomes a drawer
- KPI cards become two columns
- Charts become single column
- Tables scroll horizontally or become list cards

### Properties

Include:

- Property card grid
- Selected property state
- Occupancy indicator
- Bed allocation grid
- Occupied, vacant, and maintenance states
- Add-property modal
- Drag state for bed allocation
- Dark-mode modal variant

### Residents

Include:

- Search and filter toolbar
- Resident list selected/unselected states
- Profile header
- Contact row
- Overview, Payments, Timeline tabs
- KYC status badge
- Payment status badge
- Responsive mobile detail screen

### Billing

Include:

- KPI summary cards
- Invoice/Transactions segmented control
- Search and status filters
- Invoice table
- Transaction table
- Paid, Due, and Late status badges
- Reminder and export action states

### Complaints

Include:

- Three-column Kanban board
- Pending, In Progress, Resolved columns
- High, Medium, Low priority states
- Complaint detail modal
- New Complaint modal
- Dragging and drop target states
- Mark Resolved confirmation state

### Analytics

Include:

- Time period selector: 7d, 30d, 90d, 1y
- Revenue vs Target chart
- Occupancy by Property chart
- Payment Collections chart
- Complaints by Category donut
- Occupancy Heatmap
- Vacancy Prediction card
- Loading and empty chart states

### PG Listing

Include:

- Search header
- Filters expanded/collapsed
- Type filter chips
- Maximum price slider
- Sort selector
- Property cards
- Favorite selected/unselected state
- No-results state

### PG Details

Include:

- Image gallery
- Property overview
- Amenities
- Room selector
- Move-in date control
- Book Visit CTA
- Schedule Call CTA
- Booking confirmation modal
- Selected room state

### Content Pages

Use one reusable template for About, Blog, Careers, Press, Changelog, Roadmap, Documentation, Help Center, API Reference, Status, Privacy, Terms, and Cookies:

- Minimal public header
- Home logo action
- Top-right Back control
- Eyebrow label
- Large title and description
- Three supporting content cards
- Gradient CTA panel
- Light and dark variants

## Prototype Connections

Primary owner flow:

```text
Landing
  -> Auth
  -> Dashboard
  -> Properties
  -> Residents
  -> Billing
  -> Complaints
  -> Analytics
```

Public discovery flow:

```text
Landing
  -> PG Listing
  -> PG Details
  -> Book Visit modal
```

Content flow:

```text
Landing
  -> About / Blog / Careers / Press
  -> Changelog / Roadmap
  -> Documentation / Help Center / API Reference / Status
  -> Privacy / Terms / Cookies
```

For every transition:

- Use the existing loading overlay as a short transition state
- Scroll the next screen to the top
- Preserve selected theme
- Provide a Back action on non-home pages

## Responsive Rules

- Never allow the theme selector to overlap the logo or page title
- Keep buttons at least 44 px tall on touch screens
- Collapse desktop nav to a menu below 768 px
- Collapse dashboard sidebar into a drawer below 1024 px
- Use one-column content cards below 768 px
- Let tables scroll horizontally on small screens
- Keep text inside its parent container; avoid clipped headings
- Keep modal content inside the viewport with scrollable body content
- Maintain visible focus states for keyboard navigation

## QA Checklist

### Visual

- [ ] Light theme checked on every page
- [ ] Dark theme checked on every page
- [ ] No white modal or input remains in dark theme
- [ ] No text overlaps the theme selector or Back button
- [ ] Charts have readable labels in both themes
- [ ] Mobile pages do not overflow horizontally
- [ ] Long content pages remain readable at 320 px width

### Interaction

- [ ] Logo returns to Landing
- [ ] Back returns to the previous screen
- [ ] Landing CTAs reach the correct destination
- [ ] Watch Demo opens and closes
- [ ] Pricing toggle changes visual state
- [ ] FAQ accordion opens and closes
- [ ] PG Listing filters update the visible state
- [ ] PG Details room selection updates the booking panel
- [ ] Dashboard navigation highlights the active page
- [ ] Theme selection persists across page changes

### Handoff Notes

- Use Auto Layout for all reusable components.
- Use component properties for theme, state, and content variants.
- Use variables for colors, spacing, radius, and typography.
- Name layers by purpose, not by visual order.
- Keep prototype interactions on the `07 - Prototype Flow` page.
- Keep responsive variants grouped together in `06 - Responsive QA`.
