import { IOtpService } from '../../interfaces/infrastructure/IOtpService';
import { logger } from '../../utils/logger';

export class MockOtpService implements IOtpService {
  generateSecureOtp(length: number = 6): string {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
  }

  async generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    logger.info(`[OTP] Mock OTP for ${email} (${otp}) - WebOTP format: @roombae.com #${otp}`);
    return {
      otp,
      expiresAt,
      message: `OTP sent to ${email}`,
    };
  }

  async generateAndSendPhoneOtp(phone: string): Promise<{ otp: string; expiresAt: Date; message: string; timerSeconds: number }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    logger.info(`[OTP] Mock Phone OTP for ${phone} (${otp})`);
    return {
      otp,
      expiresAt,
      message: `OTP sent to ${phone}`,
      timerSeconds: 300,
    };
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
    return true;
  }

  async generateAndSendEmailVerification(email: string): Promise<{ code: string; expiresAt: Date; message: string }> {
    const code = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`[OTP] Mock Email Verification Code for ${email} (${code})`);
    return {
      code,
      expiresAt,
      message: `Verification code sent to ${email}`,
    };
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return true;
  }
}
