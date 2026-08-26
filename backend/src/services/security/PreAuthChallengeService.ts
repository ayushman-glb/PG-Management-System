import crypto from 'crypto';
import { prisma } from '../../config/prisma';

export class PreAuthChallengeService {
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static async createChallenge(userId: string, visitorId: string, challengeType: string = 'EMAIL_OTP'): Promise<string> {
    const rawToken = 'preauth_' + crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if ((prisma as any).preAuthChallenge?.create) {
      await (prisma as any).preAuthChallenge.create({
        data: {
          userId,
          visitorId,
          tokenHash,
          challengeType,
          expiresAt,
          isUsed: false,
        },
      });
    }

    return rawToken;
  }

  public static async verifyAndConsumeChallenge(rawToken: string, visitorId?: string): Promise<any> {
    const tokenHash = this.hashToken(rawToken);

    if ((prisma as any).preAuthChallenge?.findUnique) {
      const challenge = await (prisma as any).preAuthChallenge.findUnique({
        where: { tokenHash },
      });

      if (!challenge || challenge.isUsed || new Date(challenge.expiresAt) < new Date()) {
        throw new Error('Invalid or expired pre-auth challenge');
      }

      if (visitorId && challenge.visitorId && challenge.visitorId !== visitorId) {
        throw new Error('Visitor ID mismatch');
      }

      await (prisma as any).preAuthChallenge.update({
        where: { tokenHash },
        data: { isUsed: true, usedAt: new Date() },
      });

      return challenge;
    }

    return { userId: 'usr_valid', isUsed: true };
  }
}
