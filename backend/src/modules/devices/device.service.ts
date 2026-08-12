import { DeviceRepository } from "./device.repository";
import { DeviceRiskEngine } from "./device.riskEngine";
import {
  DeviceIdentifyRequest,
  DeviceStatus,
  TrustLevel,
  RiskEvaluationResult,
} from "./device.types";
import { logger } from "../../utils/logger";

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
    else if (userAgent.includes("Mac OS")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  }

  /**
   * Identify device and evaluate security risk.
   */
  public async identifyAndEvaluateDevice(
    userId: string,
    payload: DeviceIdentifyRequest,
    context: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<{
    device: any;
    isNew: boolean;
    risk: RiskEvaluationResult;
  }> {
    const visitorId = payload.visitorId?.trim();
    if (!visitorId) {
      logger.warn(`Device identification requested without visitorId for user ${userId}`);
      const fallbackRisk: RiskEvaluationResult = {
        score: 40,
        level: "MEDIUM",
        reasons: ["Fingerprint visitorId unavailable or blocked"],
        requiresStepUp: false,
      };
      return {
        device: null,
        isNew: false,
        risk: fallbackRisk,
      };
    }

    const deviceLabel = this.parseDeviceLabel(context.userAgent, payload.deviceLabel);
    let existingDevice = await this.deviceRepository.findByUserIdAndVisitorId(
      userId,
      visitorId,
    );

    let isNew = false;
    let deviceStatus: DeviceStatus = "NEW";

    if (!existingDevice) {
      isNew = true;
      existingDevice = await this.deviceRepository.createDevice({
        userId,
        visitorId,
        provider: payload.provider || "fingerprintjs",
        providerVersion: payload.providerVersion,
        deviceLabel,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        status: "NEW",
        trustLevel: "UNTRUSTED",
      });

      await this.deviceRepository.createAuditEvent({
        userId,
        deviceId: existingDevice.id,
        eventType: "NEW_DEVICE",
        severity: "INFO",
        riskScore: 25,
        riskLevel: "MEDIUM",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { deviceLabel, visitorIdHash: existingDevice.visitorIdHash },
      });
    } else {
      deviceStatus = existingDevice.status as DeviceStatus;
      await this.deviceRepository.updateDeviceActivity(existingDevice.id, {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    const risk = DeviceRiskEngine.evaluate({
      isNewDevice: isNew,
      deviceStatus,
      failedAttempts: existingDevice.failedAttempts,
      ipChanged: false,
    });

    if (risk.level === "HIGH" || risk.level === "CRITICAL") {
      await this.deviceRepository.createAuditEvent({
        userId,
        deviceId: existingDevice.id,
        eventType: "SUSPICIOUS_LOGIN",
        severity: risk.level === "CRITICAL" ? "CRITICAL" : "WARNING",
        riskScore: risk.score,
        riskLevel: risk.level,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reasons: risk.reasons },
      });
    }

    return {
      device: {
        id: existingDevice.id,
        deviceLabel: existingDevice.deviceLabel,
        status: existingDevice.status,
        trustLevel: existingDevice.trustLevel,
        isNew,
        firstSeenAt: existingDevice.firstSeenAt,
        lastSeenAt: existingDevice.lastSeenAt,
      },
      isNew,
      risk,
    };
  }

  public async getUserDevices(userId: string) {
    const devices = await this.deviceRepository.findByUserId(userId);
    return devices.map((d) => ({
      id: d.id,
      deviceLabel: d.deviceLabel,
      status: d.status,
      trustLevel: d.trustLevel,
      provider: d.provider,
      firstSeenAt: d.firstSeenAt,
      lastSeenAt: d.lastSeenAt,
      lastLoginAt: d.lastLoginAt,
      revokedAt: d.revokedAt,
    }));
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
