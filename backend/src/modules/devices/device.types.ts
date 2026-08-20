export type DeviceStatus = "NEW" | "TRUSTED" | "BLOCKED" | "REVOKED" | "REJECTED";
export type TrustLevel = "TRUSTED" | "UNTRUSTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DeviceIdentifyRequest {
  visitorId: string;
  provider?: string;
  providerVersion?: string;
  deviceLabel?: string;
  userAgent?: string;
  screenResolution?: string;
}

export interface DeviceAlertDecisionRequest {
  visitorId: string;
  decision: "ACCEPT" | "REJECT";
  screenResolution?: string;
  deviceLabel?: string;
  deviceId?: string;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  visitorIdHash: string;
  provider: string;
  providerVersion?: string | null;
  deviceLabel: string;
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
  screenResolution?: string | null;
  status: DeviceStatus;
  trustLevel: TrustLevel;
  lastIpHash?: string | null;
  ipAddress?: string | null;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  userAgentHash?: string | null;
  failedAttempts: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastLoginAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceLoginLogItem {
  id: string;
  userId: string;
  deviceId?: string | null;
  visitorIdHash?: string | null;
  deviceLabel: string;
  screenResolution?: string | null;
  ipAddress: string;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: "PENDING_ALERT" | "ACCEPTED" | "REJECTED" | "AUTO_TRUSTED";
  actionTaken?: string | null;
  emailSent: boolean;
  emailSentAt?: Date | null;
  userAgent?: string | null;
  createdAt: Date;
  actionAt?: Date | null;
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
