# 02 Credentials and Tasks

> Consolidated documentation chapter for **backend**

---

## Source: $relSource

# RoomBae Enterprise SaaS — Master User Credentials & Account Directory

> [!WARNING]
> **CONFIDENTIAL LOCAL REFERENCE FILE**: This document contains actual seeded user accounts, login identifiers, roles, and plaintext passwords for local development, testing, and QA validation.
> This file is explicitly listed in `.gitignore` and **WILL NOT** be pushed to GitHub or remote repositories.

---

## 🔑 Default Master Credentials Summary

- **Standard Master Password (All Seeded Users)**: `Password123!`
- **Verified Bcrypt Hash**: `$2a$10$xB8nPGQdM2lKhzU07wn3XOzKKbz36pQ4cLoPOgsXu6.yL2CVxqTvG`
- **Supported Login Identifiers**: Email Address (`owner1@roombae.com`, `resident1@roombae.com`), Resident Code (`RES1001`), or Phone (`+919876543201`).

---

## 🏢 PG Owners Directory (20 Accounts)

| # | Name | Email / Login Identifier | Role | Plaintext Password | Phone | Location | Associated PG Name |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Rajesh Kumar | `owner1@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43201` | Mumbai | RoomBae Rajesh Executive Stays |
| 2 | Anil Sharma | `owner2@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43202` | Delhi NCR | RoomBae Anil Executive Stays |
| 3 | Priya Reddy | `owner3@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43203` | Hyderabad | RoomBae Priya Executive Stays |
| 4 | Sunita Iyer | `owner4@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43204` | Pune | RoomBae Sunita Executive Stays |
| 5 | Vikram Rao | `owner5@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43205` | Bengaluru | RoomBae Vikram Executive Stays |
| 6 | Meenakshi Menon | `owner6@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43206` | Mumbai | RoomBae Meenakshi Executive Stays |
| 7 | Suresh Agarwal | `owner7@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43207` | Delhi NCR | RoomBae Suresh Executive Stays |
| 8 | Pooja Gupta | `owner8@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43208` | Hyderabad | RoomBae Pooja Executive Stays |
| 9 | Manish Deshmukh | `owner9@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43209` | Pune | RoomBae Manish Executive Stays |
| 10 | Kavita Verma | `owner10@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43210` | Bengaluru | RoomBae Kavita Executive Stays |
| 11 | Rohan Joshi | `owner11@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43211` | Mumbai | Enterprise Fleet 11 |
| 12 | Sneha Chawla | `owner12@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43212` | Delhi NCR | Enterprise Fleet 12 |
| 13 | Amit Patel | `owner13@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43213` | Hyderabad | Enterprise Fleet 13 |
| 14 | Neha Singh | `owner14@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43214` | Pune | Enterprise Fleet 14 |
| 15 | Rahul Nair | `owner15@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43215` | Bengaluru | Enterprise Fleet 15 |
| 16 | Deepak Kulkarni | `owner16@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43216` | Mumbai | Enterprise Fleet 16 |
| 17 | Ananya Bhat | `owner17@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43217` | Delhi NCR | Enterprise Fleet 17 |
| 18 | Karan Dube | `owner18@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43218` | Hyderabad | Enterprise Fleet 18 |
| 19 | Tarun Saxena | `owner19@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43219` | Pune | Enterprise Fleet 19 |
| 20 | Swati Mehta | `owner20@roombae.com` | `OWNER` | `Password123!` | `+91 98765 43220` | Bengaluru | Enterprise Fleet 20 |

---

## 🏠 Residents Directory (Sample Primary Accounts 1 - 25)

*Note: 100 resident accounts exist in total (`resident1@roombae.com` through `resident100@roombae.com`), with resident codes `RES1001` through `RES1100`.*

