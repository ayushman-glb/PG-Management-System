import { RiskLevel, RiskEvaluationResult, DeviceStatus } from "./device.types";

export interface RiskEvaluationContext {
  isNewDevice: boolean;
  deviceStatus?: DeviceStatus;
  failedAttempts?: number;
  ipChanged?: boolean;
  userAgentChanged?: boolean;
  recentFailedLoginsCount?: number;
}

export class DeviceRiskEngine {
  /**
   * Calculates overall risk score & level for a given authentication/device context.
   */
  public static evaluate(context: RiskEvaluationContext): RiskEvaluationResult {
    let score = 0;
    const reasons: string[] = [];

    if (context.deviceStatus === "BLOCKED") {
      return {
        score: 100,
        level: "CRITICAL",
        reasons: ["Device is explicitly blocked by security policy"],
        requiresStepUp: true,
      };
    }

    if (context.deviceStatus === "REVOKED") {
      score += 60;
      reasons.push("Device was previously revoked by account owner");
    }

    if (context.isNewDevice) {
      score += 25;
      reasons.push("Unrecognized new device/browser signature");
    }

    if (context.failedAttempts && context.failedAttempts > 0) {
      const penalty = Math.min(context.failedAttempts * 15, 45);
      score += penalty;
      reasons.push(`Multiple recent failed authentication attempts (${context.failedAttempts})`);
    }

    if (context.recentFailedLoginsCount && context.recentFailedLoginsCount > 3) {
      score += 30;
      reasons.push("High frequency of recent failed login attempts on account");
    }

    if (context.ipChanged) {
      score += 15;
      reasons.push("IP address location changed from last active session");
    }

    if (context.userAgentChanged) {
      score += 10;
      reasons.push("User-agent header anomaly detected");
    }

    let level: RiskLevel = "LOW";
    let requiresStepUp = false;

    if (score >= 75) {
      level = "CRITICAL";
      requiresStepUp = true;
    } else if (score >= 50) {
      level = "HIGH";
      requiresStepUp = true;
    } else if (score >= 25) {
      level = "MEDIUM";
      requiresStepUp = false;
    } else {
      level = "LOW";
      requiresStepUp = false;
    }

    return {
      score,
      level,
      reasons: reasons.length > 0 ? reasons : ["Normal device risk profile"],
      requiresStepUp,
    };
  }
}
