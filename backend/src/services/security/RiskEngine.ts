import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { SecurityAuditService } from "./SecurityAuditService";
import {
  hashVisitorId,
  hashIpAddress,
  hashUserAgent,
} from "../../utils/hashing";

export interface GeoLocationData {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  asn?: string;
  isVpn?: boolean;
}

export interface RiskEvaluationResult {
  decision: "ALLOW" | "STEP_UP" | "BLOCK";
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  signals: string[];
  deviceRecord?: any;
  errorCode?: string;
  recoveryGuidance?: string;
}

/**
 * Enterprise Behavioral & Probabilistic Device Anomaly Risk Engine
 * 
 * Evaluates multi-signal risk vectors including probabilistic browser fingerprinting (FingerprintJS),
 * network rotation, ASN shifts, VPN/Tor usage, and geographic velocity (impossible travel).
 */
export class RiskEngine {
  private static readonly MAX_REALISTIC_TRAVEL_SPEED_KMH = 800; // Commercial jet speed threshold

  public static hashVisitorId(val: string): string {
    return hashVisitorId(val);
  }

  public static hashIpAddress(ip?: string): string | undefined {
    return hashIpAddress(ip);
  }

  public static hashUserAgent(ua?: string): string | undefined {
    return hashUserAgent(ua);
  }

