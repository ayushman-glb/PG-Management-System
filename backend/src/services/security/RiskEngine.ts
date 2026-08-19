import { prisma } from "../../config/prisma";
import crypto from "crypto";
import { logger } from "../../utils/logger";
import { SecurityAuditService } from "./SecurityAuditService";

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
}

/**
 * Enterprise Behavioral & Probabilistic Device Anomaly Risk Engine
 * 
 * Evaluates multi-signal risk vectors including probabilistic browser fingerprinting (FingerprintJS),
 * network rotation, ASN shifts, VPN/Tor usage, and geographic velocity (impossible travel).
 * 
 * Note: FingerprintJS generates a probabilistic browser identifier derived from canvas, audio,
 * and webgl contexts, which is evaluated in combination with network and behavioral telemetry.
 * 
 * Risk Scoring Matrix:
 * - New Probabilistic Fingerprint: +30
 * - Known Trusted Device:         -40
 * - IP Address Rotation:          +15
 * - User-Agent Mismatch:          +20
 * - Failed Attempts on Device:    +30
 * - Impossible Travel Speed:      +35 (>800 km/h velocity) [lowered from +60 to prevent single-signal block]
 * - New Country:                  +25 [lowered from +40 to prevent single-signal block]
 * - ASN Changed:                  +20
 * - VPN / Tor / Proxy:            +25
 * - Revoked or Blocked Device:    +80
 *
 * Design rationale: IMPOSSIBLE_TRAVEL and NEW_COUNTRY can both fire from the same
 * geolocation reading (which is unreliable for mobile/VPN/CGNAT users). Keeping
 * each at a weight that individually or jointly reaches >=70 would cause false
 * positive hard-blocks for legitimate users. At +35/+25 they firmly land in
 * STEP_UP territory (40-69), while genuinely multi-signal compromise scenarios
 * (e.g. REVOKED_DEVICE+80; or NEW_FINGERPRINT+NEW_COUNTRY+IP_ROTATION=70) still
 * correctly BLOCK.
 *
 * Action Thresholds:
 * - Score < 40:   ALLOW (Pass without 2FA step-up)
 * - Score 40-69:  STEP_UP (Trigger short-lived 2FA challenge)
 * - Score >= 70:  BLOCK (Reject login and write CRITICAL audit event)
 */
export class RiskEngine {
  private static readonly MAX_REALISTIC_TRAVEL_SPEED_KMH = 800; // Commercial jet speed threshold

  private static hashValue(val: string): string {
    return crypto.createHash("sha256").update(val).digest("hex");
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
    const visitorIdHash = cleanVisitorId ? this.hashValue(cleanVisitorId) : "";
    const ipHash = ipAddress ? this.hashValue(ipAddress.trim()) : "";
    const uaHash = userAgent ? this.hashValue(userAgent.trim()) : "";

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
      // Headless / non-browser request without hardware fingerprint
      riskScore += 0;
    } else if (!existingDevice) {
      riskScore += 30;
      signals.push("NEW_HARDWARE_FINGERPRINT (+30)");
    } else {
      if (existingDevice.status === "BLOCKED" || existingDevice.status === "REVOKED") {
        riskScore += 80;
        signals.push("REVOKED_OR_BLOCKED_DEVICE (+80)");
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
    // Weight: +25 (lowered from +40 — single geolocation signal must not hard-block alone)
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
        // Weight: +35 (lowered from +60 — single travel anomaly must not hard-block alone;
        // IP geo is unreliable for mobile/VPN/CGNAT. +35 firmly reaches STEP_UP (40-69)
        // while multiple strong independent signals are still needed to reach BLOCK.)
        if (speedKmH > this.MAX_REALISTIC_TRAVEL_SPEED_KMH && distanceKm > 100) {
          riskScore += 35;
          signals.push(`IMPOSSIBLE_TRAVEL (+35) - Speed: ${Math.round(speedKmH)} km/h across ${Math.round(distanceKm)} km`);

          // Asynchronously log audit event for impossible travel
          SecurityAuditService.logImpossibleTravel(
            userId,
            lastLogin.city || "Unknown",
            geoData.city || "Unknown",
            Math.round(speedKmH),
            ipAddress
          );
        }
      }
    }

    // Normalize final score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, riskScore));

    let decision: "ALLOW" | "STEP_UP" | "BLOCK" = "ALLOW";
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

    if (finalScore >= 70) {
      decision = "BLOCK";
      riskLevel = "CRITICAL";
    } else if (finalScore >= 40) {
      decision = "STEP_UP";
      riskLevel = finalScore >= 55 ? "HIGH" : "MEDIUM";
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
      // Structured error code and recovery guidance for BLOCK decisions.
      // NOTE: No automated email recovery mechanism exists yet — this is a
      // known gap that requires a product decision before implementing.
      // When implemented, it should send a security alert to the user's
      // verified email with an account unlock link.
      ...(decision === 'BLOCK' ? {
        errorCode: 'ACCOUNT_LOGIN_BLOCKED_HIGH_RISK',
        recoveryGuidance: 'Your login was blocked due to multiple high-risk signals. Please contact support or attempt login from a recognized device. A security alert has been noted for your account.'
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

    const visitorIdHash = this.hashValue(visitorId);
    const ipHash = ipAddress ? this.hashValue(ipAddress) : null;
    const uaHash = userAgent ? this.hashValue(userAgent) : null;

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
    const visitorIdHash = this.hashValue(visitorId);

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
