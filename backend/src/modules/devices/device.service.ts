import { DeviceRepository } from "./device.repository";
import {
  DeviceIdentifyRequest,
  DeviceAlertDecisionRequest,
  DeviceStatus,
  TrustLevel,
  RiskEvaluationResult,
} from "./device.types";
import { logger } from "../../utils/logger";
import { GeoIpUtil } from "../../utils/geoIp.util";
import { prisma } from "../../config/prisma";
import { SessionRevocationService } from "../../services/security/SessionRevocationService";

export class DeviceService {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  /**
   * Parses basic user agent string into a clean human-readable device label.
   */
  public parseDeviceLabel(userAgent?: string, fallbackLabel?: string): string {
    if (fallbackLabel && fallbackLabel.trim().length > 0) {
      return fallbackLabel;
    }
    if (!userAgent) return "Unknown Device";

    let browser = "Browser";
    if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edg")) browser = "Edge";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";

    let os = "Desktop";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS") || userAgent.includes("Macintosh")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  }

  /**
   * Extracts detailed browser, os, and category information from user agent.
   */
  public parseBrowserAndOs(userAgent?: string): { browser: string; os: string; deviceType: "DESKTOP" | "MOBILE" | "TABLET" } {
    if (!userAgent) {
      return { browser: "Unknown Browser", os: "Unknown OS", deviceType: "DESKTOP" };
    }

    let browser = "Browser";
    if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edg")) browser = "Edge";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";

    let os = "Desktop";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS") || userAgent.includes("Macintosh")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    const deviceType = this.classifyDeviceCategory(userAgent);
    return { browser, os, deviceType };
  }

  /**
   * Classifies user agent into DESKTOP, MOBILE, or TABLET category.
   */
  public classifyDeviceCategory(userAgent?: string, deviceLabel?: string): "DESKTOP" | "MOBILE" | "TABLET" {
    const raw = `${userAgent || ""} ${deviceLabel || ""}`.toLowerCase();
    if (raw.includes("ipad") || (raw.includes("tablet") && !raw.includes("mobile"))) {
      return "TABLET";
    }
    if (raw.includes("mobile") || raw.includes("android") || raw.includes("iphone") || raw.includes("ipod") || raw.includes("ios")) {
      return "MOBILE";
    }
    return "DESKTOP";
  }

  /**
   * Enforces 1 Desktop + 1 Mobile concurrent session cap policy.
   * If a second device in the same category logs in, force-evicts the prior session in that category.
   */
  public async enforceConcurrentSessionPolicy(
    userId: string,
    currentDeviceId: string,
    context: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<{ evictedDeviceId?: string }> {
    const userDevices = await this.deviceRepository.findByUserId(userId);
    const currentCategory = this.classifyDeviceCategory(context.userAgent);

    let evictedDeviceId: string | undefined;

    for (const dev of userDevices) {
      if (dev.id === currentDeviceId) continue;
      if (dev.status === "REVOKED" || dev.status === "BLOCKED" || dev.status === "REJECTED") continue;

      const devCategory = this.classifyDeviceCategory(dev.deviceLabel);

      if (devCategory === currentCategory) {
        evictedDeviceId = dev.id;
        await this.deviceRepository.updateDeviceStatus(dev.id, "REVOKED", "UNTRUSTED");

        await this.deviceRepository.createAuditEvent({
          userId,
          deviceId: dev.id,
          eventType: "FORCED_LOGOUT_CONCURRENT_CAP",
          severity: "WARNING",
          riskScore: 50,
          riskLevel: "MEDIUM",
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          metadata: {
            category: currentCategory,
            evictedDeviceId: dev.id,
            newDeviceId: currentDeviceId,
            reason: "CONCURRENT_SESSION_LIMIT_EXCEEDED",
          },
        });

        try {
          const { SocketServer } = require("../../socket/socketServer");
          SocketServer.emitToUser(userId, "security:session-revoked", {
            deviceId: dev.id,
            reason: "CONCURRENT_SESSION_LIMIT_EXCEEDED",
            category: currentCategory,
            timestamp: new Date().toISOString(),
          });
        } catch {}
      }
    }

    return { evictedDeviceId };
  }

  /**
   * Identify device via FingerprintJS, determine if it is a new device,
   * log the telemetry to the database, and trigger email alert if new.
   */
  public async identifyAndEvaluateDevice(
    userId: string,
    payload: DeviceIdentifyRequest,
    context: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<{
    device: any;
    isNew: boolean;
    requiresAlert: boolean;
    telemetry: {
      ip: string;
      region: string;
      screenResolution?: string;
      deviceLabel: string;
    };
    risk: RiskEvaluationResult;
  }> {
    const visitorId = payload.visitorId?.trim();
    const effectiveIp = context.ipAddress || "127.0.0.1";
    const location = GeoIpUtil.resolveLocation(effectiveIp);
    const { browser, os, deviceType } = this.parseBrowserAndOs(context.userAgent);
    const deviceLabel = this.parseDeviceLabel(context.userAgent, payload.deviceLabel);
    const screenResolution = payload.screenResolution || "Unknown Resolution";

    if (!visitorId) {
      logger.warn(`Device identification requested without visitorId for user ${userId}`);
      return {
        device: null,
        isNew: false,
        requiresAlert: false,
        telemetry: {
          ip: effectiveIp,
          region: location.formattedLocation,
          screenResolution,
          deviceLabel,
        },
        risk: {
          score: 40,
          level: "MEDIUM",
          reasons: ["Fingerprint visitorId unavailable or blocked"],
          requiresStepUp: false,
        },
      };
    }

    let existingDevice = await this.deviceRepository.findByUserIdAndVisitorId(
      userId,
      visitorId,
    );

    let isNew = false;
    let requiresAlert = false;

    if (!existingDevice) {
      isNew = true;
      requiresAlert = true;

      existingDevice = await this.deviceRepository.createDevice({
        userId,
        visitorId,
        provider: payload.provider || "fingerprintjs",
        providerVersion: payload.providerVersion || "5.x",
        deviceLabel,
        browser,
        os,
        deviceType,
        screenResolution,
        ipAddress: effectiveIp,
        region: location.formattedLocation,
        city: location.city,
        country: location.country,
        userAgent: context.userAgent,
        status: "NEW",
        trustLevel: "UNTRUSTED",
      });

      // Maintain initial pending login log in database
      let emailSent = false;
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user && user.email) {
          const { emailService } = require("../email");
          emailSent = await emailService.sendNewDeviceLoginAlert({
            email: user.email,
            name: user.name,
            deviceLabel,
            screenResolution,
            ipAddress: effectiveIp,
            location: location.formattedLocation,
            loginTime: new Date().toUTCString(),
          }).catch((err: any) => {
            logger.warn("Failed to dispatch new device login alert email:", err);
            return false;
          });
        }
      } catch (emailErr) {
        logger.warn("Email alert trigger error:", emailErr);
      }

      await this.deviceRepository.createLoginLog({
        userId,
        deviceId: existingDevice.id,
        visitorId,
        deviceLabel,
        screenResolution,
        ipAddress: effectiveIp,
        region: location.formattedLocation,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        status: "PENDING_ALERT",
        emailSent,
        userAgent: context.userAgent,
      });

      await this.deviceRepository.createAuditEvent({
        userId,
        deviceId: existingDevice.id,
        eventType: "NEW_DEVICE_DETECTED",
        severity: "INFO",
        riskScore: 0,
        riskLevel: "LOW",
        ipAddress: effectiveIp,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          deviceLabel,
          screenResolution,
          location: location.formattedLocation,
          visitorIdHash: existingDevice.visitorIdHash,
        },
      });
    } else {
      // Existing device
      requiresAlert = existingDevice.status === "NEW";

      await this.deviceRepository.updateDeviceActivity(existingDevice.id, {
        ipAddress: effectiveIp,
        userAgent: context.userAgent,
        screenResolution,
        region: location.formattedLocation,
        city: location.city,
        country: location.country,
      });

      // If existing device is already TRUSTED, log an auto-trusted sign-in
      if (existingDevice.status === "TRUSTED") {
        await this.deviceRepository.createLoginLog({
          userId,
          deviceId: existingDevice.id,
          visitorId,
          deviceLabel,
          screenResolution,
          ipAddress: effectiveIp,
          region: location.formattedLocation,
          city: location.city,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
          status: "AUTO_TRUSTED",
          actionTaken: "AUTO_TRUSTED",
          emailSent: false,
          userAgent: context.userAgent,
        });
      } else if (existingDevice.status === "NEW") {
        // Create pending log for this login attempt
        await this.deviceRepository.createLoginLog({
          userId,
          deviceId: existingDevice.id,
          visitorId,
          deviceLabel,
          screenResolution,
          ipAddress: effectiveIp,
          region: location.formattedLocation,
          city: location.city,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
          status: "PENDING_ALERT",
          emailSent: false,
          userAgent: context.userAgent,
        });
      }
    }

    return {
      device: {
        id: existingDevice.id,
        deviceLabel: existingDevice.deviceLabel,
        status: existingDevice.status,
        trustLevel: existingDevice.trustLevel,
        screenResolution: (existingDevice as any).screenResolution || screenResolution,
        region: (existingDevice as any).region || location.formattedLocation,
        isNew,
        firstSeenAt: existingDevice.firstSeenAt,
        lastSeenAt: existingDevice.lastSeenAt,
      },
      isNew,
      requiresAlert,
      telemetry: {
        ip: effectiveIp,
        region: location.formattedLocation,
        screenResolution,
        deviceLabel,
      },
      risk: {
        score: existingDevice.status === "BLOCKED" ? 100 : existingDevice.status === "REJECTED" ? 80 : 0,
        level: existingDevice.status === "BLOCKED" ? "CRITICAL" : "LOW",
        reasons: isNew ? ["New device login detected"] : [],
        requiresStepUp: false,
      },
    };
  }

