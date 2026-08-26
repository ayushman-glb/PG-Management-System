import { SocketServer } from '../../socket/socketServer';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';
import { tokenBlacklistService } from '../tokenBlacklistService';
import { TokenVersionService } from './TokenVersionService';

export class SocketSessionService {
  private static io: any = null;
  private static jwtTokenService = new JwtTokenService();

  public static registerIO(io: any): void {
    this.io = io;
  }

  public static async revokeUserSockets(userId: string, reason: string = 'SESSION_REVOKED'): Promise<void> {
    try {
      if (this.io) {
        this.io.to(`user_${userId}`).emit('auth:revoked', { userId, reason });
        if (this.io.sockets?.sockets) {
          for (const [, socket] of this.io.sockets.sockets) {
            if (socket.data?.userId === userId) {
              socket.disconnect(true);
            }
          }
        }
      }
      SocketServer.emitToUser(userId, 'auth:revoked', { userId, reason });
    } catch {
      // Non-blocking
    }
  }

  public static async authenticateSocket(socket: any, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = this.jwtTokenService.verifyAccessToken(token);
      if (!decoded || (!decoded.id && !decoded.userId)) {
        return next(new Error('Invalid token'));
      }

      const userId = decoded.id || decoded.userId;

      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return next(new Error('Token has been revoked or blacklisted'));
      }

      const isValidVersion = await TokenVersionService.isValidTokenVersion(userId, decoded.tokenVersion || 1);
      if (!isValidVersion) {
        return next(new Error('Session invalidated or token version revoked. Please sign in again.'));
      }

      const timeRemaining = decoded.exp ? decoded.exp * 1000 - Date.now() : 15 * 60 * 1000;
      const disconnectTimer = setTimeout(() => {
        socket.emit?.('auth:revoked', { reason: 'TOKEN_EXPIRED' });
        socket.disconnect?.(true);
      }, Math.max(100, timeRemaining));
      if (disconnectTimer.unref) disconnectTimer.unref();

      socket.data = {
        userId,
        email: decoded.email,
        role: decoded.role,
        tokenVersion: decoded.tokenVersion,
        exp: decoded.exp,
        disconnectTimer,
      };

      if (typeof socket.join === 'function') {
        socket.join(`user_${userId}`);
        if (decoded.role) {
          socket.join(`${decoded.role.toLowerCase()}_${userId}`);
        }
      }

      next();
    } catch (err: any) {
      next(new Error(err?.message || 'Socket authentication failed'));
    }
  }

  public static async authorizeSocketEvent(socket: any, eventData: any, next: (err?: Error) => void): Promise<void> {
    try {
      const userId = socket.data?.userId;
      const tokenVersion = socket.data?.tokenVersion;
      const exp = socket.data?.exp;

      if (!userId) {
        return next(new Error('Unauthorized socket event'));
      }

      if (exp && exp * 1000 < Date.now()) {
        socket.emit?.('auth:revoked', { reason: 'TOKEN_EXPIRED' });
        socket.disconnect?.(true);
        return next(new Error('Token expired'));
      }

      const isValid = await TokenVersionService.isValidTokenVersion(userId, tokenVersion);
      if (!isValid) {
        socket.emit?.('auth:revoked', { reason: 'TOKEN_VERSION_MISMATCH' });
        socket.disconnect?.(true);
        return next(new Error('Session revoked or token version superseded'));
      }

      next();
    } catch (err: any) {
      socket.disconnect?.(true);
      next(new Error(err?.message || 'Socket authorization failed'));
    }
  }
}
