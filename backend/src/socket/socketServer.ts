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
        origin: [
          env.CLIENT_URL,
          env.FRONTEND_URL,
          "https://ayushman-glb.github.io",
          "https://ayushman-glb.github.io/PG-Management-System",
          "https://ayushman-glb.github.io/PG-Management-System/",
          "https://pg-management-system-boxb.onrender.com",
        ],
        credentials: true,
      },
    });

    SocketServer.io.on("connection", (socket: Socket) => {
      logger.info(`🔌 Socket connected: ${socket.id}`);

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
}

export function getSocketServer(): SocketIOServer | null {
  try {
    return SocketServer.getIO();
  } catch {
    return null;
  }
}
