# Firebase Phone Authentication — Setup Guide & Production Best Practices

This document provides a step-by-step guide for configuring **Firebase Phone Number Authentication** in the RoomBae PG Management System.

---

## 1. Enabling Phone Provider in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (e.g. **`roombae-cff13`**).
3. In the left navigation menu, navigate to **Build → Authentication**.
4. Click on the **Sign-in method** tab.
5. Click **Add new provider** (or select **Phone** if listed under additional providers).
6. Toggle **Enable** to turn on Phone Number Authentication.
7. Save changes.

---

## 2. Adding Test Phone Numbers for Local Development

To test Phone OTP locally without burning real SMS quotas or requiring physical SIM cards:

1. In **Authentication → Sign-in method → Phone**, scroll down to **Phone numbers for testing (optional)**.
2. Click **Add test phone number**.
3. Enter a test number and a fixed 6-digit verification code:
   - **Phone number**: `+91 99999 99999` (or your preferred test format)
   - **Verification code**: `123456`
4. Click **Add**.
5. During development, using this test phone number will immediately accept `123456` without sending an actual SMS.

---

## 3. Getting Web App SDK Configuration

1. In Firebase Console, go to **Project Settings** (gear icon near top left).
2. Scroll down to the **Your apps** section.
3. If no Web app exists, click **Add app** and select the **Web (`</>`)** platform. Register app as `RoomBae Web`.
4. Copy the `firebaseConfig` keys into `frontend/.env`:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="roombae-cff13.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="roombae-cff13"
VITE_FIREBASE_STORAGE_BUCKET="roombae-cff13.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="355023139206"
VITE_FIREBASE_APP_ID="1:355023139206:web:97d27de50e591352dbfc07"
VITE_FIREBASE_MEASUREMENT_ID="G-D55WEXEQRG"
```

---

## 4. Generating Firebase Admin Service Account Key

To enable server-side ID token verification (`admin.auth().verifyIdToken()`):

1. In Firebase Console, go to **Project Settings → Service Accounts**.
2. Click **Generate new private key**.
3. Download the JSON key file.
4. Extract the following 3 fields into `backend/.env` / `backend/.env.development`:

```env
FIREBASE_PROJECT_ID="roombae-cff13"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@roombae-cff13.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Security Note**: Ensure escaped line breaks (`\n`) in `FIREBASE_PRIVATE_KEY` are preserved in your `.env` file so Node.js can parse it properly. Never commit raw service account key JSON files to version control!

---

## 5. Authorized Domains for Production

Firebase reCAPTCHA and Phone Authentication only accept requests originating from authorized domains:

1. In Firebase Console, go to **Authentication → Settings → Authorized domains**.
2. Ensure the following domains are listed:
   - `localhost` (for local development)
   - `127.0.0.1` (for local development)
   - `ayushman-glb.github.io` (for GitHub Pages deployment)
   - Your custom production domain (e.g., `app.roombae.com`)

---

## 6. Firebase Free-Tier SMS Quota Limits

- **Spark Plan (Free)**: Includes **10,000 free SMS verifications per month** for domestic numbers.
- **Quota Resets**: Resets on the 1st of every month.
- **Blaze Plan (Pay-as-you-go)**: If your volume exceeds 10,000 SMS per month, upgrade to the Blaze plan. Charges apply per SMS sent beyond the free tier (varying by country rates).
- **Anti-Abuse**: Rate limiting (`express-rate-limit` max 5 requests per 15 minutes per IP) is enforced on `POST /api/auth/phone-verify` to prevent SMS quota depletion and brute-force abuse.
