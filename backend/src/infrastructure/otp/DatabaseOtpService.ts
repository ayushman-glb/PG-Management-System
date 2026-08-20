import crypto from "crypto";
import { IOtpService } from "../../interfaces/infrastructure/IOtpService";
import { emailService } from "../../services/email";
import { logger } from "../../utils/logger";
import { prisma } from "../../config/prisma";

export class DatabaseOtpService implements IOtpService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_TTL_SECONDS = 300; // 5 Minutes
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly PHONE_OTP_TTL_SECONDS = 300;

  generateSecureOtp(length: number = DatabaseOtpService.OTP_LENGTH): string {
    const digits = "0123456789";
    let otp = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % digits.length];
    }
    return otp;
  }

  /**
   * Hash an OTP with SHA-256 before storing — OTPs must never be stored in plaintext.
   */
  private hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  async generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string; devOtp?: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + DatabaseOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp({ email, purpose: "EMAIL_VERIFICATION", otp, expiresAt });
    await this.sendEmailOtp(email, otp, expiresAt);

    logger.info("OTP generated and sent", { email, purpose: "EMAIL_OTP" });

    const devOtp = process.env.NODE_ENV !== "production" ? otp : undefined;

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${email}`,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async generateAndSendPhoneOtp(
    phone: string,
  ): Promise<{ otp: string; expiresAt: Date; message: string; timerSeconds: number; devOtp?: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + DatabaseOtpService.PHONE_OTP_TTL_SECONDS * 1000);

    await this.storeOtp({ phone, purpose: "PHONE_VERIFICATION", otp, expiresAt });

    // Check if we have an email for this phone — send via email as fallback
    const user = await prisma.user.findFirst({
      where: { phone: { equals: phone, mode: "insensitive" } },
    });

    if (user?.email) {
      await this.sendEmailOtp(user.email, otp, expiresAt);
      logger.info("Phone OTP sent via email fallback", { phone, email: user.email });
    } else {
      logger.warn("Phone OTP requested but no email found for user", { phone });
    }

    const devOtp = process.env.NODE_ENV !== "production" ? otp : undefined;

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${phone}. We've sent the code to the email on file.`,
      timerSeconds: DatabaseOtpService.OTP_TTL_SECONDS,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
    return this.verifyOtp({ phone, purpose: "PHONE_VERIFICATION", otp });
  }

  async generateAndSendEmailVerification(
    email: string,
  ): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }> {
    const code = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + DatabaseOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp({ email, purpose: "EMAIL_VERIFICATION", otp: code, expiresAt });
    await this.sendVerificationEmail(email, code, expiresAt);

    logger.info("Email verification code generated and sent", { email });

    const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;

    return {
      code,
      expiresAt,
      message: `Verification code sent to ${email}`,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return this.verifyOtp({ email, purpose: "EMAIL_VERIFICATION", otp: code });
  }

  async generateAndSendPasswordReset(email: string): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }> {
    const code = this.generateSecureOtp(6);
    const expiresAt = new Date(Date.now() + DatabaseOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp({ email, purpose: "PASSWORD_RESET", otp: code, expiresAt });

    const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;

    return {
      code,
      expiresAt,
      message: `Password reset code sent to ${email}`,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    return this.verifyOtp({ email, purpose: "PASSWORD_RESET", otp: code });
  }

  private async storeOtp(params: {
    email?: string;
    phone?: string;
    purpose: string;
    otp: string;
    expiresAt: Date;
  }): Promise<void> {
    const hashedOtp = this.hashOtp(params.otp);

    try {
      await prisma.otpToken.create({
        data: {
          email: params.email ? params.email.toLowerCase() : undefined,
          phone: params.phone,
          otp: hashedOtp,
          purpose: params.purpose,
          attempts: 0,
          verified: false,
          expiresAt: params.expiresAt,
        },
      });
      logger.debug("OTP persisted in MongoDB OtpToken", { purpose: params.purpose, email: params.email, phone: params.phone });
    } catch (mongoErr: any) {
      logger.warn("Failed to persist OTP in MongoDB", { error: mongoErr.message });
    }
  }

  private async verifyOtp(params: {
    email?: string;
    phone?: string;
    purpose: string;
    otp: string;
  }): Promise<boolean> {
    const hashedInput = this.hashOtp(params.otp);
    const email = params.email ? params.email.toLowerCase() : undefined;
    const phone = params.phone;

    let mongoOtpRecord: any = null;
    try {
      mongoOtpRecord = await prisma.otpToken.findFirst({
        where: {
          ...(email && { email: { equals: email, mode: "insensitive" } }),
          ...(phone && { phone: { equals: phone, mode: "insensitive" } }),
          purpose: params.purpose,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (mongoReadErr: any) {
      logger.error("Error reading OTP from MongoDB", { error: mongoReadErr.message });
      return false;
    }

    if (!mongoOtpRecord) {
      logger.warn("OTP verification failed: Record not found or expired", { email, phone, purpose: params.purpose });
      return false;
    }

    if (mongoOtpRecord.attempts >= DatabaseOtpService.MAX_ATTEMPTS) {
      logger.warn("OTP verification blocked due to max attempts", { attempts: mongoOtpRecord.attempts });
      return false;
    }

    const isValid = mongoOtpRecord.otp === hashedInput;

    if (!isValid) {
      const newAttempts = mongoOtpRecord.attempts + 1;
      try {
        await prisma.otpToken.update({
          where: { id: mongoOtpRecord.id },
          data: { attempts: newAttempts },
        });
      } catch {}
      logger.warn("Invalid OTP supplied", { attempts: newAttempts, maxAttempts: DatabaseOtpService.MAX_ATTEMPTS });
      return false;
    }

    // Mark verified and consumed
    try {
      await prisma.otpToken.update({
        where: { id: mongoOtpRecord.id },
        data: {
          verified: true,
          consumedAt: new Date(),
        },
      });
    } catch (updateErr: any) {
      logger.error("Error marking OTP as verified in Mongo", { error: updateErr.message });
    }

    logger.info("OTP verification successful", { email, phone, purpose: params.purpose });
    return true;
  }

  private async sendEmailOtp(email: string, otp: string, expiresAt: Date): Promise<void> {
    try {
      await emailService.sendVerificationCodeEmail(email, otp);
    } catch (err: any) {
      logger.error("Failed to send Email OTP", { email, error: err.message });
    }
  }

  private async sendVerificationEmail(email: string, code: string, expiresAt: Date): Promise<void> {
    try {
      await emailService.sendVerificationCodeEmail(email, code);
    } catch (err: any) {
      logger.error("Failed to send Verification Email", { email, error: err.message });
    }
  }
}
