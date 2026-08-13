# Out-of-Scope Security & Payment Findings Flagged for Review

> [!NOTE]
> Per task directives, the following findings fall within Category 1 (Auth/RBAC/Session) or Category 2 (Razorpay payment/webhook path). They have been left un-mutated in the codebase and are documented here for independent review.

---

## Category 1 — Auth / RBAC / Session Path Findings

1. **File:** `backend/src/modules/auth/auth.service.ts` (L339–L352)
   - **Severity:** Critical
   - **Description:** Admin 2FA enforcement bypass. Admin accounts with `is2FAEnabled === false` bypass the 2FA step-up pre-auth gate and receive full access/refresh token pairs.
2. **File:** `backend/src/middleware/authMiddleware.ts` (L77)
   - **Severity:** High
   - **Description:** `tokenVersion` check is skipped if `decoded.tokenVersion === undefined`, allowing older or omitted tokens to bypass token revocation permanently.
3. **File:** `backend/src/middleware/authMiddleware.ts` (L39)
   - **Severity:** High
   - **Description:** Hardcoded fallback secret `'dev_secret_change_me_in_production'` used if `JWT_SECRET` is missing from environment.

---

## Category 2 — Razorpay Payment & Webhook Path Findings

1. **File:** `backend/src/modules/payments/payment.service.ts`
   - **Severity:** Medium
   - **Description:** Webhook signature verification uses standard string equality instead of constant-time `crypto.timingSafeEqual`, posing a timing attack risk on webhook verification payloads.
