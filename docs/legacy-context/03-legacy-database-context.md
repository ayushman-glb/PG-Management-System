# 03 — Legacy Database Context

## 1. Database Engine & Connection
- **Database**: MongoDB Atlas ReplicaSet (`DATABASE_URL=mongodb+srv://...`).
- **ORM**: Prisma 7 (`@prisma/client` and `prisma`).
- **Target Collections**: Users, PGs, Floors, Rooms, Beds, Bookings, Subscriptions, Invoices, Payments, Complaints, Notifications, Agreements, KYC Documents, Audit Logs.

## 2. Domain Entities & Critical Fields
1. **User & Profile**:
   - Stores identity, hashed credentials, phone, email, current address, KYC status, 2FA status, and legal acceptance records.
2. **Property Hierarchy**:
   - `PG` $\rightarrow$ `Floor` $\rightarrow$ `Room` $\rightarrow$ `Bed`.
   - `PGLocation`: structured address, locality, city, state, country, lat/long, Google Maps place ID.
   - `PGVerification`: `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`, `SUSPENDED`.
3. **Room & Bed Inventory**:
   - Room sharing: `SINGLE`, `DOUBLE`, `TRIPLE`, `FOUR_SHARING`, `CUSTOM`.
   - Bed status: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `ARCHIVED`.
   - Dynamic availability derived strictly from bed records (never hardcoded strings).
4. **Subscription Plans**:
   - `Basic`: ₹1,499/month (max 4 PGs).
   - `Professional`: ₹2,499/month (max 10 PGs).
   - `Enterprise`: ₹4,999/month (max 20 PGs).
5. **Financial Entities**:
   - `Invoice`, `Payment` (method: Razorpay / Cash / UPI / Bank Transfer), `Refund`, `Fine`.
   - Server-side GST (18%) and late fine calculations.
