# RoomBae — Multi-Step Signup & Onboarding Flow

This document details RoomBae's multi-step registration wizard for both **PG Owners** and **Residents**, including state persistence and resume capabilities.

---

## 1. Registration Wizard Steps

### Step 1: Role Selection
- User chooses account type: **🏠 Resident** or **🏢 PG Owner**.
- Alternative: User clicks **Continue with Google** to pre-fill profile data and jump directly to Step 2.

### Step 2: Personal Details & Verification
- **Fields**: Profile Photo, Full Name, Gender, Date of Birth, Age, Phone Number, Email, City, District, State, PIN Code, Password.
- **Verification**:
  - **Phone Verification**: Firebase Phone Auth SMS OTP.
  - **Email Verification**: Brevo SMTP 6-digit email OTP.
- **Validation**: Strict real-time Zod & regex validation (full name format, age checks, password strength rules).

### Step 3: KYC & Role-Specific Verification
- **Resident KYC**:
  - Aadhaar Document Upload (PDF or Image)
  - Signature Document Upload
  - Permanent Address & Emergency Contact
- **PG Owner Verification**:
  - Aadhaar Scan PDF
  - PAN Scan PDF
  - Address Proof & Business Trade License PDF
  - Encrypted Bank Account Details (Account Number, IFSC Code, UPI ID)

---

## 2. Incomplete Signup Resume Logic

- Every step's form state is automatically auto-saved incrementally to `localStorage` under `roombae_pending_signup_draft`.
- If a user closes the browser or loses connectivity, a prominent **"Incomplete Signup Progress Found! / Resume"** banner allows restoring all entered fields and uploaded Cloudinary file URLs with a single click.
