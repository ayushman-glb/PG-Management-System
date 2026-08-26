export interface DeviceRiskInput {
  isNewDevice?: boolean;
  deviceStatus?: string;
  failedAttempts?: number;
  ipChanged?: boolean;
}

export interface DeviceRiskResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresStepUp: boolean;
}

export class DeviceRiskEngine {
  public static evaluate(input: DeviceRiskInput): DeviceRiskResult {
    if (input.deviceStatus === 'BLOCKED') {
      return { score: 100, level: 'CRITICAL', requiresStepUp: true };
    }
    if (input.deviceStatus === 'REVOKED') {
      return { score: 60, level: 'HIGH', requiresStepUp: true };
    }

    let score = 0;
    if (input.isNewDevice) {
      score += 25;
    }

    if (input.failedAttempts) {
      score += input.failedAttempts * 15;
    }

    if (input.ipChanged) {
      score += 15;
    }

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 80) {
      level = 'CRITICAL';
    } else if (score >= 60) {
      level = 'HIGH';
    } else if (score >= 25) {
      level = 'MEDIUM';
    }

    const requiresStepUp = score >= 60;

    return { score, level, requiresStepUp };
  }
}
