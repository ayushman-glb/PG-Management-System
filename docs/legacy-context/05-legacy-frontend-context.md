# 05 — Legacy Frontend Context

## 1. Frontend Technology Stack
- **Framework**: React 19 SPA with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS, custom tokens in `index.css`.
- **Icons & Animation**: Lucide React, Framer Motion.
- **State Management**: Zustand stores (`useUIStore`, `useAuthStore`, `useBookingStore`).
- **Device Identity**: `@fingerprintjs/fingerprintjs`.
- **Charts & Visualizations**: Recharts.

## 2. Key Portals & Screen Structure
1. **Public Experience**:
   - Modern Landing Page with hero, value propositions, and live PG discovery teaser.
   - PG Search / Listings page with map integration, interactive filters (Price, Gender, Sharing, Amenities).
   - PG Details page with room types, bed availability counts, photo galleries, food schedules, and "Apply / Book" modal.
2. **Resident Portal**:
   - Active stay overview: assigned PG, room, bed, Wi-Fi password, food schedule.
   - Rent payment dashboard with invoice breakdown, GST split, and Razorpay/Manual upload options.
   - Digital agreement review and signature canvas.
   - Complaint ticketing with real-time progress tracker.
   - Room change request and move-out checkout interface.
3. **Owner Dashboard**:
   - Comprehensive property and floor/room/bed management.
   - Real-time Booking Kanban Board with drag/click state transitions.
   - Resident roster with check-in/out records.
   - Billing & manual payment verification queue.
   - P&L Analytics (rent collected vs expenses vs occupancy).
4. **Admin Console**:
   - High-level platform KPIs (MRR, active owners, verified PGs, platform health).
   - PG verification queue with listing approval / rejection controls.
   - Owner KYC inspection and document viewer.
   - User directory and system audit log viewer.
