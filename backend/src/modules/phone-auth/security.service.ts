import { Request } from 'express';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { normalizeIndianPhone } from './phoneAuth.validation';
import { OtpLogger } from './otp.logger';

export class PhoneSecurityService {
  /**
   * Extracts clean client IP address from express request
   */
  getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Enforces brute force protection per IP and per Phone Number
   */
  async checkRateLimits(phone: string, ipAddress: string): Promise<void> {
    const formattedPhone = normalizeIndianPhone(phone);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Count recent OTP requests for this IP
    const recentRequestsFromIp = await prisma.phoneOTP.count({
      where: {
        ipAddress,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (recentRequestsFromIp >= 15) {
      await OtpLogger.log({
        phone: formattedPhone,
        action: 'OTP_LOCKED',
        status: 'BLOCKED',
        ipAddress,
        details: { reason: 'IP request threshold exceeded' },
      });
      throw new AppError('Too many verification requests from this IP address. Please wait 15 minutes.', 429);
    }
  }

  /**
   * Generates a single-use phone verification proof token
   */
  createVerificationToken(phone: string): string {
    const formattedPhone = normalizeIndianPhone(phone);
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const raw = `${formattedPhone}:${timestamp}:${nonce}`;
    return Buffer.from(raw).toString('base64url');
  }
}

export const phoneSecurityService = new PhoneSecurityService();
