# RoomBae Audit: WebSocket Security & Real-Time Duplex Channel

**Date**: August 19, 2026  
**Auditor**: Principal Software Architect  
**Status**: AUDIT COMPLETE — REMEDIATION PLANNED

---

## 1. Existing Implementation

- **Server Engine**: Socket.IO v4.8.3 with Redis pub/sub adapter clustering.
- **Handshake Authentication**: Initial connection validates RS256 JWT access token via `SocketSessionService.authenticateSocket`.
- **Packet Middleware**: Continuous authorization middleware `authorizeSocketEvent` validating `tokenVersion` and session validity on every incoming packet.
- **Heartbeat & Disconnect**: 25s ping interval, 10s timeout, and dynamic token expiry disconnect timer.
- **Live Revocation**: `auth:revoked` broadcast to `user_<userId>` room on logout-all or session compromise.

---

## 2. Problems Found

| Problem Area | Existing Code Pattern | File Locations | Root Cause |
| :--- | :--- | :--- | :--- |
| **Static Handshake Check Only** | Sockets remaining connected indefinitely after token revocation if only checked at handshake. | `backend/src/socket/socketServer.ts` | Missing continuous event-level packet inspection middleware. |
| **Missing Dynamic Timer** | Sockets persisting after access token expiration without graceful reconnection trigger. | `backend/src/services/security/SocketSessionService.ts` | Lack of `setTimeout` disconnect scheduled at `exp * 1000 - Date.now()`. |
| **Silent Dropping on Logout** | Sockets disconnected abruptly without client notification event. | `backend/src/services/security/SessionRevocationService.ts` | Lack of explicit `auth:revoked` event emission before socket disconnect. |

---

## 3. File Locations

- Socket Server: `backend/src/socket/socketServer.ts`
- Socket Session Service: `backend/src/services/security/SocketSessionService.ts`
- Revocation Engine: `backend/src/services/security/SessionRevocationService.ts`

---

## 4. Root Cause

Initial WebSocket integration treated authentication as a one-time connection handshake rather than an active, continuous zero-trust session.

---

## 5. Refactor Strategy

1. **Continuous Packet Guard**: Mount `authorizeSocketEvent` packet middleware checking `TokenVersionService.isValidTokenVersion` on every incoming frame.
2. **Dynamic Expiry Disconnect**: Schedule automatic disconnection exactly when the access token reaches its expiration timestamp.
3. **Explicit Revocation Broadcast**: Emit `auth:revoked` with revocation reason prior to terminating socket connections across the Redis cluster.
