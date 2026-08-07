import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NodemailerEmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT, 10),
        secure: parseInt(env.SMTP_PORT, 10) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT, 10),
        secure: false,
        ignoreTLS: true,
      });
    }

    return this.transporter;
  }

  async sendEmail(opts: SendEmailOptions): Promise<boolean> {
    if (!opts.to || !opts.subject || !opts.html) {
      logger.warn("Missing required email fields", { to: opts.to, subject: opts.subject });
      return false;
    }

    try {
      const info = await this.getTransporter().sendMail({
        from: env.EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });

      logger.info("Email sent successfully", { to: opts.to, messageId: info.messageId });
      return true;
    } catch (err: any) {
      logger.error("Failed to send email", { to: opts.to, error: err.message });
      return false;
    }
  }

  async sendOtpEmail(to: string, otp: string, expiresAt: Date): Promise<boolean> {
    const expiryMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 40px 20px; text-align: center;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">RoomBae OTP Verification</h1>
          <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">
            Your verification code is:
          </p>
          <div style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 4px; padding: 15px 30px; background: #ffffff; border-radius: 8px; display: inline-block; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This code will expire in ${expiryMinutes} minutes.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            Do not share this code with anyone. RoomBae will never ask for your OTP.
          </p>
        </div>
      </div>
    `;

    const text = `Your RoomBae verification code is: ${otp}\nThis code will expire in ${expiryMinutes} minutes.`;

    return this.sendEmail({
      to,
      subject: "RoomBae OTP Verification Code",
      html,
      text,
    });
  }

  async sendVerificationCodeEmail(to: string, code: string, expiresAt: Date): Promise<boolean> {
    const expiryMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f0fdf4; padding: 40px 20px; text-align: center; border: 1px solid #bbf7d0;">
          <h1 style="color: #16a34a; margin-bottom: 20px;">RoomBae Email Verification</h1>
          <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">
            Your email verification code is:
          </p>
          <div style="font-size: 36px; font-weight: bold; color: #16a34a; letter-spacing: 4px; padding: 15px 30px; background: #ffffff; border-radius: 8px; display: inline-block; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This code will expire in ${expiryMinutes} minutes.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const text = `Your RoomBae email verification code is: ${code}\nThis code will expire in ${expiryMinutes} minutes.`;

    return this.sendEmail({
      to,
      subject: "RoomBae Email Verification Code",
      html,
      text,
    });
  }
}

export const emailService = new NodemailerEmailService();
