# RoomBae — API Reference (REST & GraphQL)

This document provides a reference for RoomBae's core REST endpoints and GraphQL queries/mutations.

---

## 1. REST Media Endpoints (`/api/v1/media`)

- `POST /api/v1/media/upload/single`: Upload a single image or document.
- `POST /api/v1/media/upload/multiple`: Upload array of up to 10 files.
- `PUT /api/v1/media/replace/:publicId`: Replace existing Cloudinary asset and update metadata.
- `DELETE /api/v1/media/:publicId`: Delete single asset from Cloudinary and MongoDB.
- `POST /api/v1/media/bulk-delete`: Delete array of publicIds.
- `GET /api/v1/media/metadata/:publicId`: Fetch asset metadata from Cloudinary & DB.
- `PATCH /api/v1/media/reorder`: Reorder asset references for an entity.

---

## 2. REST Auth Endpoints (`/api/v1/auth`)

- `POST /api/v1/auth/register`: User registration.
- `POST /api/v1/auth/login`: User login.
- `POST /api/v1/auth/send-otp`: Send email OTP.
- `POST /api/v1/auth/verify-otp`: Verify email OTP.
- `GET /api/v1/auth/me`: Get current authenticated user profile.

---

## 3. GraphQL Mutations (`/graphql`)

```graphql
type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(identifier: String!, pass: String!): AuthPayload!
  sendPhoneOTP(phone: String!): StatusResponse!
  verifyPhoneOTP(phone: String!, otp: String!): StatusResponse!
  sendEmailOTP(email: String!): StatusResponse!
  verifyEmailOTP(email: String!, code: String!): StatusResponse!
}
```
