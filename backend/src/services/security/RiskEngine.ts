import { prisma } from '../../config/prisma';

export interface RiskEvaluationContext {
  isVpn?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export interface RiskEvaluationResult {
  decision: 'ALLOW' | 'STEP_UP' | 'BLOCK';
  riskScore: number;
  reasons: string[];
  signals: string[];
}

export class RiskEngine {
  public static calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public static async evaluateLoginRisk(
    userId: string,
    visitorId?: string,
    ipAddress: string = '',
    userAgent: string = '',
    context?: RiskEvaluationContext
  ): Promise<RiskEvaluationResult> {
    let riskScore = 0;
    const reasons: string[] = [];
    const signals: string[] = [];

    // 1. Device check
    if ((prisma as any).userDevice?.findFirst) {
      const device = await (prisma as any).userDevice.findFirst({
        where: { userId },
      });

      if (!device) {
        riskScore += 30;
        reasons.push('NEW_DEVICE');
        signals.push('NEW_DEVICE');
      } else if (device.status === 'BLOCKED' || device.trustLevel === 'UNTRUSTED') {
        riskScore += 75;
        reasons.push('BLOCKED_DEVICE');
        signals.push('BLOCKED_DEVICE');
      } else if (device.status === 'TRUSTED' || device.trustLevel === 'TRUSTED') {
        riskScore = Math.max(0, riskScore - 10);
      }
    }

    // 2. VPN / Anomaly check
    if (context?.isVpn) {
      riskScore += 20;
      reasons.push('VPN_PROXY_DETECTED');
      signals.push('VPN_PROXY_DETECTED');
    }

    // 3. Impossible travel check
    if (context?.latitude && context?.longitude && (prisma as any).loginHistory?.findFirst) {
      const lastLogin = await (prisma as any).loginHistory.findFirst({
        where: { userId },
      });

      if (lastLogin && lastLogin.latitude && lastLogin.longitude) {
        const distanceKm = this.calculateHaversineDistanceKm(
          lastLogin.latitude,
          lastLogin.longitude,
          context.latitude,
          context.longitude
        );
        const timeDiffHours = (Date.now() - new Date(lastLogin.createdAt).getTime()) / (1000 * 60 * 60);

        if (timeDiffHours > 0) {
          const velocityKmH = distanceKm / timeDiffHours;
          if (velocityKmH > 800) {
            riskScore += 35;
            reasons.push('IMPOSSIBLE_TRAVEL');
            signals.push('IMPOSSIBLE_TRAVEL');
          }
        }
      }
    }

    // Determine decision
    let decision: 'ALLOW' | 'STEP_UP' | 'BLOCK' = 'ALLOW';
    if (riskScore >= 70) {
      decision = 'BLOCK';
    } else if (riskScore >= 40) {
      decision = 'STEP_UP';
    }

    return { decision, riskScore, reasons, signals };
  }
}
