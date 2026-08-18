import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';
import { normalizeIndianPhone } from './phoneAuth.validation';
import { twilioService } from './twilio.service';
import { otpService } from './otp.service';
import { phoneSecurityService } from './security.service';
import { OtpLogger } from './otp.logger';
import {
  SendPhoneOtpInput,
  VerifyPhoneOtpInput,
  ResendPhoneOtpInput,
  PhoneOtpVerificationResult,
  PhoneAuthStatusResponse,
} from './phoneAuth.types';

export class PhoneAuthService {
  private db = prisma;
  private tokenService = new JwtTokenService();
  private otpService = otpService;
  private twilioService = twilioService;

  /**
   * Dispatches 6-digit OTP to user's mobile number via Twilio SMS
   */
  async sendOtp(input: SendPhoneOtpInput): Promise<{
    success: boolean;
    message: string;
    phone: string;
    expiresAt: Date;
    cooldownSecondsRemaining: number;
    isTrialNotice?: boolean;
    notice?: string;
  }> {
    const formattedPhone = normalizeIndianPhone(input.phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new AppError('A valid mobile number is required.', 400);
    }

    if (input.ipAddress) {
      await phoneSecurityService.checkRateLimits(formattedPhone, input.ipAddress);
    }

    const { otp, expiresAt, cooldownSecondsRemaining } = await this.otpService.createOrUpdateOtp(
      formattedPhone,
      input.ipAddress,
      input.userAgent,
      false
    );

    const smsResult = await this.twilioService.sendOTP(formattedPhone, otp);

    if (!smsResult.success && !smsResult.isTrialNotice) {
      await OtpLogger.log({
        phone: formattedPhone,
        action: 'OTP_SENT',
        status: 'FAILED',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        details: { error: smsResult.error },
      });
      throw new AppError(smsResult.error || 'Failed to send SMS verification code. Please try again.', 502);
    }

    await OtpLogger.log({
      phone: formattedPhone,
      action: 'OTP_SENT',
      status: 'SUCCESS',
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      details: { messageId: smsResult.messageId, isTrialNotice: smsResult.isTrialNotice },
    });

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;

    return {
      success: true,
      message: smsResult.isTrialNotice
        ? 'Verification code generated (Twilio Trial notice attached)'
        : 'Verification code sent successfully via SMS.',
      phone: formattedPhone,
      expiresAt,
      cooldownSecondsRemaining,
      isTrialNotice: smsResult.isTrialNotice,
      notice: smsResult.isTrialNotice ? smsResult.error : undefined,
      ...(process.env.NODE_ENV !== 'production' && devOtp ? { devOtp } : {}),
    };
  }

  /**
   * Resends fresh 6-digit OTP with strict cooldown and retry limits
   */
  async resendOtp(input: ResendPhoneOtpInput): Promise<{
    success: boolean;
    message: string;
    phone: string;
    expiresAt: Date;
    cooldownSecondsRemaining: number;
    isTrialNotice?: boolean;
    notice?: string;
    devOtp?: string;
  }> {
    const formattedPhone = normalizeIndianPhone(input.phone);
    if (!formattedPhone) {
      throw new AppError('A valid mobile number is required.', 400);
    }

    if (input.ipAddress) {
      await phoneSecurityService.checkRateLimits(formattedPhone, input.ipAddress);
    }

    const { otp, expiresAt, cooldownSecondsRemaining } = await this.otpService.createOrUpdateOtp(
      formattedPhone,
      input.ipAddress,
      input.userAgent,
      true
    );

    const smsResult = await this.twilioService.resendOTP(formattedPhone, otp);

    if (!smsResult.success && !smsResult.isTrialNotice) {
      await OtpLogger.log({
        phone: formattedPhone,
        action: 'OTP_RESENT',
        status: 'FAILED',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        details: { error: smsResult.error },
      });
      throw new AppError(smsResult.error || 'Failed to resend SMS verification code.', 502);
    }

    await OtpLogger.log({
      phone: formattedPhone,
      action: 'OTP_RESENT',
      status: 'SUCCESS',
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      details: { messageId: smsResult.messageId },
    });

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtpResend = process.env.NODE_ENV !== 'production' ? otp : undefined;

    return {
      success: true,
      message: 'New verification code resent successfully via SMS.',
      phone: formattedPhone,
      expiresAt,
      cooldownSecondsRemaining,
      isTrialNotice: smsResult.isTrialNotice,
      notice: smsResult.isTrialNotice ? smsResult.error : undefined,
      ...(process.env.NODE_ENV !== 'production' && devOtpResend ? { devOtp: devOtpResend } : {}),
    };
  }

