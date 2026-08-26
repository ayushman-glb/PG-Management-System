import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export function parseDurationToSeconds(duration: string | number): number {
  if (typeof duration === 'number') return duration;
  if (!duration || typeof duration !== 'string') return 900;

  const match = duration.trim().match(/^(\d+)([smhd]?)$/i);
  if (!match) return parseInt(duration, 10) || 900;

  const val = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();

  switch (unit) {
    case 'm':
      return val * 60;
    case 'h':
      return val * 3600;
    case 'd':
      return val * 86400;
    case 's':
    default:
      return val;
  }
}

export class TokenBlacklistService {
  private localCache = new Map<string, number>();

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async blacklistToken(token: string, reason: string = 'REVOKED', customExpiresAt?: Date): Promise<void> {
    const tokenHash = this.hashToken(token);
    let expiresAt = customExpiresAt;

    if (!expiresAt) {
      const decoded: any = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      } else {
        expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      }
    }

    if (expiresAt.getTime() <= Date.now()) {
      return;
    }

    this.localCache.set(tokenHash, expiresAt.getTime());

    if ((prisma as any).revokedToken?.upsert) {
      await (prisma as any).revokedToken.upsert({
        where: { tokenHash },
        create: { tokenHash, expiresAt, reason },
        update: { expiresAt, reason },
      });
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const cachedExp = this.localCache.get(tokenHash);

    if (cachedExp) {
      if (Date.now() < cachedExp) {
        return true;
      }
      this.localCache.delete(tokenHash);
    }

    if ((prisma as any).revokedToken?.findUnique) {
      const dbRecord = await (prisma as any).revokedToken.findUnique({
        where: { tokenHash },
      });

      if (dbRecord && new Date(dbRecord.expiresAt).getTime() > Date.now()) {
        this.localCache.set(tokenHash, new Date(dbRecord.expiresAt).getTime());
        return true;
      }
    }

    return false;
  }

  async pruneExpiredTokens(): Promise<number> {
    const now = Date.now();
    for (const [hash, exp] of this.localCache.entries()) {
      if (exp <= now) {
        this.localCache.delete(hash);
      }
    }

    if ((prisma as any).revokedToken?.deleteMany) {
      const res = await (prisma as any).revokedToken.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
      return res.count || 0;
    }

    return 0;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