| Resident Code | Name | Email Address | Role | Plaintext Password | Phone | Assigned Bed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RES1001` | Sharma Kumar 1 | `resident1@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50001` | `101-A` | `ACTIVE` |
| `RES1002` | Reddy Sharma 2 | `resident2@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50002` | `101-B` | `ACTIVE` |
| `RES1003` | Iyer Reddy 3 | `resident3@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50003` | `102-A` | `ACTIVE` |
| `RES1004` | Rao Iyer 4 | `resident4@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50004` | `102-B` | `ACTIVE` |
| `RES1005` | Menon Rao 5 | `resident5@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50005` | `103-A` | `ACTIVE` |
| `RES1006` | Agarwal Menon 6 | `resident6@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50006` | `103-B` | `ACTIVE` |
| `RES1007` | Gupta Agarwal 7 | `resident7@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50007` | `104-A` | `ACTIVE` |
| `RES1008` | Deshmukh Gupta 8 | `resident8@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50008` | `104-B` | `ACTIVE` |
| `RES1009` | Verma Deshmukh 9 | `resident9@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50009` | `105-A` | `ACTIVE` |
| `RES1010` | Joshi Verma 10 | `resident10@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50010` | `105-B` | `ACTIVE` |
| `RES1011` | Chawla Joshi 11 | `resident11@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50011` | `101-A` | `ACTIVE` |
| `RES1012` | Patel Chawla 12 | `resident12@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50012` | `101-B` | `ACTIVE` |
| `RES1013` | Singh Patel 13 | `resident13@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50013` | `102-A` | `ACTIVE` |
| `RES1014` | Nair Singh 14 | `resident14@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50014` | `102-B` | `ACTIVE` |
| `RES1015` | Kulkarni Nair 15 | `resident15@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50015` | `103-A` | `ACTIVE` |
| `RES1016` | Bhat Kulkarni 16 | `resident16@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50016` | `103-B` | `ACTIVE` |
| `RES1017` | Dube Bhat 17 | `resident17@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50017` | `104-A` | `ACTIVE` |
| `RES1018` | Saxena Dube 18 | `resident18@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50018` | `104-B` | `ACTIVE` |
| `RES1019` | Mehta Saxena 19 | `resident19@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50019` | `105-A` | `ACTIVE` |
| `RES1020` | Kumar Mehta 20 | `resident20@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50020` | `105-B` | `ACTIVE` |
| `RES1021` | Sharma Kumar 21 | `resident21@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50021` | `101-A` | `ACTIVE` |
| `RES1022` | Reddy Sharma 22 | `resident22@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50022` | `101-B` | `ACTIVE` |
| `RES1023` | Iyer Reddy 23 | `resident23@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50023` | `102-A` | `ACTIVE` |
| `RES1024` | Rao Iyer 24 | `resident24@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50024` | `102-B` | `ACTIVE` |
| `RES1025` | Menon Rao 25 | `resident25@roombae.com` | `RESIDENT` | `Password123!` | `+91 91234 50025` | `103-A` | `ACTIVE` |

---

## 🛠️ Complete Residents Range (26 - 100)

All remaining residents follow the exact pattern below:
- **Email Format**: `resident<N>@roombae.com` (where N is from 26 to 100)
- **Resident Code**: `RES<1000 + N>` (e.g. `RES1026` to `RES1100`)
- **Password**: `Password123!`
- **Phone**: `+91 91234 <50000 + N>`
- **Role**: `RESIDENT`



---

## Source: $relSource

# RoomBae PG Management System — Fix Plan

## ✅ Completed Fixes (Audit-Fix Pipeline)

### Critical: PDF Generation & Download Pipeline
- [x] **F-01**: Fixed document routes ordering — named routes (`/invoice/:id`, `/receipt/:id`, etc.) now registered BEFORE generic `/:entityId/:type` route. This was the root cause of PDF API failing every time.
- [x] **F-05**: Fixed `PdfKitInvoiceService.generateInvoicePdf()` race condition — was creating empty PDFDocument and ending it immediately, corrupting downloads. Now writes complete buffer directly to output stream.
- [x] **F-08**: Fixed `useDocumentDownload` hook stale closure — added `inFlightRef` to prevent duplicate downloads and properly clear retry timers on reset.

### Security
- [x] **F-02**: Added authentication to all owner routes — previously all owner endpoints were public.
- [x] **F-04**: Removed JWT acceptance via `req.query.token` — tokens in URLs are a security risk (logged by servers, stored in browser history, leaked in Referer headers).

### API Route Compatibility
- [x] **F-03**: Added `/owners/:ownerId/status` route alias — frontend calls this but backend only had `/owners/:ownerId/progress`.

## Verification Results
- [x] Backend TypeScript compilation passes
- [x] Backend test suite: **29/29 tests passed** (4 suites)
- [x] Frontend build passes (2872 modules, 606ms)
- [x] PDF test suite: **ALL PDFKIT GENERATION & STREAM SUITE TESTS PASSED**
  - ✅ Tax Invoice PDF Buffer generated (5642 bytes, valid %PDF- header)
  - ✅ Rental Agreement PDF Buffer generated (7247 bytes, valid %PDF- header)

## Remaining Items (Require User Action / Environment)
- [ ] Update `DATABASE_URL` in Render dashboard with correct MongoDB Atlas credentials (user action)
- [ ] Verify backend connects to MongoDB after env update
- [ ] Add graceful fallback when DB is unreachable (show demo data, log warning)
- [ ] Make dashboard fully dynamic (pull from API instead of hardcoded metrics)


---

