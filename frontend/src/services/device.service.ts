import { api, ApiResponse } from "./api";
import { deviceIdentityProvider } from "./deviceIdentity";

export interface UserDeviceItem {
  id: string;
  deviceLabel: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  screenResolution?: string;
  region?: string;
  city?: string;
  country?: string;
  ipAddress?: string;
  status: "NEW" | "TRUSTED" | "BLOCKED" | "REVOKED" | "REJECTED";
  trustLevel: "TRUSTED" | "UNTRUSTED";
  provider: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastLoginAt?: string;
  revokedAt?: string;
}

export interface DeviceLoginLogItem {
  id: string;
  userId: string;
  deviceId?: string | null;
  deviceLabel: string;
  screenResolution?: string | null;
  ipAddress: string;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  status: "PENDING_ALERT" | "ACCEPTED" | "REJECTED" | "AUTO_TRUSTED";
  actionTaken?: string | null;
  emailSent: boolean;
  emailSentAt?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actionAt?: string | null;
}

export interface SecurityEventItem {
  id: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  metadata?: string;
}

export interface IdentifyDeviceResponse {
  device: UserDeviceItem;
  isNew: boolean;
  requiresAlert: boolean;
  telemetry: {
    ip: string;
    region: string;
    screenResolution?: string;
    deviceLabel: string;
  };
  risk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reasons: string[];
    requiresStepUp: boolean;
  };
}

export const deviceService = {
  /**
   * Identifies current browser device with backend.
   */
  async identifyDevice(): Promise<IdentifyDeviceResponse | null> {
    try {
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      const response = await api.request<ApiResponse<IdentifyDeviceResponse>>(
        "/security/devices/identify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId: identity.visitorId,
            provider: identity.provider,
            providerVersion: identity.providerVersion,
            deviceLabel: identity.deviceLabel,
            screenResolution: identity.screenResolution,
          }),
        },
      );
      return response.data;
    } catch (error) {
      console.warn("[deviceService] Device identification failed:", error);
      return null;
    }
  },

  /**
   * Responds to a new device login alert with Accept or Reject decision.
   */
  async respondToNewDeviceAlert(payload: {
    visitorId: string;
    decision: "ACCEPT" | "REJECT";
    screenResolution?: string;
    deviceLabel?: string;
    deviceId?: string;
  }): Promise<{ status: "ACCEPTED" | "REJECTED"; loggedOut?: boolean; message: string }> {
    const response = await api.request<
      ApiResponse<{ status: "ACCEPTED" | "REJECTED"; loggedOut?: boolean; message: string }>
    >("/security/devices/alert-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Fetches user's registered devices.
   */
  async getUserDevices(): Promise<UserDeviceItem[]> {
    const response = await api.request<ApiResponse<{ devices: UserDeviceItem[] }>>(
      "/security/devices",
    );
    return response.data?.devices || [];
  },

  /**
   * Fetches device sign-in telemetry logs.
   */
  async getDeviceLoginLogs(): Promise<DeviceLoginLogItem[]> {
    const response = await api.request<ApiResponse<{ logs: DeviceLoginLogItem[] }>>(
      "/security/devices/logs",
    );
    return response.data?.logs || [];
  },

  /**
   * Trusts a device.
   */
  async trustDevice(deviceId: string): Promise<UserDeviceItem> {
    const response = await api.request<ApiResponse<{ device: UserDeviceItem }>>(
      `/security/devices/${deviceId}/trust`,
      { method: "PATCH" },
    );
    return response.data.device;
  },

  /**
   * Revokes a device.
   */
  async revokeDevice(deviceId: string): Promise<UserDeviceItem> {
    const response = await api.request<ApiResponse<{ device: UserDeviceItem }>>(
      `/security/devices/${deviceId}/revoke`,
      { method: "POST" },
    );
    return response.data.device;
  },

  /**
   * Blocks a device (Admin).
   */
  async blockDevice(deviceId: string): Promise<UserDeviceItem> {
    const response = await api.request<ApiResponse<{ device: UserDeviceItem }>>(
      `/security/devices/${deviceId}/block`,
      { method: "POST" },
    );
    return response.data.device;
  },

  /**
   * Fetches security audit events.
   */
  async getSecurityEvents(): Promise<SecurityEventItem[]> {
    const response = await api.request<ApiResponse<{ events: SecurityEventItem[] }>>(
      "/security/devices/events",
    );
    return response.data?.events || [];
  },
};
