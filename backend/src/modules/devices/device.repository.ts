import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  DeviceStatus,
  TrustLevel,
  SecurityAuditEventInput,
} from "./device.types";

export class DeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public hashVisitorId(visitorId: string): string {
    return crypto
      .createHash("sha256")
      .update(`roombae_visitor_salt_${visitorId}`)
      .digest("hex");
  }

  public hashIpAddress(ipAddress?: string): string | undefined {
    if (!ipAddress) return undefined;
    return crypto
      .createHash("sha256")
      .update(`roombae_ip_salt_${ipAddress}`)
      .digest("hex");
  }

  public hashUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    return crypto
      .createHash("sha256")
      .update(`roombae_ua_salt_${userAgent}`)
      .digest("hex");
  }

  public async findByUserIdAndVisitorId(userId: string, visitorId: string) {
    const visitorIdHash = this.hashVisitorId(visitorId);
    return this.prisma.userDevice.findUnique({
      where: {
        userId_visitorIdHash: {
          userId,
          visitorIdHash,
        },
      },
    });
  }

  public async findById(deviceId: string) {
    return this.prisma.userDevice.findUnique({
      where: { id: deviceId },
    });
  }

  public async findByUserId(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  public async createDevice(data: {
    userId: string;
    visitorId: string;
    provider?: string;
    providerVersion?: string;
    deviceLabel: string;
    ipAddress?: string;
    userAgent?: string;
    status?: DeviceStatus;
    trustLevel?: TrustLevel;
  }) {
    const visitorIdHash = this.hashVisitorId(data.visitorId);
    const lastIpHash = this.hashIpAddress(data.ipAddress);
    const userAgentHash = this.hashUserAgent(data.userAgent);

    return this.prisma.userDevice.create({
      data: {
        userId: data.userId,
        visitorIdHash,
        provider: data.provider || "fingerprintjs",
        providerVersion: data.providerVersion || "4.x",
        deviceLabel: data.deviceLabel,
        status: data.status || "NEW",
        trustLevel: data.trustLevel || "UNTRUSTED",
        lastIpHash,
        userAgentHash,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        lastLoginAt: new Date(),
      },
    });
  }

  public async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus,
    trustLevel?: TrustLevel,
  ) {
    const data: any = {
      status,
      updatedAt: new Date(),
    };
    if (trustLevel) {
      data.trustLevel = trustLevel;
    }
    if (status === "REVOKED") {
      data.revokedAt = new Date();
    }
    return this.prisma.userDevice.update({
      where: { id: deviceId },
      data,
    });
  }

  public async updateDeviceActivity(
    deviceId: string,
    data: {
      ipAddress?: string;
      userAgent?: string;
      incrementFailed?: boolean;
      resetFailed?: boolean;
    },
  ) {
    const updateData: any = {
      lastSeenAt: new Date(),
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };

    if (data.ipAddress) {
      updateData.lastIpHash = this.hashIpAddress(data.ipAddress);
    }
    if (data.userAgent) {
      updateData.userAgentHash = this.hashUserAgent(data.userAgent);
    }
    if (data.resetFailed) {
      updateData.failedAttempts = 0;
    } else if (data.incrementFailed) {
      updateData.failedAttempts = { increment: 1 };
    }

    return this.prisma.userDevice.update({
      where: { id: deviceId },
      data: updateData,
    });
  }

  public async createAuditEvent(event: SecurityAuditEventInput) {
    return this.prisma.securityAuditEvent.create({
      data: {
        userId: event.userId,
        deviceId: event.deviceId,
        eventType: event.eventType,
        severity: event.severity || "INFO",
        riskScore: event.riskScore || 0,
        riskLevel: event.riskLevel || "LOW",
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        requestId: event.requestId,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    });
  }

  public async getAuditEvents(userId?: string, limit: number = 50) {
    return this.prisma.securityAuditEvent.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
