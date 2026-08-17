import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import { JwtTokenService } from "../infrastructure/crypto/JwtTokenService";

import { registerAuthSocketHandlers } from "../modules/auth";
import { registerOwnerSocketHandlers } from "../modules/owners";
import { registerPropertySocketHandlers } from "../modules/properties";
import { registerRoomSocketHandlers } from "../modules/rooms";
import { registerBedSocketHandlers } from "../modules/beds";
import { registerResidentSocketHandlers } from "../modules/residents";
import { registerBillingSocketHandlers } from "../modules/billing";
import { registerComplaintSocketHandlers } from "../modules/complaints";
import { registerAgreementSocketHandlers } from "../modules/agreements";
import { registerNotificationSocketHandlers } from "../modules/notifications";

import { redisClient, isRedisReady } from "../config/redis";

const tokenService = new JwtTokenService();

function extractSocketUser(
  socket: Socket,
): { id: string; userId: string; role: string } | null {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return null;
    return tokenService.verifyAccessToken(token);
  } catch {
    return null;
  }
}

export class SocketServer {
  private static io: SocketIOServer | null = null;

  public static init(server: HttpServer): SocketIOServer {
    SocketServer.io = new SocketIOServer(server, {
      cors: {
        origin: (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (!origin) return callback(null, true);
          const cleanOrigin = origin.replace(/\/$/, "");
          const allowedOrigins = [
            env.CLIENT_URL,
            env.FRONTEND_URL,
            "https://ayushman-glb.github.io/PG-Management-System",
            "https://pg-management-system-boxb.onrender.com",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
          ].filter(Boolean);
          const isAllowed = allowedOrigins.some(
            (o) => o && o.replace(/\/$/, "") === cleanOrigin,
          );
          if (isAllowed) {
            return callback(null, true);
          }
          return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
      },
    });

    // Initialize Redis adapter for multi-node WebSocket scalability if Redis is active
    if (isRedisReady()) {
      try {
        const { createAdapter } = require("@socket.io/redis-adapter");
        const pubClient = redisClient.duplicate();
        const subClient = redisClient.duplicate();
        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
          SocketServer.io?.adapter(createAdapter(pubClient, subClient));
          logger.info("✅ Socket.IO Redis adapter attached for multi-instance scaling");
        }).catch((adapterErr: any) => {
          logger.warn("⚠️ Socket.IO Redis adapter connection skipped:", adapterErr.message);
        });
      } catch (err: any) {
        logger.info("ℹ️ Socket.IO operating in single-node mode");
      }
    }

    // Pre-connection Handshake Authentication Middleware
    SocketServer.io.use((socket: Socket, next: (err?: Error) => void) => {
      try {
        const token =
          (socket.handshake.auth?.token as string) ||
          (socket.handshake.headers?.authorization?.split(" ")[1] as string);

        if (!token) {
          logger.warn(`🔌 Socket connection rejected [Handshake]: No token provided (ID: ${socket.id})`);
          return next(new Error("Authentication failed: Access token missing during handshake"));
        }

        const decoded = tokenService.verifyAccessToken(token);
        (socket as any).user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          residentCode: decoded.residentCode,
        };
        next();
      } catch (err: any) {
        logger.warn(`🔌 Socket connection rejected [Handshake Invalid Token]: ${err.message} (ID: ${socket.id})`);
        return next(new Error(`Authentication failed: ${err.message || "Invalid or expired token"}`));
      }
    });

    SocketServer.io.on("connection", (socket: Socket) => {
      logger.info(`🔌 Socket connected: ${socket.id}`);
      const userId = (socket as any).user?.id;
      if (userId) {
        socket.join(`user_${userId}`);
      }

      socket.on("auth_refresh", (newToken: string) => {
        try {
          const decoded = tokenService.verifyAccessToken(newToken);
          (socket as any).user = decoded;
          socket.emit("auth_refresh_success", { status: "OK", userId: decoded.id });
          logger.info(`🔌 Socket token refreshed mid-session for user ${decoded.id} (ID: ${socket.id})`);
        } catch (err: any) {
          socket.emit("auth_refresh_failed", { error: err.message });
        }
      });

      // Register feature module socket handlers
      registerAuthSocketHandlers(socket);
      registerOwnerSocketHandlers(socket);
      registerPropertySocketHandlers(socket);
      registerRoomSocketHandlers(socket);
      registerBedSocketHandlers(socket);
      registerResidentSocketHandlers(socket);
      registerBillingSocketHandlers(socket);
      registerComplaintSocketHandlers(socket);
      registerAgreementSocketHandlers(socket);
      registerNotificationSocketHandlers(socket);

      socket.on("join_pg", (pgId: string) => {
        const user = extractSocketUser(socket);
        if (!user) {
          socket.emit("error", {
            message: "Authentication required to join PG room",
          });
          return;
        }
        socket.join(`pg_${pgId}`);
        logger.info(
          `Socket ${socket.id} (user=${user.id}) joined room pg_${pgId}`,
        );
      });

      socket.on("join_owner", (ownerId: string) => {
        const user = extractSocketUser(socket);
        if (!user) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }
        if (user.role !== "ADMIN" && user.id !== ownerId) {
          socket.emit("error", {
            message: "Unauthorized: cannot join another owner's room",
          });
          return;
        }
        socket.join(`owner_${ownerId}`);
        logger.info(`Socket ${socket.id} joined room owner_${ownerId}`);
      });

      socket.on("join_resident", (residentId: string) => {
        const user = extractSocketUser(socket);
        if (!user) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }
        if (user.role === "RESIDENT" && user.id !== residentId) {
          socket.emit("error", {
            message: "Unauthorized: cannot join another resident's room",
          });
          return;
        }
        socket.join(`resident_${residentId}`);
        logger.info(`Socket ${socket.id} joined room resident_${residentId}`);
      });

      socket.on("disconnect", () => {
        logger.info(`⚡ Socket disconnected: ${socket.id}`);
      });
    });

    logger.info("✅ Socket.IO real-time engine initialized");
    return SocketServer.io;
  }

  public static getIO(): SocketIOServer {
    if (!SocketServer.io) {
      throw new Error("Socket.IO server has not been initialized");
    }
    return SocketServer.io;
  }

  public static emitToPg(pgId: string, event: string, payload: any) {
    if (SocketServer.io) {
      SocketServer.io.to(`pg_${pgId}`).emit(event, payload);
    }
  }

  public static emitToOwner(ownerId: string, event: string, payload: any) {
    if (SocketServer.io) {
      SocketServer.io.to(`owner_${ownerId}`).emit(event, payload);
    }
  }

  public static emitToResident(
    residentId: string,
    event: string,
    payload: any,
  ) {
    if (SocketServer.io) {
      SocketServer.io.to(`resident_${residentId}`).emit(event, payload);
    }
  }

  public static emitToUser(
    userId: string,
    event: string,
    payload: any,
  ) {
    if (SocketServer.io) {
      SocketServer.io.to(`user_${userId}`).to(`owner_${userId}`).to(`resident_${userId}`).emit(event, payload);
    }
  }
}

export function getSocketServer(): SocketIOServer | null {
  try {
    return SocketServer.getIO();
  } catch {
    return null;
  }
}
