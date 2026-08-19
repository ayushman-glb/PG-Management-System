import { Server as SocketIOServer, Socket } from "socket.io";
import { JwtTokenService } from "../../infrastructure/crypto/JwtTokenService";
import { tokenBlacklistService } from "../tokenBlacklistService";
import { TokenVersionService } from "./TokenVersionService";
import { logger } from "../../utils/logger";

const tokenService = new JwtTokenService();

export interface SocketAuthData {
  userId: string;
  email: string;
  role: string;
  residentCode?: string;
  tokenVersion: number;
  exp: number;
  deviceId?: string;
  disconnectTimer?: NodeJS.Timeout;
}

/**
 * Continuous WebSocket Authorization & Live Session Revocation Service
 * 
 * Enforces Zero-Trust authorization on all real-time Socket.IO connections.
 * - Authenticates signature, blacklist status, and tokenVersion during handshake.
 * - Enforces continuous packet-level authorization middleware (`authorizeSocketEvent`).
 * - Schedules strict expiration disconnect timers to prevent zombie sockets.
 * - Exposes real-time revocation broadcast (`auth:revoked`) to immediately terminate client sessions.
 */
export class SocketSessionService {
  private static ioInstance: SocketIOServer | null = null;

  public static registerIO(io: SocketIOServer): void {
    this.ioInstance = io;
  }

  /**
   * Middleware for Socket.IO connection handshake
   */
  public static async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const rawToken =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.headers?.authorization?.split(" ")[1] as string) ||
        (socket.handshake.query?.token as string);

      const deviceId =
        (socket.handshake.auth?.deviceId as string) ||
        (socket.handshake.headers?.["x-device-id"] as string) ||
        (socket.handshake.query?.deviceId as string);

      if (!rawToken) {
        logger.warn(`🔌 Socket rejected: No access token provided (ID: ${socket.id})`);
        return next(new Error("Authentication failed: Access token required during handshake"));
      }

      // 1. Verify JWT signature & expiration
      const decoded = tokenService.verifyAccessToken(rawToken);

      // 2. Verify Blacklist in Redis
      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(rawToken);
      if (isBlacklisted) {
        logger.warn(`🔌 Socket rejected: Access token is blacklisted (ID: ${socket.id})`);
        return next(new Error("Authentication failed: Token has been revoked"));
      }

      // 3. Verify Token Version against Authoritative Store / Cache
      const isValidVersion = await TokenVersionService.isValidTokenVersion(decoded.id, decoded.tokenVersion);
      if (!isValidVersion) {
        logger.warn(`🔌 Socket rejected: Stale token version for user ${decoded.id} (ID: ${socket.id})`);
        return next(new Error("Authentication failed: Session invalidated by recent password change or revocation"));
      }

      // 4. Attach Session Metadata to Socket
      const expUnixSeconds = decoded.exp || Math.floor(Date.now() / 1000) + 900;
      const remainingSeconds = Math.max(0, expUnixSeconds - Math.floor(Date.now() / 1000));

      const authData: SocketAuthData = {
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role,
        residentCode: decoded.residentCode,
        tokenVersion: decoded.tokenVersion ?? 0,
        exp: expUnixSeconds,
        deviceId,
      };

      // 5. Schedule Automated Disconnect Timer to prevent Zombie Sockets
      if (remainingSeconds > 0) {
        authData.disconnectTimer = setTimeout(() => {
          logger.info(`🔌 Disconnecting expired socket for user ${decoded.id} (ID: ${socket.id})`);
          socket.emit("auth:expired", { message: "Access token lifetime expired" });
          socket.disconnect(true);
        }, remainingSeconds * 1000);
        authData.disconnectTimer.unref();
      }

      socket.data = authData;
      (socket as any).user = authData;

      // Automatically join appropriate rooms
      this.joinUserRooms(socket, decoded.id, decoded.role);

      next();
    } catch (err: any) {
      logger.warn(`🔌 Socket rejected: Invalid handshake token (${err.message}) (ID: ${socket.id})`);
      return next(new Error(`Authentication failed: ${err.message || "Invalid token"}`));
    }
  }

  /**
   * Automatically joins user rooms based on role and id
   */
  public static joinUserRooms(socket: Socket, userId: string, role?: string): void {
    if (!userId) return;
    if (typeof socket.join === "function") {
      socket.join(`user_${userId}`);
      if (role === "OWNER") {
        socket.join(`owner_${userId}`);
      } else if (role === "RESIDENT") {
        socket.join(`resident_${userId}`);
      }
    }
  }

  /**
   * Continuous authorization guard for every incoming privileged socket packet/event
   */
  public static async authorizeSocketEvent(
    socket: Socket,
    packet: [string, ...any[]],
    next: (err?: Error) => void
  ): Promise<void> {
    const eventName = packet[0];
    const authData = socket.data as SocketAuthData | undefined;

    // Public / system events bypass
    if (!authData || eventName === "ping" || eventName === "pong") {
      return next();
    }

    try {
      // 1. Verify token expiration
      const nowUnix = Math.floor(Date.now() / 1000);
      if (authData.exp && authData.exp <= nowUnix) {
        socket.emit("auth:expired", { message: "Access token expired" });
        socket.disconnect(true);
        return next(new Error("Unauthorized: Access token expired"));
      }

      // 2. Verify tokenVersion consistency
      const isVersionValid = await TokenVersionService.isValidTokenVersion(
        authData.userId,
        authData.tokenVersion
      );

      if (!isVersionValid) {
        logger.warn(`🔌 Socket event blocked: Stale token version for user ${authData.userId} on event ${eventName}`);
        socket.emit("auth:revoked", { reason: "TOKEN_VERSION_STALE" });
        socket.disconnect(true);
        return next(new Error("Unauthorized: Session revoked"));
      }

      next();
    } catch (err: any) {
      logger.error("Error authorizing socket event", { error: err.message, eventName });
      return next(new Error("Unauthorized: Authorization evaluation error"));
    }
  }

  /**
   * Broadcasts live session revocation to all connected sockets of a user and forcibly disconnects them.
   */
  public static revokeUserSockets(userId: string, reason: string = "SESSION_REVOKED"): void {
    if (!userId || !this.ioInstance) return;

    logger.info(`🔌 Broadcasting auth:revoked and terminating sockets for user ${userId}`, { reason });

    // 1. Emit live revocation event to user's private rooms
    const targetRooms = [`user_${userId}`, `owner_${userId}`, `resident_${userId}`];
    for (const room of targetRooms) {
      this.ioInstance.to(room).emit("auth:revoked", {
        userId,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Forcibly close all socket connections for this user
    try {
      const sockets = this.ioInstance.sockets.sockets;
      sockets.forEach((socket: Socket) => {
        if (socket.data?.userId === userId || (socket as any).user?.id === userId) {
          if (socket.data?.disconnectTimer) {
            clearTimeout(socket.data.disconnectTimer);
          }
          socket.disconnect(true);
        }
      });
    } catch (disconnectErr: any) {
      logger.warn("Error disconnecting user sockets", { userId, error: disconnectErr.message });
    }
  }
}
