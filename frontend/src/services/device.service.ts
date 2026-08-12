import { api, ApiResponse } from "./api";
import { deviceIdentityProvider } from "./deviceIdentity";

export interface UserDeviceItem {
  id: string;
  deviceLabel: string;
  status: "NEW" | "TRUSTED" | "BLOCKED" | "REVOKED";
  trustLevel: "TRUSTED" | "UNTRUSTED";
  provider: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastLoginAt?: string;
  revokedAt?: string;
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
   * Fetches user's registered devices.
   */
  async getUserDevices(): Promise<UserDeviceItem[]> {
    const response = await api.request<ApiResponse<{ devices: UserDeviceItem[] }>>(
      "/security/devices",
    );
    return response.data?.devices || [];
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
