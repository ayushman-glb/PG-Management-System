import { IOtpService } from '../../interfaces/infrastructure/IOtpService';
import { logger } from '../../utils/logger';

export class MockOtpService implements IOtpService {
  generateSecureOtp(length: number = 6): string {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
  }

  async generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string; devOtp?: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    logger.info(`[OTP] Mock OTP for ${email} (${otp}) - WebOTP format: @roombae.com #${otp}`);
    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${email}`,
      ...(process.env.NODE_ENV !== 'production' && devOtp ? { devOtp } : {}),
    };
  }

  async generateAndSendPhoneOtp(phone: string): Promise<{ otp: string; expiresAt: Date; message: string; timerSeconds: number; devOtp?: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    logger.info(`[OTP] Mock Phone OTP for ${phone} (${otp})`);
    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${phone}`,
      timerSeconds: 300,
      ...(process.env.NODE_ENV !== 'production' && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
    return true;
  }

  async generateAndSendEmailVerification(email: string): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }> {
    const code = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`[OTP] Mock Email Verification Code for ${email} (${code})`);
    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== 'production' ? code : undefined;

    return {
      code,
      expiresAt,
      message: `Verification code sent to ${email}`,
      ...(process.env.NODE_ENV !== 'production' && devOtp ? { devOtp } : {}),
    };
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return true;
  }

  async generateAndSendPasswordReset(email: string): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }> {
    const code = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`[OTP] Mock Password Reset Code for ${email} (${code})`);
    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== 'production' ? code : undefined;

    return {
      code,
      expiresAt,
      message: `Password reset code sent to ${email}`,
      ...(process.env.NODE_ENV !== 'production' && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    return true;
  }
}
