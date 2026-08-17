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
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`✉️ [Transactional Email] Message ID: ${messageId} | Recipient: ${options.to} | Subject: "${options.subject}"`);
    return { messageId };
  },
  verify: async (): Promise<boolean> => {
    return true;
  },
};

export default transporter;
