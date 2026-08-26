import { prisma } from '../../config/prisma';

export class SecurityAuditService {
  public static async logLoginSuccess(userId: string, ip: string, userAgent: string, deviceFp?: string, riskScore: number = 0) {
    if ((prisma as any).securityAuditEvent?.create) {
      return (prisma as any).securityAuditEvent.create({
        data: {
          userId,
          eventType: 'LOGIN_SUCCESS',
          severity: 'INFO',
          riskScore,
          ipAddress: ip,
          userAgent,
          deviceFingerprint: deviceFp,
          timestamp: new Date(),
        },
      });
    }
  }

  public static async logImpossibleTravel(userId: string, loc1: string, loc2: string, distanceKm: number, ip: string) {
    if ((prisma as any).securityAuditEvent?.create) {
      return (prisma as any).securityAuditEvent.create({
        data: {
          userId,
          eventType: 'IMPOSSIBLE_TRAVEL_DETECTED',
          severity: 'CRITICAL',
          riskLevel: 'HIGH',
          metadata: { loc1, loc2, distanceKm },
          ipAddress: ip,
          timestamp: new Date(),
        },
      });
    }
  }

  public static async logKeyRotation(userId: string, oldKid: string, newKid: string, durationDays: number) {
    if ((prisma as any).securityAuditEvent?.create) {
      return (prisma as any).securityAuditEvent.create({
        data: {
          userId,
          eventType: 'KEY_ROTATED',
          severity: 'CRITICAL',
          metadata: { oldKid, newKid, durationDays },
          timestamp: new Date(),
        },
      });
    }
  }
}