  /**
   * Verifies submitted OTP against bcrypt hash, updates User verification status,
   * generates verificationToken for registration, or full JWT for active accounts
   */
  async verifyOtp(input: VerifyPhoneOtpInput): Promise<PhoneOtpVerificationResult> {
    const formattedPhone = normalizeIndianPhone(input.phone);
    if (!formattedPhone) {
      throw new AppError('A valid mobile number is required.', 400);
    }

    if (!input.otp || input.otp.length !== 6) {
      throw new AppError('A valid 6-digit verification code is required.', 400);
    }

    try {
      await this.otpService.validateOtp(formattedPhone, input.otp);
    } catch (err: any) {
      await OtpLogger.log({
        phone: formattedPhone,
        action: 'OTP_FAILED',
        status: 'FAILED',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        details: { error: err.message },
      });
      throw err;
    }

    const verifiedAt = new Date();
    const verificationToken = phoneSecurityService.createVerificationToken(formattedPhone);

    // If a user account exists with this phone number or userId, update verification status
    let user = null;
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if (input.userId) {
      user = await this.db.user.update({
        where: { id: input.userId },
        data: {
          phone: formattedPhone,
          phoneVerified: true,
          isPhoneVerified: true,
          phoneVerifiedAt: verifiedAt,
        },
      });
    } else {
      user = await this.db.user.findFirst({
        where: {
          OR: [{ phone: formattedPhone }, { phone: formattedPhone.replace('+91', '') }],
        },
      });

      if (user) {
        user = await this.db.user.update({
          where: { id: user.id },
          data: {
            phone: formattedPhone,
            phoneVerified: true,
            isPhoneVerified: true,
            phoneVerifiedAt: verifiedAt,
          },
        });

        // Generate session tokens if login purpose
        if (input.purpose === 'LOGIN' || input.purpose === 'PHONE_LOGIN') {
          const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
          accessToken = this.tokenService.generateAccessToken(payload);
          refreshToken = this.tokenService.generateRefreshToken(payload);
        }
      }
    }

    await OtpLogger.log({
      phone: formattedPhone,
      action: 'OTP_VERIFIED',
      status: 'SUCCESS',
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      details: { userId: user?.id, isPhoneVerified: true },
    });

    return {
      success: true,
      message: 'Mobile number verified successfully.',
      phone: formattedPhone,
      isPhoneVerified: true,
      phoneVerifiedAt: verifiedAt,
      verificationToken,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            isPhoneVerified: user.isPhoneVerified ?? user.phoneVerified ?? true,
          }
        : undefined,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Returns phone verification status and OTP timer state
   */
  async getStatus(phone?: string, userId?: string): Promise<PhoneAuthStatusResponse> {
    let targetPhone = phone ? normalizeIndianPhone(phone) : '';
    let isPhoneVerified = false;
    let phoneVerifiedAt: Date | null = null;

    if (userId) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
      });
      if (user) {
        if (!targetPhone && user.phone) {
          targetPhone = normalizeIndianPhone(user.phone);
        }
        isPhoneVerified = Boolean(user.isPhoneVerified || user.phoneVerified);
        phoneVerifiedAt = user.phoneVerifiedAt || null;
      }
    }

    const otpStatus = targetPhone
      ? await this.otpService.getStatus(targetPhone)
      : {
          hasActiveOtp: false,
          cooldownSecondsRemaining: 0,
          attemptsRemaining: 5,
          resendsRemaining: 3,
        };

    return {
      phone: targetPhone,
      isPhoneVerified,
      phoneVerifiedAt,
      hasActiveOtp: otpStatus.hasActiveOtp,
      cooldownSecondsRemaining: otpStatus.cooldownSecondsRemaining,
      attemptsRemaining: otpStatus.attemptsRemaining,
      resendsRemaining: otpStatus.resendsRemaining,
    };
  }

  /**
   * Removes phone number and unlinks verification for authenticated user
   */
  async removePhone(userId: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const previousPhone = user.phone || 'unknown';

    await this.db.user.update({
      where: { id: userId },
      data: {
        phone: null,
        phoneVerified: false,
        isPhoneVerified: false,
        phoneVerifiedAt: null,
      },
    });

    await OtpLogger.log({
      phone: previousPhone,
      action: 'PHONE_REMOVED',
      status: 'SUCCESS',
      ipAddress,
      details: { userId },
    });

    return {
      success: true,
      message: 'Mobile number unlinked and removed successfully.',
    };
  }
}

export const phoneAuthService = new PhoneAuthService();
