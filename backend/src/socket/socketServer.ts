import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import * as jwt from 'jsonwebtoken';
import { corsOptions } from '../config/corsOrigins';

export class SocketServer {
  private static io: SocketIOServer | null = null;

  public static init(server: HttpServer): SocketIOServer {
    SocketServer.io = new SocketIOServer(server, {
      cors: corsOptions,
      pingInterval: 25000,
      pingTimeout: 10000,
    });

    SocketServer.io.use((socket: Socket, next) => {
      const token = (socket.handshake.auth?.token as string) || (socket.handshake.headers?.authorization?.replace('Bearer ', ''));
      if (!token) {
        return next(new Error('Authentication failed: Token required'));
      }
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        if (!decoded || (!decoded.id && !decoded.userId)) {
          return next(new Error('Authentication failed: Invalid token payload'));
        }
        socket.data.userId = decoded.id || decoded.userId;
        socket.data.role = decoded.role;
        return next();
      } catch (err: any) {
        return next(new Error('Authentication failed: Invalid token'));
      }
    });

    SocketServer.io.on('connection', (socket: Socket) => {
      const userId = socket.data?.userId;
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`🔌 Socket joined room user:${userId}`);
      }

      socket.on('join_pg', (pgId: string) => {
        if (pgId) {
          socket.join(`pg:${pgId}`);
          logger.debug(`🔌 Socket joined pg:${pgId}`);
        }
      });

      socket.on('auth_refresh', (newToken: string) => {
        try {
          const decoded = jwt.verify(newToken, env.JWT_SECRET) as any;
          if (decoded && (decoded.id || decoded.userId)) {
            socket.data.userId = decoded.id || decoded.userId;
            socket.data.role = decoded.role;
            socket.emit('auth_refresh_success', { status: 'OK', userId: socket.data.userId });
          }
        } catch (err: any) {
          socket.emit('auth_refresh_failed', { error: err?.message || 'Token refresh failed' });
        }
      });

      socket.on('disconnect', () => {
        logger.debug(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    return SocketServer.io;
  }

  public static getIO(): SocketIOServer | null {
    return SocketServer.io;
  }

  public static emitToUser(userId: string, event: string, payload: any): void {
    if (SocketServer.io) {
      SocketServer.io.to(`user:${userId}`).emit(event, payload);
    }
  }

  public static emitToPG(pgId: string, event: string, payload: any): void {
    if (SocketServer.io) {
      SocketServer.io.to(`pg:${pgId}`).emit(event, payload);
    }
  }

  public static emitToPg(pgId: string, event: string, payload: any): void {
    SocketServer.emitToPG(pgId, event, payload);
  }

  public static emitToResident(residentId: string, event: string, payload: any): void {
    SocketServer.emitToUser(residentId, event, payload);
  }

  public static broadcast(event: string, payload: any): void {
    if (SocketServer.io) {
      SocketServer.io.emit(event, payload);
    }
  }
}
