# RoomBae PG Management System — Configuration Guide

---

## 1. Environment Configuration

All backend environment variables are validated at startup using Zod in `backend/src/config/env.ts`. If any mandatory variable is missing or invalid, the process fails fast with an explicit error output.

### Mandatory Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `development` / `production` |
| `PORT` | Backend HTTP server port | `5000` |
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/roombae` |
| `JWT_SECRET` | Primary JWT signing key (min 16 chars) | `your_super_secret_jwt_key_32_chars_min` |
| `AES_256_KEY` | Sensitive data encryption key (32 chars) | `your_aes_256_encryption_key_32_chars` |
| `ENCRYPTION_KEY` | System payload encryption key | `your_system_payload_key_32_chars_min` |
| `KYC_ENCRYPTION_KEY` | Resident document encryption key | `your_kyc_encryption_key_32_chars_min` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

---

## 2. Optional Third-Party Service Credentials

| Variable | Integration | Description |
| :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Razorpay | Live payment gateway Merchant Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay | Merchant API Secret Key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Asset upload cloud account name |
| `CLOUDINARY_API_KEY` | Cloudinary | Asset upload API key |
| `CLOUDINARY_API_SECRET` | Cloudinary | Asset upload API secret |
| `SMTP_HOST` | Brevo / Email | Mail transfer agent host (`smtp-relay.brevo.com`) |
| `SMTP_USER` | Brevo / Email | SMTP login username |
| `SMTP_PASS` | Brevo / Email | SMTP login password |
