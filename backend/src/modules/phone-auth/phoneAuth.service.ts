import { OtpService } from './otp.service';
import { TwilioService } from './twilio.service';
import { normalizeIndianPhone } from './phoneAuth.validation';
import { prisma } from '../../config/prisma';

export class PhoneAuthService {
  public db: any = prisma;
  public otpService: OtpService = new OtpService();
  public twilioService: TwilioService = new TwilioService();

  async sendOtp(params: {
    phone?: string;
    ipAddress?: string;
    userAgent?: string;
    isResend?: boolean;
  }): Promise<{ success: boolean; phone: string; cooldownSecondsRemaining: number }> {
    if (!params.phone || !params.phone.trim()) {
      throw new Error('A valid mobile number is required.');
    }

    const normalized = normalizeIndianPhone(params.phone);
    if (!normalized || normalized.length < 10) {
      throw new Error('A valid mobile number is required.');
    }

    const { otp } = await this.otpService.createOrUpdateOtp(
      normalized,
      params.ipAddress,
      params.userAgent,
      params.isResend
    );

    await this.twilioService.sendSms(normalized, `Your RoomBae verification code is ${otp}`);

    return {
      success: true,
      phone: normalized,
      cooldownSecondsRemaining: 30,
    };
  }

  async verifyOtp(params: {
    phone: string;
    otp: string;
    userId?: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; isPhoneVerified: boolean; verificationToken: string; user?: any }> {
    const normalized = normalizeIndianPhone(params.phone);
    const record = await this.db.phoneOTP.findFirst({
      where: { phone: normalized },
    });

    if (!record) {
      throw new Error('No active OTP request found. Please request a new OTP.');
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await this.db.phoneOTP.deleteMany({ where: { phone: normalized } });
      throw new Error('Verification code has expired. Please request a new OTP.');
    }

    const isValid = await this.otpService.compareOtp(params.otp, record.hashedOtp);

    if (!isValid) {
      const attempts = (record.attempts || 0) + 1;
      if (attempts >= 5) {
        await this.db.phoneOTP.deleteMany({ where: { phone: normalized } });
        throw new Error('Maximum verification attempts (5) exceeded. Please request a new OTP.');
      }

      await this.db.phoneOTP.update({
        where: { id: record.id },
        data: { attempts },
      });

      throw new Error(`Invalid verification code. ${5 - attempts} attempts remaining.`);
    }

    await this.db.phoneOTP.deleteMany({ where: { phone: normalized } });

    let updatedUser: any = null;
    if (params.userId && this.db.user?.update) {
      updatedUser = await this.db.user.update({
        where: { id: params.userId },
        data: {
          phone: normalized,
          phoneVerified: true,
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      isPhoneVerified: true,
      verificationToken: `vtok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      user: updatedUser,
    };
  }

  async getStatus(phone: string, userId?: string): Promise<any> {
    const normalized = normalizeIndianPhone(phone);
    let isPhoneVerified = false;

    if (userId && this.db.user?.findUnique) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
      });
      isPhoneVerified = Boolean(user?.isPhoneVerified || user?.phoneVerified);
    }

    const activeOtp = await this.db.phoneOTP.findFirst({
      where: { phone: normalized },
    });

    return {
      isPhoneVerified,
      hasActiveOtp: Boolean(activeOtp),
      cooldownSecondsRemaining: 0,
    };
  }

  async removePhone(userId: string, ipAddress?: string): Promise<{ success: boolean }> {
    if (this.db.user?.update) {
      await this.db.user.update({
        where: { id: userId },
        data: {
          phone: null,
          phoneVerified: false,
          isPhoneVerified: false,
        },
      });
    }

    return { success: true };
  }
}
