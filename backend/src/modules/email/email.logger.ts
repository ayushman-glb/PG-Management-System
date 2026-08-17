import { prisma } from '../../config/prisma';
import { EMAIL_CONSTANTS } from './email.constants';

export class EmailLogger {
  static async logDelivery(params: {
    recipient: string;
    subject: string;
    template: string;
    status: string;
    messageId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await prisma.emailLog.create({
        data: {
          recipient: Array.isArray(params.recipient) ? params.recipient.join(', ') : params.recipient,
          subject: params.subject,
          template: params.template || EMAIL_CONSTANTS.TEMPLATES.MARKETING_CAMPAIGN,
          status: params.status,
          messageId: params.messageId,
          error: params.error,
          metadata: params.metadata,
        },
      });
    } catch (err: any) {
      console.error('❌ [EmailLogger] Failed to write email audit log to database:', err.message);
    }
  }

  static async getLogs(filter?: { recipient?: string; status?: string; limit?: number }) {
    try {
      return await prisma.emailLog.findMany({
        where: {
          recipient: filter?.recipient ? { contains: filter.recipient, mode: 'insensitive' } : undefined,
          status: filter?.status ? filter.status : undefined,
        },
        orderBy: { sentAt: 'desc' },
        take: filter?.limit || 50,
      });
    } catch (err: any) {
      console.error('❌ [EmailLogger] Failed to query email logs:', err.message);
      return [];
    }
  }
}
