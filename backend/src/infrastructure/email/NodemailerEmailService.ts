import { emailService } from "../../modules/email";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NodemailerEmailService {
  async sendEmail(opts: SendEmailOptions): Promise<boolean> {
    return emailService.sendEmail({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  }

  async sendOtpEmail(to: string, otp: string, expiresAt: Date): Promise<boolean> {
    const res = await emailService.sendOtp(to);
    return res.success;
  }

  async sendVerificationCodeEmail(to: string, code: string, expiresAt: Date): Promise<boolean> {
    const res = await emailService.sendOtp(to);
    return res.success;
  }
}

export const nodemailerEmailService = new NodemailerEmailService();
export default nodemailerEmailService;
