import crypto from "crypto";
import { IOtpService } from "../../interfaces/infrastructure/IOtpService";
import { emailService } from "../../services/email";
import { logger } from "../../utils/logger";
import { redisClient, isRedisReady } from "../../config/redis";
import { prisma } from "../../config/prisma";

export class RedisOtpService implements IOtpService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_TTL_SECONDS = 300;
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ATTEMPTS_TTL_SECONDS = 600;
  private static readonly PHONE_OTP_TTL_SECONDS = 300;

  generateSecureOtp(length: number = RedisOtpService.OTP_LENGTH): string {
    const digits = "0123456789";
    let otp = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % digits.length];
    }
    return otp;
  }

  async generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + RedisOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp(`otp:email:${email}`, otp, RedisOtpService.OTP_TTL_SECONDS);
    await this.sendEmailOtp(email, otp, expiresAt);

    logger.info("OTP generated and sent", { email, purpose: "EMAIL_OTP" });

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${email}`,
    };
  }

  async generateAndSendPhoneOtp(
    phone: string,
  ): Promise<{ otp: string; expiresAt: Date; message: string; timerSeconds: number }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + RedisOtpService.PHONE_OTP_TTL_SECONDS * 1000);

    await this.storeOtp(`otp:phone:${phone}`, otp, RedisOtpService.PHONE_OTP_TTL_SECONDS);

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

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${phone}. We've sent the code to the email on file.`,
      timerSeconds: RedisOtpService.OTP_TTL_SECONDS,
    };
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
    return this.verifyOtp(`otp:phone:${phone}`, otp);
  }

  async generateAndSendEmailVerification(
    email: string,
  ): Promise<{ code: string; expiresAt: Date; message: string }> {
    const code = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + RedisOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp(`otp:verify:${email}`, code, RedisOtpService.OTP_TTL_SECONDS);
    await this.sendVerificationEmail(email, code, expiresAt);

    logger.info("Email verification code generated and sent", { email });

    return {
      code,
      expiresAt,
      message: `Verification code sent to ${email}`,
    };
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return this.verifyOtp(`otp:verify:${email}`, code);
  }

  private async storeOtp(key: string, otp: string, ttlSeconds: number): Promise<void> {
    const attemptsKey = `${key}:attempts`;

    try {
      if (!isRedisReady()) throw new Error("Redis connection offline");
      await redisClient.set(key, otp, { EX: ttlSeconds });
      await redisClient.set(attemptsKey, "0", { EX: ttlSeconds });
      logger.debug("OTP stored in Redis", { key });
    } catch (err: any) {
      logger.warn("Redis unavailable for OTP storage, falling back to MongoDB", { error: err.message });
      try {
        await prisma.otpToken.create({
          data: {
            email: key.includes("email:") || key.includes("verify:") ? this.extractEmail(key) : undefined,
            phone: key.includes("phone:") ? this.extractPhone(key) : undefined,
            otp,
            purpose: this.extractPurpose(key),
            expiresAt: new Date(Date.now() + ttlSeconds * 1000),
          },
        });
        logger.debug("OTP stored in MongoDB fallback", { key });
      } catch (mongoErr: any) {
        logger.error("Failed to store OTP in both Redis and MongoDB", { error: mongoErr.message, key });
      }
    }
  }

  private async verifyOtp(key: string, otp: string): Promise<boolean> {
    const attemptsKey = `${key}:attempts`;

    try {
      if (!isRedisReady()) throw new Error("Redis connection offline");
      const currentAttempts = parseInt((await redisClient.get(attemptsKey)) || "0", 10);

      if (currentAttempts >= RedisOtpService.MAX_ATTEMPTS) {
        logger.warn("OTP verification blocked due to max attempts", { key });
        return false;
      }

      const storedOtp = await redisClient.get(key);

      if (!storedOtp) {
        return this.verifyOtpFromMongo(key, otp, attemptsKey);
      }

      const isValid = storedOtp === otp;

      if (!isValid) {
        await redisClient.set(attemptsKey, (currentAttempts + 1).toString(), { EX: RedisOtpService.ATTEMPTS_TTL_SECONDS });
      } else {
        await redisClient.del(key);
        await redisClient.del(attemptsKey);
      }

      return isValid;
    } catch (err: any) {
      logger.warn("Redis unavailable for OTP verification, falling back to MongoDB", { error: err.message });
      return this.verifyOtpFromMongo(key, otp, attemptsKey);
    }
  }

  private async verifyOtpFromMongo(key: string, otp: string, attemptsKey: string): Promise<boolean> {
    try {
      const email = key.includes("email:") || key.includes("verify:") ? this.extractEmail(key) : undefined;
      const phone = key.includes("phone:") ? this.extractPhone(key) : undefined;
      const purpose = this.extractPurpose(key);

      const stored = await prisma.otpToken.findFirst({
        where: {
          ...(email && { email: { equals: email, mode: "insensitive" } }),
          ...(phone && { phone: { equals: phone, mode: "insensitive" } }),
          purpose,
          otp,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!stored) return false;

      await prisma.otpToken.update({
        where: { id: stored.id },
        data: { verified: true, attempts: stored.attempts + 1 },
      });

      return true;
    } catch (err: any) {
      logger.error("MongoDB fallback OTP verification failed", { error: err.message, key });
      return false;
    }
  }

  private async sendEmailOtp(email: string, otp: string, expiresAt: Date): Promise<void> {
    const expiryMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
    const sent = await emailService.sendOTPEmail(email, otp, "User");
    if (!sent) {
      logger.warn("Email OTP delivery failed (email may not be in production config)", { email, otp: "[REDACTED]", expiryMinutes });
    }
  }

  private async sendVerificationEmail(email: string, code: string, expiresAt: Date): Promise<void> {
    const sent = await emailService.sendOTPEmail(email, code, "User");
    if (!sent) {
      logger.warn("Email verification code delivery failed", { email, code: "[REDACTED]" });
    }
  }

  private extractEmail(key: string): string | undefined {
    const parts = key.split(":");
    return parts[2] ? decodeURIComponent(parts[2]) : undefined;
  }

  private extractPhone(key: string): string | undefined {
    const parts = key.split(":");
    return parts[2] ? decodeURIComponent(parts[2]) : undefined;
  }

  private extractPurpose(key: string): string {
    if (key.includes("verify:")) return "EMAIL_VERIFICATION";
    if (key.includes("email:")) return "PHONE_VERIFICATION";
    if (key.includes("phone:")) return "PHONE_VERIFICATION";
    return "OTP";
  }
}
