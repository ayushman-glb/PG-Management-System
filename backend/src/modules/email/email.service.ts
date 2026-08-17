import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { gmailTransporter } from './transporter';
import { emailTemplates } from './email.templates';
import { EmailQueue } from './email.queue';
import { EmailLogger } from './email.logger';
import { EMAIL_CONSTANTS } from './email.constants';
import {
  SendEmailOptions,
  OtpEmailData,
  WelcomeEmailData,
  PasswordResetEmailData,
  PaymentReceiptEmailData,
  InvoiceEmailData,
  PaymentFailedEmailData,
  RefundEmailData,
  BookingConfirmationEmailData,
  ComplaintEmailData,
  SupportReplyEmailData,
  MarketingCampaignData,
} from './email.types';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';

export class EmailService {
  private readonly db = prisma;

  /**
   * Send single or bulk email directly via Gmail SMTP
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const fromName = env.MAIL_FROM_NAME || 'RoomBae';
    const fromEmail = env.MAIL_FROM_EMAIL || env.MAIL_USER || 'ayushman@globussoft.in';
    const fromAddress = `"${fromName}" <${fromEmail}>`;
    const recipientStr = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      const mailPayload = {
        from: options.from || fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]+>/g, ' ').slice(0, 300),
        replyTo: options.replyTo || fromEmail,
        attachments: options.attachments,
      };

      const info = await gmailTransporter.sendMail(mailPayload);
      const messageId = (info && info.messageId) ? info.messageId : `msg_${Date.now()}`;

      console.log(`✉️ [Gmail SMTP] Message ID: ${messageId} | Recipient: ${recipientStr} | Subject: "${options.subject}"`);

      await EmailLogger.logDelivery({
        recipient: recipientStr,
        subject: options.subject,
        template: options.template || 'GENERIC',
        status: EMAIL_CONSTANTS.STATUS.DELIVERED,
        messageId,
        metadata: options.metadata,
      });

      return true;
    } catch (error: any) {
      console.error(`❌ [Gmail SMTP Delivery Error] Recipient: ${recipientStr} | Error: ${error.message}`);

      await EmailLogger.logDelivery({
        recipient: recipientStr,
        subject: options.subject,
        template: options.template || 'GENERIC',
        status: EMAIL_CONSTANTS.STATUS.FAILED,
        error: error.message,
        metadata: options.metadata,
      });

      // If direct send fails and we are not in test mode, enqueue for retry
      if (env.NODE_ENV !== 'test') {
        EmailQueue.enqueue(options);
      }

      return false;
    }
  }

  /**
   * Generate secure 6-digit OTP, bcrypt hash, persist to EmailOTP, and send responsive email
   */
  async sendOtp(email: string, name?: string): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit / cooldown from existing OTP record
    const existingOtp = await this.db.emailOTP.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const now = new Date();
      const diffSeconds = (now.getTime() - new Date(existingOtp.updatedAt).getTime()) / 1000;

      if (diffSeconds < EMAIL_CONSTANTS.OTP.COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(EMAIL_CONSTANTS.OTP.COOLDOWN_SECONDS - diffSeconds);
        throw new AppError(`Please wait ${waitTime} seconds before requesting another OTP.`, 429);
      }

      if (existingOtp.resendCount >= EMAIL_CONSTANTS.OTP.MAX_RESEND_PER_HOUR) {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        if (new Date(existingOtp.createdAt) > oneHourAgo) {
          throw new AppError('Maximum OTP resend limit reached for this hour. Please try again later.', 429);
        }
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);
    const expiresAt = new Date(Date.now() + EMAIL_CONSTANTS.OTP.EXPIRY_MINUTES * 60 * 1000);

    // Persist or update in database
    if (existingOtp) {
      await this.db.emailOTP.update({
        where: { id: existingOtp.id },
        data: {
          hashedOtp,
          expiresAt,
          attempts: 0,
          resendCount: existingOtp.resendCount + 1,
          updatedAt: new Date(),
        },
      });
    } else {
      await this.db.emailOTP.create({
        data: {
          email: normalizedEmail,
          hashedOtp,
          expiresAt,
          attempts: 0,
          resendCount: 1,
        },
      });
    }

