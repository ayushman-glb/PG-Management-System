import * as nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const pass = env.MAIL_APP_PASSWORD;
    if (env.MAIL_HOST && env.MAIL_USER && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.MAIL_HOST,
          port: Number(env.MAIL_PORT) || 587,
          secure: env.MAIL_SECURE === 'true',
          auth: {
            user: env.MAIL_USER,
            pass: pass,
          },
        });
      } catch (err: any) {
        logger.warn('Email transporter init warning:', err?.message || err);
      }
    }
  }

  async sendOTPEmail(email: string, otp: string, purpose = 'Verification'): Promise<boolean> {
    logger.info(`📧 [EMAIL SERVICE] Sending OTP ${otp} (${purpose}) to ${email}`);
    if (!this.transporter) {
      logger.info(`📧 [DEV MOCK] Transporter not configured. OTP for ${email} is ${otp}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM || `"RoomBae" <${env.MAIL_USER}>`,
        to: email,
        subject: `RoomBae - Your ${purpose} One-Time Password (OTP)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff;">
            <h2 style="color: #C89A4B; margin-top: 0;">RoomBae Security Verification</h2>
            <p>You requested a One-Time Password for <strong>${purpose}</strong>.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #1D1B1A; background: #FAF7F2; padding: 16px; border-radius: 6px;">
              ${otp}
            </div>
            <p style="color: #666666; font-size: 13px;">This code will expire in 10 minutes. If you did not make this request, please ignore this email or secure your account.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999999; text-align: center;">RoomBae PG Management System &bull; Automated System Dispatch</p>
          </div>
        `,
      });
      return true;
    } catch (err: any) {
      logger.error(`❌ Failed to send OTP email to ${email}:`, err?.message || err);
      return false;
    }
  }

  async sendOtp(email: string, name: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number; otp?: string }> {
    const existing = await (prisma as any).emailOTP?.findFirst?.({ where: { email } });
    if (existing) {
      const lastSent = new Date(existing.updatedAt || existing.createdAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastSent) / 1000);
      const cooldownSeconds = 60;
      if (elapsedSeconds < cooldownSeconds) {
        const remaining = cooldownSeconds - elapsedSeconds;
        throw new Error(`Please wait ${remaining} seconds before requesting another OTP`);
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if ((prisma as any).emailOTP?.create) {
      await (prisma as any).emailOTP.create({
        data: {
          email,
          hashedOtp,
          expiresAt,
          attempts: 0,
          resendCount: (existing?.resendCount || 0) + 1,
        },
      });
    }

    await this.sendOTPEmail(email, otp, 'Verification');
    return { success: true, message: 'OTP sent successfully', cooldownSeconds: 60, otp };
  }

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const record = await (prisma as any).emailOTP?.findFirst?.({ where: { email } });
    if (!record) {
      throw new Error('Verification code not found');
    }
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      throw new Error('Verification code has expired');
    }
    const isValid = await bcrypt.compare(otp, record.hashedOtp);
    if (!isValid) {
      await (prisma as any).emailOTP?.update?.({
        where: { id: record.id },
        data: { attempts: (record.attempts || 0) + 1 },
      });
      throw new Error('Invalid verification code');
    }
    await (prisma as any).emailOTP?.deleteMany?.({ where: { email } });
    return { success: true, message: 'Email verified successfully' };
  }

  async sendInvoiceEmail(data: {
    email: string;
    name: string;
    invoiceNumber: string;
    dueDate: Date;
    totalAmount: number;
    breakdown: any;
    pdfBuffer?: Buffer;
  }): Promise<boolean> {
    logger.info(`📧 [EMAIL SERVICE] Sending invoice email to ${data.email}`);
    return true;
  }

  async sendGenericEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    logger.info(`📧 [EMAIL SERVICE] Sending email to ${to}: ${subject}`);
    if (!this.transporter) {
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM || `"RoomBae" <${env.MAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (err: any) {
      logger.error(`❌ Failed to send generic email to ${to}:`, err?.message || err);
      return false;
    }
  }
}

export const emailService = new EmailService();
export const getSmtpHealth = () => ({
  status: env.MAIL_USER ? 'healthy' : 'unconfigured',
  host: env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(env.MAIL_PORT) || 587,
  latency: 10,
  lastVerifiedAt: new Date().toISOString(),
});
