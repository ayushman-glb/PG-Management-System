# RoomBae JWKS & RS256 Key Rotation Guide

**Date**: August 19, 2026  
**Auditor**: Principal Security Architect  
**Status**: ZERO DOWNTIME ROTATION VERIFIED

---

## 1. What Changed

1. **RS256 Asymmetric Cryptography**: Replaced symmetric shared secrets with RSA 2048-bit keypairs.
2. **Key ID (`kid`) Header**: Every signed JWT access token embeds a unique `kid` in its header.
3. **Public JWKS Endpoint**: Public endpoint mounted at `GET /.well-known/jwks.json` serving `{ keys: [...] }`.
4. **Zero-Downtime Multi-Key Retention**: Previous public keys remain stored in memory to verify in-flight tokens during rotation events.

---

## 2. Why It Changed

- Microservices, API gateways, and external verifiers can asynchronously validate user tokens using public keys without exposing private signing keys.

---

## 3. Files Modified

- Token Service: `backend/src/services/security/JwtKeyService.ts`
- JWKS Service: `backend/src/services/security/JwksService.ts`
- Express Application: `backend/src/app.ts`

---

## 4. Key Rotation Procedure

```typescript
// Rotate active signing key
const newKid = JwksService.rotateKey();
logger.info(`Key rotated successfully. New kid: ${newKid}`);
```

1. Generate new RSA keypair and prepend to `JwtKeyService.keyStore`.
2. All new tokens sign with new `kid`.
3. In-flight tokens continue to verify using retained previous public keys in `keyStore`.
4. Public `/.well-known/jwks.json` automatically reflects new key in JSON format.

---

## 5. Verification Evidence

- Verified in `jwksService.test.ts` and `jwtKeyService.test.ts`.