    // Render Bento HTML Template and send
    const html = emailTemplates.otpVerification({
      email: normalizedEmail,
      otp: rawOtp,
      name,
      expiresInMinutes: EMAIL_CONSTANTS.OTP.EXPIRY_MINUTES,
    });

    await this.sendEmail({
      to: normalizedEmail,
      subject: 'Verify your RoomBae Account',
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.OTP_VERIFICATION,
    });

    return {
      success: true,
      message: 'Verification code sent to your email address.',
      cooldownSeconds: EMAIL_CONSTANTS.OTP.COOLDOWN_SECONDS,
    };
  }

  /**
   * Verify entered 6-digit OTP against bcrypt hash with attempt limits and expiry validation
   */
  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await this.db.emailOTP.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new AppError('No verification code requested for this email. Please request an OTP first.', 400);
    }

    // Check if code has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      throw new AppError('Verification code has expired. Please request a new code.', 400);
    }

    // Check maximum attempts
    if (otpRecord.attempts >= EMAIL_CONSTANTS.OTP.MAX_VERIFICATION_ATTEMPTS) {
      throw new AppError('Too many invalid attempts. This verification code has been locked. Request a new OTP.', 429);
    }

    // Compare with bcrypt hash
    const isMatch = await bcrypt.compare(otp.trim(), otpRecord.hashedOtp);

    if (!isMatch) {
      await this.db.emailOTP.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      const remaining = EMAIL_CONSTANTS.OTP.MAX_VERIFICATION_ATTEMPTS - (otpRecord.attempts + 1);
      throw new AppError(`Invalid verification code. ${remaining} attempt(s) remaining.`, 400);
    }

    // Mark verified in user repository if user exists
    const user = await this.db.user.findFirst({ where: { email: { equals: normalizedEmail, mode: 'insensitive' } } });
    if (user) {
      await this.db.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Delete used OTP record to prevent replay
    await this.db.emailOTP.deleteMany({ where: { email: normalizedEmail } });

    return {
      success: true,
      message: 'Email address verified successfully.',
    };
  }

  /**
   * Resend OTP wrapper with cooldown enforcement
   */
  async resendOtp(email: string, name?: string) {
    return this.sendOtp(email, name);
  }

  /**
   * Welcome Email
   */
  async sendWelcomeEmail(email: string, name: string, role?: string): Promise<boolean> {
    const html = emailTemplates.welcome({ email, name, role });
    return this.sendEmail({
      to: email,
      subject: 'Welcome to RoomBae 🎉',
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.WELCOME,
    });
  }

  /**
   * Password Reset Email
   */
  async sendPasswordResetEmail(email: string, resetLink: string, name?: string): Promise<boolean> {
    const html = emailTemplates.passwordReset({ email, resetLink, name });
    return this.sendEmail({
      to: email,
      subject: 'Reset your RoomBae Password',
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.PASSWORD_RESET,
    });
  }

  /**
   * Payment Receipt Email
   */
  async sendPaymentReceiptEmail(data: PaymentReceiptEmailData): Promise<boolean> {
    const html = emailTemplates.paymentReceipt(data);
    return this.sendEmail({
      to: data.email,
      subject: `Payment Receipt: ${data.invoiceNumber}`,
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.PAYMENT_RECEIPT,
      metadata: { invoiceNumber: data.invoiceNumber, transactionId: data.transactionId, amount: data.amount },
    });
  }

  /**
   * Invoice Email with PDF Attachment
   */
  async sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
    const html = emailTemplates.invoice(data);
    const attachments = data.pdfBuffer
      ? [
          {
            filename: `Invoice_${data.invoiceNumber}.pdf`,
            content: data.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    return this.sendEmail({
      to: data.email,
      subject: `Your RoomBae Rental Invoice #${data.invoiceNumber}`,
      html,
      attachments,
      template: EMAIL_CONSTANTS.TEMPLATES.INVOICE,
      metadata: { invoiceNumber: data.invoiceNumber, totalAmount: data.totalAmount },
    });
  }

  /**
   * Payment Failed Email
   */
  async sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<boolean> {
    const html = emailTemplates.paymentFailed(data);
    return this.sendEmail({
      to: data.email,
      subject: 'Action Required: RoomBae Payment Failed',
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.PAYMENT_FAILED,
    });
  }

  /**
   * Refund Confirmation Email
   */
  async sendRefundEmail(data: RefundEmailData): Promise<boolean> {
    const html = emailTemplates.refundConfirmation(data);
    return this.sendEmail({
      to: data.email,
      subject: `Refund Processed for Transaction #${data.originalTransactionId}`,
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.REFUND_CONFIRMATION,
    });
  }

  /**
   * Booking Confirmation Email
   */
  async sendBookingConfirmationEmail(data: BookingConfirmationEmailData): Promise<boolean> {
    const html = emailTemplates.bookingConfirmation(data);
    return this.sendEmail({
      to: data.email,
      subject: `Booking Confirmed: ${data.propertyName} (Room ${data.roomNumber})`,
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.BOOKING_CONFIRMATION,
    });
  }

  /**
   * Complaint Status Update Email
   */
  async sendComplaintEmail(data: ComplaintEmailData): Promise<boolean> {
    const html = emailTemplates.complaintUpdate(data);
    return this.sendEmail({
      to: data.email,
      subject: `Helpdesk Update: [${data.ticketCode}] ${data.title}`,
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.COMPLAINT_UPDATE,
    });
  }

  /**
   * Support Reply Email
   */
  async sendSupportReplyEmail(data: SupportReplyEmailData): Promise<boolean> {
    const html = emailTemplates.supportReply(data);
    return this.sendEmail({
      to: data.email,
      subject: `Support Response: [${data.ticketCode}] ${data.subject}`,
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.SUPPORT_REPLY,
    });
  }

  /**
   * Marketing Campaign Email Batch Dispatch
   */
  async sendMarketingCampaign(data: MarketingCampaignData): Promise<{ total: number; dispatched: number }> {
    const html = emailTemplates.marketingCampaign(data);
    let recipients: Array<{ email: string; name?: string }> = data.recipients || [];

    if (recipients.length === 0) {
      if (data.audience === 'RESIDENTS') {
        const users = await this.db.user.findMany({
          where: { role: 'RESIDENT', email: { not: '' } },
          select: { email: true, name: true },
        });
        recipients = users;
      } else if (data.audience === 'OWNERS') {
        const users = await this.db.user.findMany({
          where: { role: 'OWNER', email: { not: '' } },
          select: { email: true, name: true },
        });
        recipients = users;
      } else {
        const users = await this.db.user.findMany({
          where: { email: { not: '' } },
          select: { email: true, name: true },
        });
        recipients = users;
      }
    }

    let dispatched = 0;
    for (const r of recipients) {
      if (r.email) {
        EmailQueue.enqueue({
          to: r.email,
          subject: data.subject,
          html,
          template: EMAIL_CONSTANTS.TEMPLATES.MARKETING_CAMPAIGN,
          metadata: { campaignTitle: data.title, audience: data.audience },
        });
        dispatched += 1;
      }
    }

    if (data.campaignId) {
      await this.db.marketingCampaign.update({
        where: { id: data.campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          totalRecipients: recipients.length,
          successfulDeliveries: dispatched,
        },
      });
    }

    return { total: recipients.length, dispatched };
  }

  /**
   * Convenience compatibility alias for sending raw OTP emails
   */
  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    const html = emailTemplates.otpVerification({
      email,
      otp,
      name: name || 'User',
      expiresInMinutes: EMAIL_CONSTANTS.OTP.EXPIRY_MINUTES,
    });
    return this.sendEmail({
      to: email,
      subject: 'Your RoomBae Security Verification Code',
      html,
      template: EMAIL_CONSTANTS.TEMPLATES.OTP_VERIFICATION,
    });
  }

  async sendVerificationCodeEmail(email: string, code: string, expiresAt?: Date): Promise<boolean> {
    return this.sendOTPEmail(email, code);
  }
}

export const emailService = new EmailService();
export default emailService;
