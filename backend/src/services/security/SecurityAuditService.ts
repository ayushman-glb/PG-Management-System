import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";

export interface SecurityAuditParams {
  userId?: string;
  deviceId?: string;
  visitorId?: string;
  eventType: string; // LOGIN_SUCCESS, LOGIN_FAILURE, LOGIN_BLOCKED, NEW_DEVICE, DEVICE_TRUSTED, DEVICE_REVOKED, DEVICE_BLOCKED, DEVICE_UNBLOCKED, SUSPICIOUS_LOGIN, STEP_UP_REQUIRED, STEP_UP_SUCCESS, STEP_UP_FAILURE, LOGOUT, SESSION_REVOKED, IMPOSSIBLE_TRAVEL_DETECTED, KEY_ROTATED
  severity?: "INFO" | "WARNING" | "CRITICAL";
  riskScore?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  asn?: string;
  requestId?: string;
  metadata?: Record<string, any> | string;
}

/**
 * Enterprise Security Audit Service
 * 
 * Structured append-only security telemetry and compliance audit log service.
 * Persists security events directly to MongoDB `SecurityAuditEvent` collection.
 */
export class SecurityAuditService {
  public static async recordEvent(params: SecurityAuditParams): Promise<void> {
    try {
      const metaString = params.metadata
        ? typeof params.metadata === "string"
          ? params.metadata
          : JSON.stringify(params.metadata)
        : null;

      await prisma.securityAuditEvent.create({
        data: {
          userId: params.userId || null,
          deviceId: params.deviceId || null,
          visitorId: params.visitorId || null,
          eventType: params.eventType,
          severity: params.severity || "INFO",
          riskScore: params.riskScore ?? 0,
          riskLevel: params.riskLevel || (params.riskScore && params.riskScore >= 70 ? "CRITICAL" : params.riskScore && params.riskScore >= 40 ? "MEDIUM" : "LOW"),
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          country: params.country || null,
          asn: params.asn || null,
          requestId: params.requestId || null,
          metadata: metaString,
        },
      });

      logger.info(`[SecurityAudit] ${params.eventType}`, {
        userId: params.userId,
        severity: params.severity,
        riskScore: params.riskScore,
        eventType: params.eventType,
      });
    } catch (err: any) {
      // Never throw from audit logging to prevent breaking user transaction flows
      logger.error("Failed to record security audit event", {
        eventType: params.eventType,
        userId: params.userId,
        error: err.message,
      });
    }
  }

  public static async logLoginSuccess(userId: string, ipAddress?: string, userAgent?: string, visitorId?: string, riskScore?: number): Promise<void> {
    await this.recordEvent({
      userId,
      visitorId,
      eventType: "LOGIN_SUCCESS",
      severity: "INFO",
      riskScore: riskScore ?? 0,
      ipAddress,
      userAgent,
    });
  }

  public static async logLoginFailure(identifier: string, ipAddress?: string, userAgent?: string, visitorId?: string, reason?: string): Promise<void> {
    await this.recordEvent({
      visitorId,
      eventType: "LOGIN_FAILURE",
      severity: "WARNING",
      ipAddress,
      userAgent,
      metadata: { identifier, reason },
    });
  }

  public static async logSessionRevocation(userId: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.recordEvent({
      userId,
      eventType: "SESSION_REVOKED",
      severity: "WARNING",
      ipAddress,
      userAgent,
      metadata: { reason },
    });
  }

  public static async logImpossibleTravel(userId: string, prevLocation: string, currLocation: string, speedKmH: number, ipAddress?: string): Promise<void> {
    await this.recordEvent({
      userId,
      eventType: "IMPOSSIBLE_TRAVEL_DETECTED",
      severity: "CRITICAL",
      riskScore: 60,
      riskLevel: "HIGH",
      ipAddress,
      metadata: { prevLocation, currLocation, speedKmH },
    });
  }

  public static async logKeyRotation(adminId?: string, oldKeyId?: string, newKeyId?: string, recordsMigrated?: number): Promise<void> {
    await this.recordEvent({
      userId: adminId,
      eventType: "KEY_ROTATED",
      severity: "CRITICAL",
      metadata: { oldKeyId, newKeyId, recordsMigrated },
    });
  }
}
