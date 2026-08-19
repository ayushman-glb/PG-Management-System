# RoomBae — Google Sign-Up & OAuth 2.0 Integration

This document describes RoomBae's "Sign Up with Google" autofill integration using Google OAuth 2.0.

---

## 1. Flow Diagram

```text
User Clicks "Continue with Google"
   │
   ▼
Google OAuth 2.0 Client Authentication
   │
   ▼
Google OAuth Popup Verification
   │
   ▼
Returns User Profile: { displayName, email, photoURL }
   │
   ▼
Autofill Step 2 Registration Fields:
   ├── Full Name = displayName
   ├── Email = email (marked isEmailVerified = true)
   └── Profile Photo = photoURL
   │
   ▼
Advances UI directly to Step 2 (Personal Details)
User completes remaining fields (DOB, Gender, Phone, Address)
   │
   ▼
Continues to Step 3 (KYC / Documents) -> Complete Registration
```

---

## 2. Advantages

1. **Skips Manual Email Verification**: Email is pre-verified by Google.
2. **Instant Pre-fill**: Eliminates manual typing of name and email.
3. **Unified Schema**: Creates identical user records in MongoDB regardless of auth method used.
