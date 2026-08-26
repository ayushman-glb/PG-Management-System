import { prisma } from '../../config/prisma';
import crypto from 'crypto';

export class DeviceRepository {
  constructor(public readonly db: any = prisma) {}

  hashVisitorId(visitorId: string): string {
    return crypto.createHash('sha256').update(visitorId).digest('hex');
  }

  async createAuditEvent(data: {
    userId: string;
    deviceId?: string;
    eventType: string;
    severity?: string;
    riskScore?: number;
    riskLevel?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: any;
  }) {
    if (this.db.securityAuditEvent?.create) {
      return await this.db.securityAuditEvent.create({
        data: {
          userId: data.userId,
          deviceId: data.deviceId,
          eventType: data.eventType,
          severity: data.severity || 'INFO',
          riskScore: data.riskScore || 0,
          riskLevel: data.riskLevel || 'LOW',
          ipAddress: data.ipAddress || '127.0.0.1',
          userAgent: data.userAgent,
          requestId: data.requestId,
          metadata: data.metadata,
        },
      });
    }
    return { id: `aud_${Date.now()}`, ...data };
  }

  async findActiveUserDevices(userId: string) {
    if (this.db.userDevice?.findMany) {
      return await this.db.userDevice.findMany({
        where: { userId, status: { in: ['TRUSTED', 'ACTIVE'] } },
      });
    }
    return [];
  }
}