  /**
   * Processes the user's Accept or Reject decision for a new device login alert.
   */
  public async processAlertDecision(
    userId: string,
    payload: DeviceAlertDecisionRequest,
    context: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<{
    status: "ACCEPTED" | "REJECTED";
    loggedOut?: boolean;
    message: string;
    device?: any;
  }> {
    const { visitorId, decision, screenResolution, deviceId } = payload;
    const effectiveIp = context.ipAddress || "127.0.0.1";
    const location = GeoIpUtil.resolveLocation(effectiveIp);

    // Locate device record
    let device = deviceId
      ? await this.deviceRepository.findById(deviceId)
      : await this.deviceRepository.findByUserIdAndVisitorId(userId, visitorId);

    if (decision === "ACCEPT") {
      if (device) {
        device = await this.deviceRepository.updateDeviceStatus(
          device.id,
          "TRUSTED",
          "TRUSTED",
        );
      }

      await this.deviceRepository.updateLoginLogDecision(
        { userId, visitorId, id: undefined },
        {
          status: "ACCEPTED",
          actionTaken: "USER_ACCEPTED",
          deviceId: device?.id,
          screenResolution,
        },
      );

      await this.deviceRepository.createAuditEvent({
        userId,
        deviceId: device?.id,
        eventType: "DEVICE_ALERT_ACCEPTED",
        severity: "INFO",
        riskScore: 0,
        riskLevel: "LOW",
        ipAddress: effectiveIp,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          deviceLabel: device?.deviceLabel,
          screenResolution,
          location: location.formattedLocation,
        },
      });

      return {
        status: "ACCEPTED",
        message: "Device login accepted and marked as trusted.",
        device,
      };
    } else {
      // REJECT decision
      if (device) {
        device = await this.deviceRepository.updateDeviceStatus(
          device.id,
          "REJECTED",
          "UNTRUSTED",
        );
      }

      await this.deviceRepository.updateLoginLogDecision(
        { userId, visitorId, id: undefined },
        {
          status: "REJECTED",
          actionTaken: "USER_REJECTED",
          deviceId: device?.id,
          screenResolution,
        },
      );

      await this.deviceRepository.createAuditEvent({
        userId,
        deviceId: device?.id,
        eventType: "DEVICE_ALERT_REJECTED",
        severity: "CRITICAL",
        riskScore: 90,
        riskLevel: "HIGH",
        ipAddress: effectiveIp,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          deviceLabel: device?.deviceLabel,
          screenResolution,
          location: location.formattedLocation,
        },
      });

      // Terminate / revoke session for this user
      try {
        await SessionRevocationService.revokeAllSessions(
          userId,
          "USER_REJECTED_NEW_DEVICE_ALERT",
          effectiveIp,
          context.userAgent,
        );
      } catch (revErr) {
        logger.warn("Session revocation on device rejection notice:", revErr);
      }

      return {
        status: "REJECTED",
        loggedOut: true,
        message: "Device login rejected and session terminated for security.",
        device,
      };
    }
  }

  public async getUserDevices(userId: string) {
    const devices = await this.deviceRepository.findByUserId(userId);
    return devices.map((d: any) => ({
      id: d.id,
      deviceLabel: d.deviceLabel,
      browser: d.browser,
      os: d.os,
      deviceType: d.deviceType,
      screenResolution: d.screenResolution,
      region: d.region,
      city: d.city,
      country: d.country,
      ipAddress: d.ipAddress,
      status: d.status,
      trustLevel: d.trustLevel,
      provider: d.provider,
      firstSeenAt: d.firstSeenAt,
      lastSeenAt: d.lastSeenAt,
      lastLoginAt: d.lastLoginAt,
      revokedAt: d.revokedAt,
    }));
  }

  public async getDeviceLoginLogs(userId: string) {
    return this.deviceRepository.getLoginLogs(userId, 40);
  }

  public async trustDevice(userId: string, deviceId: string, context?: any) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device || device.userId !== userId) {
      throw new Error("Device not found or unauthorized");
    }
    if (device.status === "BLOCKED") {
      throw new Error("Cannot trust an explicitly blocked device");
    }

    const updated = await this.deviceRepository.updateDeviceStatus(
      deviceId,
      "TRUSTED",
      "TRUSTED",
    );

    await this.deviceRepository.createAuditEvent({
      userId,
      deviceId,
      eventType: "DEVICE_TRUSTED",
      severity: "INFO",
      riskScore: 0,
      riskLevel: "LOW",
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
      metadata: { deviceLabel: device.deviceLabel },
    });

    return updated;
  }

  public async revokeDevice(userId: string, deviceId: string, context?: any) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device || device.userId !== userId) {
      throw new Error("Device not found or unauthorized");
    }

    const updated = await this.deviceRepository.updateDeviceStatus(
      deviceId,
      "REVOKED",
      "UNTRUSTED",
    );

    await this.deviceRepository.createAuditEvent({
      userId,
      deviceId,
      eventType: "DEVICE_REVOKED",
      severity: "WARNING",
      riskScore: 60,
      riskLevel: "HIGH",
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
      metadata: { deviceLabel: device.deviceLabel },
    });

    return updated;
  }

  public async blockDevice(deviceId: string, adminUserId?: string, context?: any) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const updated = await this.deviceRepository.updateDeviceStatus(
      deviceId,
      "BLOCKED",
      "UNTRUSTED",
    );

    await this.deviceRepository.createAuditEvent({
      userId: device.userId,
      deviceId,
      eventType: "DEVICE_BLOCKED",
      severity: "CRITICAL",
      riskScore: 100,
      riskLevel: "CRITICAL",
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
      metadata: { blockedBy: adminUserId || "SYSTEM", deviceLabel: device.deviceLabel },
    });

    return updated;
  }

  public async unblockDevice(deviceId: string, adminUserId?: string, context?: any) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const updated = await this.deviceRepository.updateDeviceStatus(
      deviceId,
      "NEW",
      "UNTRUSTED",
    );

    await this.deviceRepository.createAuditEvent({
      userId: device.userId,
      deviceId,
      eventType: "DEVICE_UNBLOCKED",
      severity: "INFO",
      riskScore: 25,
      riskLevel: "MEDIUM",
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
      metadata: { unblockedBy: adminUserId || "SYSTEM", deviceLabel: device.deviceLabel },
    });

    return updated;
  }

  public async getSecurityEvents(userId?: string) {
    return this.deviceRepository.getAuditEvents(userId, 50);
  }
}
