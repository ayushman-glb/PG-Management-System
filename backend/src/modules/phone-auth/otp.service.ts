import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { normalizeIndianPhone } from './phoneAuth.validation';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESEND_ATTEMPTS = 3;

export class OtpService {
  private db = prisma;

  /**
   * Generates cryptographically secure 6-digit numeric OTP
   */
  generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes plain OTP with bcrypt
   */
  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  /**
   * Compares candidate OTP with stored bcrypt hash
   */
  async compareOtp(candidate: string, hash: string): Promise<boolean> {
    return bcrypt.compare(candidate, hash);
  }

  /**
   * Generates and stores hashed OTP with rate limiting & cooldown verification
   */
  async createOrUpdateOtp(
    rawPhone: string,
    ipAddress?: string,
    userAgent?: string,
    isResend: boolean = false
  ): Promise<{ otp: string; expiresAt: Date; cooldownSecondsRemaining: number }> {
    const phone = normalizeIndianPhone(rawPhone);
    const existing = await this.db.phoneOTP.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    if (existing) {
      // Check 30-second cooldown
      const timeSinceCreated = (now.getTime() - new Date(existing.createdAt).getTime()) / 1000;
      if (timeSinceCreated < RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceCreated);
        throw new AppError(`Please wait ${remaining} seconds before requesting a new OTP.`, 429);
      }

      // Check max resends (max 3 resends)
      if (isResend && existing.resendCount >= MAX_RESEND_ATTEMPTS) {
        throw new AppError('Maximum resend limit reached for this session. Please try again after 10 minutes.', 429);
      }
    }

    const plainOtp = this.generateSecureOtp();
    const hashedOtp = await this.hashOtp(plainOtp);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Remove any older OTP records for this phone number
    await this.db.phoneOTP.deleteMany({
      where: { phone },
    });

    const resendCount = isResend && existing ? existing.resendCount + 1 : 0;

    await this.db.phoneOTP.create({
      data: {
        phone,
        hashedOtp,
        expiresAt,
        attempts: 0,
        resendCount,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return {
      otp: plainOtp,
      expiresAt,
      cooldownSecondsRemaining: RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * Validates submitted OTP against bcrypt hash, tracks attempt limits
   */
  async validateOtp(rawPhone: string, candidateOtp: string): Promise<boolean> {
    const phone = normalizeIndianPhone(rawPhone);
    const record = await this.db.phoneOTP.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new AppError('No verification code requested for this phone number or code expired. Please request a new OTP.', 400);
    }

    const now = new Date();
    if (new Date(record.expiresAt).getTime() < now.getTime()) {
      await this.db.phoneOTP.deleteMany({ where: { phone } });
      throw new AppError('Verification code has expired. Please request a new OTP.', 400);
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await this.db.phoneOTP.deleteMany({ where: { phone } });
      throw new AppError('Maximum verification attempts (5) exceeded. For security, this OTP is now invalid. Please request a new OTP.', 429);
    }

    const isMatch = await this.compareOtp(candidateOtp, record.hashedOtp);

    if (!isMatch) {
      const updatedAttempts = record.attempts + 1;
      await this.db.phoneOTP.update({
        where: { id: record.id },
        data: { attempts: updatedAttempts },
      });

      const remainingAttempts = Math.max(0, MAX_VERIFY_ATTEMPTS - updatedAttempts);
      if (remainingAttempts === 0) {
        await this.db.phoneOTP.deleteMany({ where: { phone } });
        throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', 429);
      }

      throw new AppError(`Invalid verification code. ${remainingAttempts} attempts remaining.`, 400);
    }

    // OTP verified successfully - consume and delete record
    await this.db.phoneOTP.deleteMany({ where: { phone } });
    return true;
  }

  /**
   * Retrieves active OTP status metadata for client UI
   */
  async getStatus(rawPhone: string): Promise<{
    hasActiveOtp: boolean;
    cooldownSecondsRemaining: number;
    attemptsRemaining: number;
    resendsRemaining: number;
    expiresAt?: Date | null;
  }> {
    const phone = normalizeIndianPhone(rawPhone);
    const record = await this.db.phoneOTP.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        hasActiveOtp: false,
        cooldownSecondsRemaining: 0,
        attemptsRemaining: MAX_VERIFY_ATTEMPTS,
        resendsRemaining: MAX_RESEND_ATTEMPTS,
      };
    }

    const now = new Date();
    const isExpired = new Date(record.expiresAt).getTime() < now.getTime();
    if (isExpired) {
      return {
        hasActiveOtp: false,
        cooldownSecondsRemaining: 0,
        attemptsRemaining: MAX_VERIFY_ATTEMPTS,
        resendsRemaining: MAX_RESEND_ATTEMPTS,
      };
    }

    const timeSinceCreated = (now.getTime() - new Date(record.createdAt).getTime()) / 1000;
    const cooldownRemaining = Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceCreated));
    const attemptsRemaining = Math.max(0, MAX_VERIFY_ATTEMPTS - record.attempts);
    const resendsRemaining = Math.max(0, MAX_RESEND_ATTEMPTS - record.resendCount);

    return {
      hasActiveOtp: true,
      cooldownSecondsRemaining: cooldownRemaining,
      attemptsRemaining,
      resendsRemaining,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Housekeeping utility to prune stale records
   */
  async cleanupExpired(): Promise<number> {
    try {
      const res = await this.db.phoneOTP.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      return res.count;
    } catch (err: any) {
      logger.debug('OTP cleanup error (non-fatal)', { error: err?.message });
      return 0;
    }
  }
}

export const otpService = new OtpService();
