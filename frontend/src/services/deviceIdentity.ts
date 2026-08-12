import FingerprintJS, { Agent } from "@fingerprintjs/fingerprintjs";

export interface DeviceIdentityResult {
  visitorId: string;
  confidenceScore: number;
  provider: string;
  providerVersion: string;
  deviceLabel: string;
  isAvailable: boolean;
}

export interface DeviceIdentityProvider {
  initialize(): Promise<void>;
  getDeviceIdentity(): Promise<DeviceIdentityResult>;
  clearCache(): void;
}

class FingerprintJSProvider implements DeviceIdentityProvider {
  private static instance: FingerprintJSProvider;
  private fpPromise: Promise<Agent> | null = null;
  private cachedIdentity: DeviceIdentityResult | null = null;

  private constructor() {}

  public static getInstance(): FingerprintJSProvider {
    if (!FingerprintJSProvider.instance) {
      FingerprintJSProvider.instance = new FingerprintJSProvider();
    }
    return FingerprintJSProvider.instance;
  }

  public async initialize(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.fpPromise) {
      try {
        this.fpPromise = FingerprintJS.load({ monitoring: false });
      } catch (err) {
        console.warn("[DeviceIdentity] Failed to load FingerprintJS agent:", err);
      }
    }
  }

  public async getDeviceIdentity(): Promise<DeviceIdentityResult> {
    if (this.cachedIdentity) {
      return this.cachedIdentity;
    }

    try {
      await this.initialize();
      if (!this.fpPromise) {
        throw new Error("FingerprintJS agent not initialized");
      }

      const fp = await this.fpPromise;
      const result = await fp.get();

      const identity: DeviceIdentityResult = {
        visitorId: result.visitorId,
        confidenceScore: result.confidence?.score || 0.9,
        provider: "fingerprintjs",
        providerVersion: "4.x",
        deviceLabel: this.generateClientDeviceLabel(),
        isAvailable: true,
      };

      this.cachedIdentity = identity;
      return identity;
    } catch (error) {
      console.warn("[DeviceIdentity] Fingerprint generation failed or blocked:", error);
      // Fallback graceful object - app authentication will continue without crashing
      const fallback: DeviceIdentityResult = {
        visitorId: this.getOrCreateFallbackId(),
        confidenceScore: 0,
        provider: "fingerprintjs-fallback",
        providerVersion: "1.0",
        deviceLabel: this.generateClientDeviceLabel(),
        isAvailable: false,
      };
      this.cachedIdentity = fallback;
      return fallback;
    }
  }

  public clearCache(): void {
    this.cachedIdentity = null;
  }

  private generateClientDeviceLabel(): string {
    if (typeof navigator === "undefined") return "Unknown Browser";

    const ua = navigator.userAgent;
    let browser = "Browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    let os = "Device";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  }

  private getOrCreateFallbackId(): string {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return "fallback-server-id";
    }
    let id = localStorage.getItem("roombae_fallback_device_id");
    if (!id) {
      id = `fb_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem("roombae_fallback_device_id", id);
    }
    return id;
  }
}

export const deviceIdentityProvider: DeviceIdentityProvider =
  FingerprintJSProvider.getInstance();
