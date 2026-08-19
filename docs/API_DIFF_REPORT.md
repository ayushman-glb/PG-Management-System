# RoomBae API Contract Diff & Route Inventory Report

**Date**: August 19, 2026  
**Auditor**: Principal API Architect & Frontend Lead  
**Scope**: REST API Envelopes, CSRF Headers, Error Structures, and Status Codes  
**Status**: ✅ **100% STANDARDIZED & VERIFIED**

---

## 1. Executive Summary

This report documents the API contract standardization across all RoomBae endpoints. All endpoints strictly conform to standard Success and Error response envelopes, enforce CSRF headers for state-mutating requests, and utilize uniform HTTP status codes.

---

## 2. API Envelope Standard

### Success Envelope (HTTP 200 / 201)

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### Error Envelope (HTTP 400 / 401 / 403 / 404 / 409 / 422 / 429 / 500)

```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  error?: {
    code: string;
    message: string;
    action?: string;
  };
}
```

---

## 3. Core Authentication Route Inventory

| HTTP Method | Route Path | Rate Limit | CSRF Protected | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/csrf` | General | No | No | Retrieves active CSRF token and sets `csrf-token` cookie. |
| `POST` | `/api/v1/auth/register` | 5 req / 1 hr | Yes (`X-CSRF-Token`) | No | Registers Resident or Owner with atomic profile creation. |
| `POST` | `/api/v1/auth/login` | 5 req / 15 min | Yes (`X-CSRF-Token`) | No | Unified multi-identifier login with risk evaluation. |
| `POST` | `/api/v1/auth/verify-2fa` | 5 req / 15 min | Yes (`X-CSRF-Token`) | No | Validates step-up 2FA pre-auth challenge token. |
| `POST` | `/api/v1/auth/refresh-token` | General | Exempt | HttpOnly Cookie | Rotates access token and refreshes opaque session. |
| `POST` | `/api/v1/auth/logout` | General | Yes (`X-CSRF-Token`) | Optional | Single device logout, revokes DB token and blacklists JWT. |
| `POST` | `/api/v1/auth/logout-all` | General | Yes (`X-CSRF-Token`) | Yes | Mass revocation, increments `tokenVersion`, evicts sockets. |
| `POST` | `/api/v1/auth/send-otp` | 3 req / 10 min | Yes (`X-CSRF-Token`) | No | Dispatches 6-digit phone/email verification OTP. |
| `POST` | `/api/v1/auth/verify-otp` | General | Yes (`X-CSRF-Token`) | No | Atomically validates and consumes single-use OTP. |
| `GET` | `/api/v1/auth/google` | General | No | No | Initiates Google OAuth with HMAC-signed state and PKCE. |
| `GET` | `/api/v1/auth/google/callback` | General | Exempt | No | Google OAuth authorization callback and session exchange. |
