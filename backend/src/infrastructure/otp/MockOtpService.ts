import { IOtpService } from '../../interfaces/infrastructure/IOtpService';
import { logger } from '../../utils/logger';

export class MockOtpService implements IOtpService {
  async generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    logger.info(`[OTP DISPATCH] Dispatched OTP ${otp} to ${email} for WebOTP format: @roombae.com #${otp}`);
    return {
      otp,
      expiresAt,
      message: `OTP successfully sent to ${email}`
    };
  }
}
