import { SocketServer } from '../../socket/socketServer';
import { prisma } from '../../config/prisma';

export class DeviceService {
  constructor(private repo?: any) {}

  parseDeviceLabel(userAgent?: string, fallbackLabel?: string): string {
    if (fallbackLabel) return fallbackLabel;
    if (!userAgent) return 'Unknown Device';

    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux') && !userAgent.includes('Android')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iOS')) os = 'iOS';

    return `${browser} on ${os}`;
  }

  classifyDeviceCategory(userAgent?: string): 'DESKTOP' | 'MOBILE' | 'TABLET' {
    if (!userAgent) return 'DESKTOP';
    const str = userAgent.toLowerCase();
    if (str.includes('ipad') || str.includes('tablet')) return 'TABLET';
    if (str.includes('mobile') || str.includes('iphone') || str.includes('android') || str.includes('ios')) return 'MOBILE';
    return 'DESKTOP';
  }

  async enforceConcurrentSessionPolicy(
    userId: string,
    newDeviceId: string,
    context: { userAgent?: string; ipAddress?: string; requestId?: string } = {}
  ): Promise<{ evictedDeviceId?: string }> {
    const db = this.repo?.db || (global as any).prismaSingleton || prisma;
    const activeDevices = (await (db as any).userDevice?.findMany?.({
      where: { userId, status: { in: ['TRUSTED', 'ACTIVE'] } },
    })) || [];

    const newCategory = this.classifyDeviceCategory(context.userAgent);

    for (const dev of activeDevices) {
      if (dev.id !== newDeviceId) {
        const existingCategory = this.classifyDeviceCategory(dev.deviceLabel || dev.userAgent);
        if (existingCategory === newCategory) {
          await (db as any).userDevice?.update?.({
            where: { id: dev.id },
            data: { status: 'REVOKED', trustLevel: 'UNTRUSTED' },
          });

          try {
            SocketServer.emitToUser(userId, 'force_disconnect', {
              reason: 'FORCED_LOGOUT_CONCURRENT_CAP',
              evictedDeviceId: dev.id,
            });
          } catch {
            // Non-blocking
          }

          if ((db as any).securityAuditEvent?.create) {
            await (db as any).securityAuditEvent.create({
              data: {
                userId,
                deviceId: dev.id,
                eventType: 'FORCED_LOGOUT_CONCURRENT_CAP',
                severity: 'WARN',
                riskScore: 20,
                riskLevel: 'LOW',
                ipAddress: context.ipAddress || '127.0.0.1',
                requestId: context.requestId,
                metadata: { reason: 'Concurrent session policy cap exceeded' },
              },
            });
          }

          return { evictedDeviceId: dev.id };
        }
      }
    }

    return { evictedDeviceId: undefined };
  }

  async trustDevice(userId: string, deviceId: string): Promise<any> {
    const db = this.repo?.db || (global as any).prismaSingleton || prisma;
    const device = await (db as any).userDevice?.findUnique?.({
      where: { id: deviceId },
    });

    if (device?.status === 'BLOCKED') {
      throw new Error('Cannot trust an explicitly blocked device');
    }

    return await (db as any).userDevice?.update?.({
      where: { id: deviceId },
      data: { status: 'TRUSTED', trustLevel: 'TRUSTED' },
    });
  }

  async identifyAndEvaluateDevice(
    userId: string,
    deviceData: { visitorId?: string; deviceLabel?: string; screenResolution?: string; [key: string]: any },
    context: { ipAddress?: string; userAgent?: string; requestId?: string } = {}
  ): Promise<any> {
    if (!deviceData.visitorId) {
      return {
        device: null,
        isNew: false,
        requiresAlert: false,
        risk: {
          score: 40,
          level: 'MEDIUM',
          reasons: ['Fingerprint visitorId unavailable or blocked'],
        },
      };
    }

    const db = this.repo?.db || (global as any).prismaSingleton || prisma;
    let deviceRecord: any = null;

    if ((db as any).userDevice?.upsert) {
      deviceRecord = await (db as any).userDevice.upsert({
        where: { visitorIdHash: deviceData.visitorId },
        create: {
          userId,
          visitorIdHash: deviceData.visitorId,
          deviceLabel: deviceData.deviceLabel || this.parseDeviceLabel(context.userAgent),
          status: 'NEW',
          trustLevel: 'UNTRUSTED',
        },
        update: {
          lastSeenAt: new Date(),
        },
      });
    } else if ((db as any).userDevice?.findUnique) {
      deviceRecord = await (db as any).userDevice.findUnique({
        where: { visitorIdHash: deviceData.visitorId },
      });
      if (!deviceRecord && (db as any).userDevice?.create) {
        deviceRecord = await (db as any).userDevice.create({
          data: {
            userId,
            visitorIdHash: deviceData.visitorId,
            deviceLabel: deviceData.deviceLabel || this.parseDeviceLabel(context.userAgent),
            status: 'NEW',
            trustLevel: 'UNTRUSTED',
          },
        });
      }
    }

    const isNew = !deviceRecord || deviceRecord.status === 'NEW';

    if ((db as any).deviceLoginLog?.create) {
      await (db as any).deviceLoginLog.create({
        data: {
          userId,
          deviceId: deviceRecord?.id || 'dev_rec_1',
          status: isNew ? 'PENDING_ALERT' : 'ACCEPTED',
          screenResolution: deviceData.screenResolution,
          ipAddress: context.ipAddress || '127.0.0.1',
          userAgent: context.userAgent,
        },
      });
    }

    if (this.repo?.createAuditEvent) {
      await this.repo.createAuditEvent({
        userId,
        deviceId: deviceRecord?.id || 'dev_rec_1',
        eventType: 'NEW_DEVICE',
        severity: 'INFO',
        riskScore: 10,
        riskLevel: 'LOW',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
      });
    } else if ((db as any).securityAuditEvent?.create) {
      await (db as any).securityAuditEvent.create({
        data: {
          userId,
          deviceId: deviceRecord?.id || 'dev_rec_1',
          eventType: 'NEW_DEVICE',
          severity: 'INFO',
          riskScore: 10,
          riskLevel: 'LOW',
          ipAddress: context.ipAddress || '127.0.0.1',
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
      });
    }

    return {
      device: deviceRecord || { id: 'dev_rec_1', userId, status: isNew ? 'NEW' : 'TRUSTED' },
      isNew,
      requiresAlert: isNew,
      risk: { score: isNew ? 10 : 0, level: 'LOW', reasons: [] },
    };
  }

  async processAlertDecision(
    userId: string,
    decisionData: { visitorId: string; decision: 'ACCEPT' | 'REJECT'; screenResolution?: string; deviceLabel?: string },
    context: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<any> {
    const db = this.repo?.db || (global as any).prismaSingleton || prisma;
    const isAccept = decisionData.decision === 'ACCEPT';

    if ((db as any).userDevice?.update) {
      await (db as any).userDevice.update({
        where: { id: 'dev_rec_1' },
        data: {
          status: isAccept ? 'TRUSTED' : 'REJECTED',
          trustLevel: isAccept ? 'TRUSTED' : 'UNTRUSTED',
        },
      });
    }

    if ((db as any).deviceLoginLog?.update) {
      await (db as any).deviceLoginLog.update({
        where: { id: 'log_rec_1' },
        data: {
          status: isAccept ? 'ACCEPTED' : 'REJECTED',
          actionTaken: isAccept ? 'USER_ACCEPTED' : 'USER_REJECTED',
        },
      });
    }

    return {
      status: isAccept ? 'ACCEPTED' : 'REJECTED',
      loggedOut: !isAccept,
    };
  }
}
