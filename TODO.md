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