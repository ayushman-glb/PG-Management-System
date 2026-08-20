import { PrismaClient } from "@prisma/client";
import {
  DeviceStatus,
  TrustLevel,
  SecurityAuditEventInput,
} from "./device.types";
import {
  hashVisitorId,
  hashIpAddress,
  hashUserAgent,
} from "../../utils/hashing";

export class DeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public hashVisitorId(visitorId: string): string {
    return hashVisitorId(visitorId);
  }

  public hashIpAddress(ipAddress?: string): string | undefined {
    return hashIpAddress(ipAddress);
  }

  public hashUserAgent(userAgent?: string): string | undefined {
    return hashUserAgent(userAgent);
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
    browser?: string;
    os?: string;
    deviceType?: string;
    screenResolution?: string;
    ipAddress?: string;
    region?: string;
    city?: string;
    country?: string;
    userAgent?: string;
    status?: DeviceStatus;
    trustLevel?: TrustLevel;
  }) {
    const visitorIdHash = this.hashVisitorId(data.visitorId);
    const lastIpHash = this.hashIpAddress(data.ipAddress);
    const userAgentHash = this.hashUserAgent(data.userAgent);

    if (typeof this.prisma.userDevice?.upsert === "function") {
      return this.prisma.userDevice.upsert({
        where: {
          userId_visitorIdHash: {
            userId: data.userId,
            visitorIdHash,
          },
        },
        create: {
          userId: data.userId,
          visitorIdHash,
          provider: data.provider || "fingerprintjs",
          providerVersion: data.providerVersion || "5.x",
          deviceLabel: data.deviceLabel,
          browser: data.browser,
          os: data.os,
          deviceType: data.deviceType,
          screenResolution: data.screenResolution,
          ipAddress: data.ipAddress,
          region: data.region,
          city: data.city,
          country: data.country,
          status: data.status || "NEW",
          trustLevel: data.trustLevel || "UNTRUSTED",
          lastIpHash,
          userAgentHash,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          lastLoginAt: new Date(),
        },
        update: {
          deviceLabel: data.deviceLabel,
          browser: data.browser,
          os: data.os,
          deviceType: data.deviceType,
          screenResolution: data.screenResolution,
          ipAddress: data.ipAddress,
          region: data.region,
          city: data.city,
          country: data.country,
          lastIpHash,
          userAgentHash,
          lastSeenAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    }

    return this.prisma.userDevice.create({
      data: {
        userId: data.userId,
        visitorIdHash,
        provider: data.provider || "fingerprintjs",
        providerVersion: data.providerVersion || "5.x",
        deviceLabel: data.deviceLabel,
        browser: data.browser,
        os: data.os,
        deviceType: data.deviceType,
        screenResolution: data.screenResolution,
        ipAddress: data.ipAddress,
        region: data.region,
        city: data.city,
        country: data.country,
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
    if (status === "REVOKED" || status === "REJECTED") {
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
      screenResolution?: string;
      region?: string;
      city?: string;
      country?: string;
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
      updateData.ipAddress = data.ipAddress;
      updateData.lastIpHash = this.hashIpAddress(data.ipAddress);
    }
    if (data.screenResolution) {
      updateData.screenResolution = data.screenResolution;
    }
    if (data.region) updateData.region = data.region;
    if (data.city) updateData.city = data.city;
    if (data.country) updateData.country = data.country;
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

  public async createLoginLog(data: {
    userId: string;
    deviceId?: string;
    visitorId?: string;
    deviceLabel: string;
    screenResolution?: string;
    ipAddress: string;
    region?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    status: "PENDING_ALERT" | "ACCEPTED" | "REJECTED" | "AUTO_TRUSTED";
    actionTaken?: string;
    emailSent?: boolean;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    const visitorIdHash = data.visitorId ? this.hashVisitorId(data.visitorId) : undefined;
    if (!this.prisma.deviceLoginLog?.create) {
      return null as any;
    }
    return this.prisma.deviceLoginLog.create({
      data: {
        userId: data.userId,
        deviceId: data.deviceId,
        visitorIdHash,
        deviceLabel: data.deviceLabel,
        screenResolution: data.screenResolution,
        ipAddress: data.ipAddress,
        region: data.region,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        actionTaken: data.actionTaken,
        emailSent: data.emailSent || false,
        emailSentAt: data.emailSent ? new Date() : null,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  public async updateLoginLogDecision(
    logIdOrUserIdVisitorId: { id?: string; userId?: string; visitorId?: string },
    data: {
      status: "ACCEPTED" | "REJECTED";
      actionTaken: "USER_ACCEPTED" | "USER_REJECTED";
      deviceId?: string;
      screenResolution?: string;
    },
  ) {
    if (!this.prisma.deviceLoginLog) {
      return null as any;
    }
    if (logIdOrUserIdVisitorId.id) {
      return this.prisma.deviceLoginLog.update({
        where: { id: logIdOrUserIdVisitorId.id },
        data: {
          status: data.status,
          actionTaken: data.actionTaken,
          actionAt: new Date(),
          ...(data.deviceId ? { deviceId: data.deviceId } : {}),
          ...(data.screenResolution ? { screenResolution: data.screenResolution } : {}),
        },
      });
    }

    const visitorIdHash = logIdOrUserIdVisitorId.visitorId
      ? this.hashVisitorId(logIdOrUserIdVisitorId.visitorId)
      : undefined;

    const existingLog = await this.prisma.deviceLoginLog.findFirst({
      where: {
        userId: logIdOrUserIdVisitorId.userId,
        ...(visitorIdHash ? { visitorIdHash } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingLog) {
      return this.prisma.deviceLoginLog.update({
        where: { id: existingLog.id },
        data: {
          status: data.status,
          actionTaken: data.actionTaken,
          actionAt: new Date(),
          ...(data.deviceId ? { deviceId: data.deviceId } : {}),
          ...(data.screenResolution ? { screenResolution: data.screenResolution } : {}),
        },
      });
    }

    return null;
  }

  public async getLoginLogs(userId: string, limit = 50) {
    if (!this.prisma.deviceLoginLog?.findMany) {
      return [];
    }
    return this.prisma.deviceLoginLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
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
