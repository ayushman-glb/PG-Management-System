import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';

export class OtpService {
  public db: any = prisma;

  generateSecureOtp(): string {
    const num = crypto.randomInt(100000, 1000000);
    return num.toString();
  }

  async hashOtp(otp: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
  }

  async compareOtp(plain: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plain, hashed);
  }

  async createOrUpdateOtp(
    phone: string,
    ipAddress?: string,
    userAgent?: string,
    isResend: boolean = false
  ): Promise<{ otp: string; record: any }> {
    const existing = await this.db.phoneOTP.findFirst({
      where: { phone },
    });

    if (existing) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existing.createdAt || existing.updatedAt).getTime()) / 1000);
      if (elapsedSeconds < 30) {
        throw new Error(`Please wait ${30 - elapsedSeconds} seconds before requesting a new OTP.`);
      }

      if (isResend && (existing.resendCount >= 3 || (existing.resendCount || 0) >= 3)) {
        throw new Error('Maximum resend limit reached for this session. Please try again after 10 minutes.');
      }
    }

    const otp = this.generateSecureOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (existing && isResend) {
      const record = await this.db.phoneOTP.update({
        where: { id: existing.id },
        data: {
          hashedOtp,
          expiresAt,
          attempts: 0,
          resendCount: (existing.resendCount || 0) + 1,
        },
      });
      return { otp, record };
    }

    if (existing) {
      await this.db.phoneOTP.deleteMany({ where: { phone } });
    }

    const record = await this.db.phoneOTP.create({
      data: {
        phone,
        hashedOtp,
        expiresAt,
        attempts: 0,
        resendCount: 0,
      },
    });

    return { otp, record };
  }
}
