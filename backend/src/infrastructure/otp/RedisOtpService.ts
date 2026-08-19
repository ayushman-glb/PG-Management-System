import crypto from "crypto";
import { IOtpService } from "../../interfaces/infrastructure/IOtpService";
import { emailService } from "../../services/email";
import { logger } from "../../utils/logger";
import { redisClient, isRedisReady } from "../../config/redis";
import { prisma } from "../../config/prisma";
import { RedisNamespace } from "../../services/security/RedisNamespace";

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

  /**
   * Hash an OTP with SHA-256 before storing — OTPs must never be stored in plaintext.
   * Mirrors the refreshTokenHash pattern used in the RefreshToken Prisma model.
   */
  private hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  async generateAndSendOtp(email: string): Promise<{ otp: string; expiresAt: Date; message: string; devOtp?: string }> {
    const otp = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + RedisOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp(RedisNamespace.otpKey(`email:${email}`), otp, RedisOtpService.OTP_TTL_SECONDS);
    await this.sendEmailOtp(email, otp, expiresAt);

    logger.info("OTP generated and sent", { email, purpose: "EMAIL_OTP" });

    // DEV-ONLY: remove or verify gated before production deploy
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
    const expiresAt = new Date(Date.now() + RedisOtpService.PHONE_OTP_TTL_SECONDS * 1000);

    await this.storeOtp(RedisNamespace.otpKey(`phone:${phone}`), otp, RedisOtpService.PHONE_OTP_TTL_SECONDS);

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

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? otp : undefined;

    return {
      otp,
      expiresAt,
      message: `OTP sent to ${phone}. We've sent the code to the email on file.`,
      timerSeconds: RedisOtpService.OTP_TTL_SECONDS,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
    return this.verifyOtp(RedisNamespace.otpKey(`phone:${phone}`), otp);
  }

  async generateAndSendEmailVerification(
    email: string,
  ): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }> {
    const code = this.generateSecureOtp();
    const expiresAt = new Date(Date.now() + RedisOtpService.OTP_TTL_SECONDS * 1000);

    await this.storeOtp(RedisNamespace.otpKey(`verify:${email}`), code, RedisOtpService.OTP_TTL_SECONDS);
    await this.sendVerificationEmail(email, code, expiresAt);

    logger.info("Email verification code generated and sent", { email });

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;

    return {
      code,
      expiresAt,
      message: `Verification code sent to ${email}`,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return this.verifyOtp(RedisNamespace.otpKey(`verify:${email}`), code);
  }

  async generateAndSendPasswordReset(email: string): Promise<{ code: string; expiresAt: Date; message: string; devOtp?: string }> {
    const code = this.generateSecureOtp(6);
    const ttlSeconds = RedisOtpService.OTP_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.storeOtp(RedisNamespace.otpKey(`reset:${email}`), code, ttlSeconds);

    // DEV-ONLY: remove or verify gated before production deploy
    const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;

    return {
      code,
      expiresAt,
      message: `Password reset code sent to ${email}`,
      ...(process.env.NODE_ENV !== "production" && devOtp ? { devOtp } : {}),
    };
  }

  async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    return this.verifyOtp(RedisNamespace.otpKey(`reset:${email}`), code);
  }

  private async storeOtp(key: string, otp: string, ttlSeconds: number): Promise<void> {
    const attemptsKey = `${key}:attempts`;
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const email = key.includes("email:") || key.includes("verify:") || key.includes("reset:") ? this.extractEmail(key) : undefined;
    const phone = key.includes("phone:") ? this.extractPhone(key) : undefined;
    const purpose = this.extractPurpose(key);

    // 1. Authoritative persistent write to MongoDB
    try {
      await prisma.otpToken.create({
        data: {
          email: email ? email.toLowerCase() : undefined,
          phone,
          otp: hashedOtp,
          purpose,
          attempts: 0,
          verified: false,
          expiresAt,
        },
      });
      logger.debug("OTP persisted in MongoDB OtpToken", { key });
    } catch (mongoErr: any) {
      logger.warn("Failed to persist OTP in MongoDB", { error: mongoErr.message, key });
    }

    // 2. Fast-path cache write to Redis if available
    try {
      if (isRedisReady()) {
        await redisClient.set(key, hashedOtp, { EX: ttlSeconds });
        await redisClient.set(attemptsKey, "0", { EX: ttlSeconds });
        logger.debug("OTP cached in Redis", { key });
      }
    } catch (redisErr: any) {
      logger.warn("Redis unavailable for OTP caching, running on Mongo", { error: redisErr.message });
    }
  }

  private async verifyOtp(key: string, otp: string): Promise<boolean> {
    const attemptsKey = `${key}:attempts`;
    const hashedInput = this.hashOtp(otp);
    const email = key.includes("email:") || key.includes("verify:") || key.includes("reset:") ? this.extractEmail(key) : undefined;
    const phone = key.includes("phone:") ? this.extractPhone(key) : undefined;
    const purpose = this.extractPurpose(key);

    // 1. Check Redis fast-path attempts counter
    let redisAttempts = 0;
    if (isRedisReady()) {
      try {
        redisAttempts = parseInt((await redisClient.get(attemptsKey)) || "0", 10);
      } catch {}
    }

    if (redisAttempts >= RedisOtpService.MAX_ATTEMPTS) {
      logger.warn("OTP verification blocked due to max attempts (Redis fast-check)", { key, attempts: redisAttempts });
      return false;
    }

    // 2. Authoritative check against MongoDB OtpToken
    let mongoOtpRecord: any = null;
    try {
      mongoOtpRecord = await prisma.otpToken.findFirst({
        where: {
          ...(email && { email: { equals: email.toLowerCase(), mode: "insensitive" } }),
          ...(phone && { phone: { equals: phone, mode: "insensitive" } }),
          purpose,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (mongoReadErr: any) {
      logger.error("Error reading OTP from MongoDB", { error: mongoReadErr.message });
    }

    if (mongoOtpRecord && mongoOtpRecord.attempts >= RedisOtpService.MAX_ATTEMPTS) {
      logger.warn("OTP verification blocked due to max attempts (MongoDB authoritative check)", { key, attempts: mongoOtpRecord.attempts });
      return false;
    }

    // 3. Verify OTP validity
    let isValid = false;
    let storedRedisOtp: string | null = null;

    if (isRedisReady()) {
      try {
        storedRedisOtp = await redisClient.get(key);
      } catch {}
    }

    if (storedRedisOtp) {
      isValid = storedRedisOtp === hashedInput;
    } else if (mongoOtpRecord) {
      isValid = mongoOtpRecord.otp === hashedInput;
    }

    if (!isValid) {
      // Increment attempt counter in BOTH Redis and MongoDB
      const newAttempts = Math.max(redisAttempts, mongoOtpRecord?.attempts || 0) + 1;
      
      if (isRedisReady()) {
        try {
          await redisClient.set(attemptsKey, String(newAttempts), { EX: RedisOtpService.ATTEMPTS_TTL_SECONDS });
        } catch {}
      }

      if (mongoOtpRecord) {
        try {
          await prisma.otpToken.update({
            where: { id: mongoOtpRecord.id },
            data: { attempts: newAttempts },
          });
        } catch {}
      }

      logger.warn("OTP verification failed, incremented attempt counter", { key, newAttempts });
      return false;
    }

    // On Success: Invalidate Redis keys and mark Mongo OtpToken as verified
    if (isRedisReady()) {
      try {
        await redisClient.del(key);
        await redisClient.del(attemptsKey);
      } catch {}
    }

    if (mongoOtpRecord) {
      try {
        await prisma.otpToken.update({
          where: { id: mongoOtpRecord.id },
          data: { verified: true, attempts: mongoOtpRecord.attempts + 1 },
        });
      } catch {}
    }

    logger.info("OTP successfully verified and invalidated", { key });
    return true;
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
