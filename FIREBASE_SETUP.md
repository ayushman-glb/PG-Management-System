# RoomBae — Firebase Authentication & Setup Guide

This document describes the setup, configuration, and environment rules for Firebase Authentication and Firebase Admin SDK in RoomBae.

---

## 1. Environment Configurations

### Backend Credentials (`backend/.env`)
- `FIREBASE_PROJECT_ID="roombae-cff13"`
- `FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@roombae-cff13.iam.gserviceaccount.com"`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."`

### Frontend Credentials (`frontend/.env`)
- `VITE_FIREBASE_API_KEY="..."`
- `VITE_FIREBASE_AUTH_DOMAIN="roombae-cff13.firebaseapp.com"`
- `VITE_FIREBASE_PROJECT_ID="roombae-cff13"`
- `VITE_FIREBASE_STORAGE_BUCKET="roombae-cff13.firebasestorage.app"`

---

## 2. Firebase Billing & Phone Authentication Rules

1. **Firebase Blaze Plan Requirement**: Real SMS OTP delivery requires the Firebase Project (`roombae-cff13`) to be upgraded to the **Blaze (Pay-As-You-Go)** plan in the Firebase Console. On the Spark plan, Firebase returns `auth/billing-not-enabled`.
2. **Local/Dev Verification Fallback**: In development or test environments, mock code `123456` or test phone numbers configured in Firebase Console can be used to bypass SMS charges.
3. **reCAPTCHA Verifier**: Initialized on invisible containers (`#recaptcha-container`) attached to the DOM before `signInWithPhoneNumber` is invoked.
