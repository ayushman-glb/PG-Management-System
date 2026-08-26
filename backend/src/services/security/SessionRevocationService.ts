import { prisma } from '../../config/prisma';
import { SocketSessionService } from './SocketSessionService';
import { TokenVersionService } from './TokenVersionService';

export class SessionRevocationService {
  public static async revokeAllSessions(
    userId: string,
    reason: string = 'SESSION_REVOCATION',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (typeof (prisma as any).$transaction === 'function') {
      await (prisma as any).$transaction(async (tx: any) => {
        if (tx.refreshToken?.updateMany) {
          await tx.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
        if (tx.user?.update) {
          await tx.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
            select: { tokenVersion: true },
          });
        }
      });
    } else {
      if ((prisma as any).refreshToken?.updateMany) {
        await (prisma as any).refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      if ((prisma as any).user?.update) {
        await (prisma as any).user.update({
          where: { id: userId },
          data: { tokenVersion: { increment: 1 } },
          select: { tokenVersion: true },
        });
      }
    }

    await TokenVersionService.syncCache(userId);
    await SocketSessionService.revokeUserSockets(userId, reason);

    if ((prisma as any).securityAuditEvent?.create) {
      await (prisma as any).securityAuditEvent.create({
        data: {
          userId,
          eventType: 'SESSION_REVOKED',
          severity: 'HIGH',
          metadata: { reason },
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    }
  }

  public static async revokeForPasswordReset(userId: string): Promise<void> {
    await this.revokeAllSessions(userId, 'PASSWORD_RESET');
  }

  public static async revokeForReuseDetection(userId: string, tokenSnippet: string): Promise<void> {
    await this.revokeAllSessions(userId, `TOKEN_REUSE_DETECTED:${tokenSnippet}`);
  }

  public static async revokeForAdmin(userId: string, adminId: string, reason: string): Promise<void> {
    await this.revokeAllSessions(userId, `ADMIN_ACTION:${adminId}:${reason}`);
  }
}
