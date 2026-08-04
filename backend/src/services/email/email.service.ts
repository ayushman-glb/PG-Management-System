import { transporter } from './transporter';
import { emailTemplates } from './email.templates';
import { env } from '../../config/env';

export class EmailService {
  async sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<boolean> {
    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ Email Sent: ${info.messageId} | Recipient: ${to} | Subject: "${subject}"`);
      return true;
    } catch (error: any) {
      console.error(`❌ Email Failed: Recipient: ${to} | Error: ${error.message}`);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    const subject = 'Verify your RoomBae Account';
    const html = emailTemplates.otp({ name, code: otp });
    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, resetLink: string, name?: string): Promise<boolean> {
    const subject = 'Reset your RoomBae Password';
    const html = emailTemplates.passwordReset({ name, resetLink });
    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    const subject = 'Welcome to RoomBae 🎉';
    const html = emailTemplates.welcome({ name: fullName });
    return this.sendEmail(email, subject, html);
  }

  async sendNotificationEmail(email: string, subject: string, message: string, name?: string): Promise<boolean> {
    const html = emailTemplates.notification({ name, subject, message });
    return this.sendEmail(email, subject, html);
  }

  async sendAgreementEmail(email: string, pdfBuffer: Buffer, agreementNumber: string, name?: string): Promise<boolean> {
    const subject = `Your RoomBae Rental Agreement (#${agreementNumber})`;
    const html = emailTemplates.notification({
      name,
      subject,
      message: `Please find attached your official digital rental agreement #${agreementNumber}. Keep this for your records.`,
    });

    return this.sendEmail(email, subject, html, [
      {
        filename: `Rental_Agreement_${agreementNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ]);
  }
}

export const emailService = new EmailService();
