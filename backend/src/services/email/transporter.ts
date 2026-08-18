import { gmailTransporter } from '../../modules/email/transporter';
import { env } from '../../config/env';

export interface MailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

export const transporter = {
  sendMail: async (options: MailOptions): Promise<{ messageId: string }> => {
    const fromName = env.MAIL_FROM_NAME || 'RoomBae';
    const fromEmail = env.MAIL_FROM_EMAIL || env.MAIL_USER || 'ayushman@globussoft.in';
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    const info = await gmailTransporter.sendMail({
      from: options.from || fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ' ').slice(0, 300),
      attachments: options.attachments,
    });

    const messageId = (info && info.messageId) ? info.messageId : `msg_${Date.now()}`;
    return { messageId };
  },
  verify: async (): Promise<boolean> => {
    try {
      await gmailTransporter.verify();
      return true;
    } catch {
      return false;
    }
  },
};

export default transporter;
