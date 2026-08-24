# 06 — Legacy Integrations Context

## 1. External Third-Party Services
The system relies on four primary third-party services configured via environment variables:

### 1. Razorpay
- **Purpose**: PG Owner SaaS subscriptions, Resident advance/rent/deposit payments.
- **Config Variables**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- **Security Protocols**:
  - Server-side signature verification using HMAC SHA-256.
  - Webhook idempotency using `x-razorpay-event-id` or internal transaction state deduplication.
  - Never trust client-reported `paymentSuccess=true`.

### 2. Cloudinary
- **Purpose**: Secure media hosting for PG property images, room photos, KYC ID proofs, and signed agreement documents.
- **Config Variables**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`.
- **Handling**: Binary files uploaded via Multer, passed to Cloudinary, metadata (public_id, secure_url, resource_type) saved in MongoDB.

### 3. Gmail SMTP (Nodemailer)
- **Purpose**: Transactional emails, 2FA OTP codes, registration verification, invoice/receipt PDF delivery, and complaint status updates.
- **Config Variables**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_APP_PASSWORD`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`.

### 4. Twilio
- **Purpose**: Phone verification OTPs and urgent transactional SMS alerts.
- **Config Variables**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
