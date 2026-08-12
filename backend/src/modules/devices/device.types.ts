export type DeviceStatus = "NEW" | "TRUSTED" | "BLOCKED" | "REVOKED";
export type TrustLevel = "TRUSTED" | "UNTRUSTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DeviceIdentifyRequest {
  visitorId: string;
  provider?: string;
  providerVersion?: string;
  deviceLabel?: string;
  userAgent?: string;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  visitorIdHash: string;
  provider: string;
  providerVersion?: string | null;
  deviceLabel: string;
  status: DeviceStatus;
  trustLevel: TrustLevel;
  lastIpHash?: string | null;
  userAgentHash?: string | null;
  failedAttempts: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastLoginAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
  requiresStepUp: boolean;
}

export interface SecurityAuditEventInput {
  userId?: string;
  deviceId?: string;
  eventType: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  riskScore?: number;
  riskLevel?: RiskLevel;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}
