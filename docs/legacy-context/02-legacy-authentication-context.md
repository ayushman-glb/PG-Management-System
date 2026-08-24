# 02 — Legacy Authentication & Authorization Context

## 1. Roles in Legacy System
The legacy system defined the following role enum:
- `GOD` / `SUPER_ADMIN`
- `ADMIN`
- `OWNER`
- `MANAGER`
- `STAFF`
- `RESIDENT`
- `PUBLIC`

### Rebuild Standardization:
Per the SRS rules, the system is strictly refactored around 3 primary roles:
- `ADMIN`
- `PG_OWNER` (with sub-delegation to Manager/Staff where configured)
- `RESIDENT`

## 2. Authentication Flows & Identity Rules
1. **Multi-Identifier Login**:
   - Login supports: Username + Password, Email + Password, or Phone + Password.
2. **Password Security**:
   - Argon2id / bcrypt hashing with salt rounds.
   - Enforced complexity: minimum 8 characters with upper, lower, numeric, and symbol checks.
3. **Two-Factor Authentication (2FA)**:
   - Email OTP (6-digit numeric) with a 10-minute expiration window and 3-attempt brute force limit.
4. **Device Management & FingerprintJS**:
   - Tracks `visitorId`, `deviceLabel`, `browser`, `os`, `ipAddress`, and `primary` device flag.
   - The first verified login registers as `PRIMARY`.
   - Subsequent logins notify the user but do not block legitimate access.
   - Primary device ownership transfer is restricted strictly to the current primary device.
5. **Token Lifecycle**:
   - Short-lived Access Token (15m).
   - Long-lived Refresh Token (7d) stored securely with rotation and reuse detection.