  /**
   * Calculates Haversine distance in kilometers between two geo-coordinates
   */
  public static calculateHaversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Computes risk score for a login attempt
   */
  public static async evaluateLoginRisk(
    userId: string,
    visitorId?: string,
    ipAddress?: string,
    userAgent?: string,
    geoData?: GeoLocationData
  ): Promise<RiskEvaluationResult> {
    let riskScore = 0;
    const signals: string[] = [];

    if (!userId) {
      return {
        decision: "BLOCK",
        riskScore: 100,
        riskLevel: "CRITICAL",
        signals: ["MISSING_USER_ID"],
      };
    }

    const cleanVisitorId = visitorId?.trim() || "";
    const visitorIdHash = cleanVisitorId ? this.hashVisitorId(cleanVisitorId) : "";
    const ipHash = ipAddress ? this.hashIpAddress(ipAddress.trim()) : undefined;
    const uaHash = userAgent ? this.hashUserAgent(userAgent.trim()) : undefined;

    // 1. Query existing device records for this user
    let existingDevice: any = null;
    try {
      if (visitorIdHash && (prisma as any).userDevice) {
        existingDevice = await (prisma as any).userDevice.findFirst({
          where: {
            userId,
            visitorIdHash,
          },
        });
      }
    } catch (dbErr: any) {
      logger.debug("RiskEngine device lookup skipped", { userId, error: dbErr?.message });
    }

    // 2. Query last successful login for impossible travel calculation
    let lastLogin: any = null;
    try {
      if ((prisma as any).loginHistory) {
        lastLogin = await (prisma as any).loginHistory.findFirst({
          where: { userId, status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (loginErr: any) {
      logger.debug("RiskEngine last login lookup skipped", { userId, error: loginErr?.message });
    }

    // Signal: Device Fingerprint Assessment
    if (cleanVisitorId === "anonymous_device" || !cleanVisitorId) {
      riskScore += 30;
      signals.push("MISSING_DEVICE_FINGERPRINT (+30)");
    } else if (!existingDevice) {
      riskScore += 15;
      signals.push("NEW_DEVICE_IDENTIFIED (+15) (Alert & Telemetry Workflow)");
    } else {
      if (existingDevice.status === "BLOCKED") {
        riskScore += 100;
        signals.push("ADMIN_BLOCKED_DEVICE (+100)");
      } else if (existingDevice.status === "REVOKED" || existingDevice.status === "REJECTED") {
        riskScore += 0;
        signals.push("PREVIOUSLY_REJECTED_DEVICE (Alert Modal Required)");
      } else if (existingDevice.status === "TRUSTED" || existingDevice.trustLevel === "TRUSTED") {
        riskScore -= 40;
        signals.push("KNOWN_TRUSTED_DEVICE (-40)");
      }
    }

    // Signal: IP Subnet & Network Shift Assessment
    if (existingDevice && ipHash && existingDevice.lastIpHash) {
      if (existingDevice.lastIpHash !== ipHash) {
        riskScore += 15;
        signals.push("IP_ADDRESS_ROTATION (+15)");
      }
    }

    // Signal: User-Agent Anomaly
    if (existingDevice && uaHash && existingDevice.userAgentHash) {
      if (existingDevice.userAgentHash !== uaHash) {
        riskScore += 20;
        signals.push("USER_AGENT_MISMATCH (+20)");
      }
    }

    // Signal: Failed Attempts Anomaly on Device
    if (existingDevice && existingDevice.failedAttempts > 3) {
      riskScore += 30;
      signals.push("RECENT_FAILED_ATTEMPTS_ON_DEVICE (+30)");
    }

    // Signal: VPN / Tor / Proxy Detection
    if (geoData?.isVpn) {
      riskScore += 25;
      signals.push("VPN_PROXY (+25)");
    }

    // Signal: Country Shift
    if (geoData?.country && existingDevice?.country && geoData.country !== existingDevice.country) {
      riskScore += 25;
      signals.push("NEW_COUNTRY (+25)");
    }

    // Signal: ASN Shift
    if (geoData?.asn && existingDevice?.asn && geoData.asn !== existingDevice.asn) {
      riskScore += 20;
      signals.push("ASN_CHANGED (+20)");
    }

    // Signal: Impossible Travel Speed Calculation
    if (
      geoData?.latitude !== undefined &&
      geoData?.longitude !== undefined &&
      lastLogin?.latitude !== undefined &&
      lastLogin?.longitude !== undefined &&
      lastLogin?.createdAt
    ) {
      const distanceKm = this.calculateHaversineDistanceKm(
        lastLogin.latitude,
        lastLogin.longitude,
        geoData.latitude,
        geoData.longitude
      );

      const timeElapsedHours = (Date.now() - new Date(lastLogin.createdAt).getTime()) / (1000 * 60 * 60);

      if (timeElapsedHours > 0.001) {
        const speedKmH = distanceKm / timeElapsedHours;
        if (speedKmH > this.MAX_REALISTIC_TRAVEL_SPEED_KMH && distanceKm > 100) {
          riskScore += 35;
          signals.push(`IMPOSSIBLE_TRAVEL (+35) - Speed: ${Math.round(speedKmH)} km/h across ${Math.round(distanceKm)} km`);

          // Asynchronously log audit event for impossible travel with error catch
          SecurityAuditService.logImpossibleTravel(
            userId,
            lastLogin.city || "Unknown",
            geoData.city || "Unknown",
            Math.round(speedKmH),
            ipAddress
          ).catch((err: any) =>
            logger.error("logImpossibleTravel failed", { userId, error: err?.message })
          );
        }
      }
    }

    // Normalize final score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, riskScore));

    let decision: "ALLOW" | "STEP_UP" | "BLOCK" = "ALLOW";
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

    if (existingDevice?.status === "BLOCKED") {
      decision = "BLOCK";
      riskLevel = "CRITICAL";
    } else if (finalScore >= 70) {
      decision = "STEP_UP";
      riskLevel = "HIGH";
    } else if (finalScore >= 40) {
      decision = "STEP_UP";
      riskLevel = "MEDIUM";
    } else {
      decision = "ALLOW";
      riskLevel = "LOW";
    }

    logger.info("RiskEngine login evaluation", {
      userId,
      visitorId: cleanVisitorId ? cleanVisitorId.substring(0, 8) + "..." : "NONE",
      finalScore,
      decision,
      signals,
    });

    return {
      decision,
      riskScore: finalScore,
      riskLevel,
      signals,
      deviceRecord: existingDevice,
      ...(decision === 'BLOCK' ? {
        errorCode: 'ACCOUNT_LOGIN_BLOCKED_HIGH_RISK',
        recoveryGuidance: 'Your login was blocked due to multiple high-risk signals. Please contact support or attempt login from a recognized device.'
      } : {}),
    };
  }

  /**
   * Registers or updates a device record upon successful login / verified 2FA
   */
  public static async recordDeviceSuccess(
    userId: string,
    visitorId: string,
    ipAddress?: string,
    userAgent?: string,
    trustDevice: boolean = false,
    geoData?: GeoLocationData
  ): Promise<any> {
    if (!userId || !visitorId) return null;

    const visitorIdHash = this.hashVisitorId(visitorId);
    const ipHash = ipAddress ? this.hashIpAddress(ipAddress) : null;
    const uaHash = userAgent ? this.hashUserAgent(userAgent) : null;

    try {
      // 1. Record Login History
      if ((prisma as any).loginHistory) {
        await (prisma as any).loginHistory.create({
          data: {
            userId,
            ipAddress: ipAddress || "127.0.0.1",
            userAgent: userAgent || "Unknown",
            status: "SUCCESS",
            latitude: geoData?.latitude,
            longitude: geoData?.longitude,
            city: geoData?.city,
            country: geoData?.country,
            asn: geoData?.asn,
          },
        });
      }

      // 2. Upsert Device Record
      if ((prisma as any).userDevice) {
        const device = await (prisma as any).userDevice.upsert({
          where: {
            userId_visitorIdHash: {
              userId,
              visitorIdHash,
            },
          },
          create: {
            userId,
            visitorIdHash,
            deviceLabel: userAgent ? userAgent.substring(0, 60) : "Browser Client",
            status: trustDevice ? "TRUSTED" : "NEW",
            trustLevel: trustDevice ? "TRUSTED" : "UNTRUSTED",
            lastIpHash: ipHash,
            userAgentHash: uaHash,
            latitude: geoData?.latitude,
            longitude: geoData?.longitude,
            city: geoData?.city,
            country: geoData?.country,
            asn: geoData?.asn,
            failedAttempts: 0,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
            lastLoginAt: new Date(),
          },
          update: {
            lastSeenAt: new Date(),
            lastLoginAt: new Date(),
            lastIpHash: ipHash,
            userAgentHash: uaHash,
            latitude: geoData?.latitude,
            longitude: geoData?.longitude,
            city: geoData?.city,
            country: geoData?.country,
            asn: geoData?.asn,
            failedAttempts: 0,
            status: trustDevice ? "TRUSTED" : undefined,
            trustLevel: trustDevice ? "TRUSTED" : undefined,
          },
        });

        return device;
      }
    } catch (err: any) {
      logger.warn("RiskEngine recordDeviceSuccess failed", { userId, error: err.message });
      return null;
    }
  }

  /**
   * Increments failed attempt count on a device
   */
  public static async recordDeviceFailure(userId: string, visitorId: string): Promise<void> {
    if (!userId || !visitorId) return;
    const visitorIdHash = this.hashVisitorId(visitorId);

    try {
      if ((prisma as any).userDevice) {
        await (prisma as any).userDevice.updateMany({
          where: { userId, visitorIdHash },
          data: { failedAttempts: { increment: 1 } },
        });
      }
    } catch (err: any) {
      logger.debug("RiskEngine recordDeviceFailure skipped", { userId, error: err.message });
    }
  }
}
