import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface OtpAuditLogParams {
  phone: string;
  action: 'OTP_SENT' | 'OTP_RESENT' | 'OTP_VERIFIED' | 'OTP_FAILED' | 'OTP_EXPIRED' | 'OTP_LOCKED' | 'PHONE_REMOVED';
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export class OtpLogger {
  static async log(params: OtpAuditLogParams): Promise<void> {
    const sanitizedPhone = params.phone.replace(/(\+\d{2})(\d{2})\d{4}(\d{4})/, '$1 $2****$3');
    logger.info(`📱 [SMS OTP AUDIT] Action: ${params.action} | Phone: ${sanitizedPhone} | Status: ${params.status}`, {
      ...params.details,
      ip: params.ipAddress,
    });

    try {
      if (prisma?.securityAuditEvent) {
        await prisma.securityAuditEvent.create({
          data: {
            userId: params.userId || null,
            eventType: `PHONE_${params.action}`,
            severity: params.status === 'BLOCKED' ? 'WARNING' : params.status === 'FAILED' ? 'WARNING' : 'INFO',
            ipAddress: params.ipAddress || 'unknown',
            userAgent: params.userAgent || 'unknown',
            metadata: JSON.stringify({
              sanitizedPhone,
              status: params.status,
              ...params.details,
            }),
          },
        });
      }
    } catch (err: any) {
      // Non-blocking log catch
      logger.debug('Non-blocking activity log error in OtpLogger', { error: err?.message });
    }
  }
}
