import { env } from "@config/env";
import type { ApiResponse } from "../types";
import { updateSocketAuth, disconnectSocket } from "./socket";

export class AuthService {
  private inMemoryToken: string | null = null;

  public getToken(): string | null {
    return this.inMemoryToken;
  }

  public setToken(token: string) {
    this.inMemoryToken = token;
    // Clean up any legacy localStorage entries
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("roombae_access_token");
    } catch {}
    updateSocketAuth(token);
  }

  public getStoredRefreshToken(): string | null {
    try {
      return sessionStorage.getItem("roombae_refresh_token") || localStorage.getItem("roombae_refresh_token");
    } catch {
      return null;
    }
  }

  public setRefreshToken(refreshToken: string, rememberMe: boolean = false) {
    try {
      if (rememberMe) {
        localStorage.setItem("roombae_refresh_token", refreshToken);
        sessionStorage.removeItem("roombae_refresh_token");
      } else {
        sessionStorage.setItem("roombae_refresh_token", refreshToken);
        localStorage.removeItem("roombae_refresh_token");
      }
    } catch {}
  }

  public clearToken() {
    this.inMemoryToken = null;
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("roombae_access_token");
      localStorage.removeItem("roombae_refresh_token");
      sessionStorage.removeItem("roombae_refresh_token");
    } catch {}
    disconnectSocket();
  }

  public hasStoredSession(): boolean {
    return Boolean(
      this.inMemoryToken ||
      this.getStoredRefreshToken() ||
      (typeof document !== "undefined" && document.cookie.includes("refreshToken"))
    );
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${env.API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/refresh") &&
      this.hasStoredSession()
    ) {
      try {
        const storedRefreshToken = this.getStoredRefreshToken();
        const refreshRes = await fetch(`${env.API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: "include",
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData?.data?.accessToken || refreshData?.accessToken;
          const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken;
          if (newToken) {
            this.setToken(newToken);
            if (newRefreshToken) {
              const isPersistent = Boolean(localStorage.getItem("roombae_refresh_token"));
              this.setRefreshToken(newRefreshToken, isPersistent);
            }
            return this.request<T>(endpoint, options, true);
          }
        }
        this.clearToken();
      } catch (refreshErr) {
        console.warn("⚠️ Token auto-refresh failed:", refreshErr);
        this.clearToken();
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Authentication request failed");
    }
    return data;
  }

  async login(identifierOrCredentials: any, passwordArg?: string, rememberMeArg?: boolean) {
    let identifier = typeof identifierOrCredentials === "string" ? identifierOrCredentials : (identifierOrCredentials.identifier || identifierOrCredentials.email || "");
    let password = passwordArg || (typeof identifierOrCredentials === "object" ? identifierOrCredentials.password : "");
    let rememberMe = rememberMeArg !== undefined ? rememberMeArg : (typeof identifierOrCredentials === "object" ? Boolean(identifierOrCredentials.rememberMe) : false);

    let visitorId: string | undefined;
    let deviceLabel: string | undefined;

    try {
      const { deviceIdentityProvider } = await import("./deviceIdentity");
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      visitorId = identity.visitorId;
      deviceLabel = identity.deviceLabel;
    } catch {
      // Ignore if fingerprinting unavailable
    }

    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, rememberMe, visitorId, deviceLabel }),
    });

    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, rememberMe);
    }

    if (res.data?.deviceSecurity?.isNewDevice && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("roombae-new-device-detected", {
          detail: {
            deviceLabel: deviceLabel || "New Browser",
            status: res.data.deviceSecurity.status,
            riskLevel: res.data.deviceSecurity.riskLevel,
          },
        }),
      );
    }

    return res.data || res;
  }

  async register(data: { name: string; email: string; password: string; role?: string; phone?: string }) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, false);
    }
    return res.data;
  }

  async sendOtp(email: string) {
    const res = await this.request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data;
  }

  async verifyOtp(email: string, otp: string) {
    const res = await this.request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, false);
    }
    return res.data;
  }

  async getCurrentUser() {
    const res = await this.request("/auth/me", { method: "GET" });
    return res.data || res;
  }

  private refreshPromise: Promise<any> | null = null;

  async refreshToken() {
    if (this.refreshPromise) {
      const res = await this.refreshPromise;
      return res.data || res;
    }

    this.refreshPromise = (async () => {
      try {
        const storedRefreshToken = this.getStoredRefreshToken();
        const res = await this.request("/auth/refresh-token", {
          method: "POST",
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
        if (res.data?.accessToken) {
          this.setToken(res.data.accessToken);
        }
        if (res.data?.refreshToken) {
          const isPersistent = Boolean(localStorage.getItem("roombae_refresh_token"));
          this.setRefreshToken(res.data.refreshToken, isPersistent);
        }
        return res.data || res;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async sendPhoneOtp(phone: string) {
    const res = await this.request("/auth/send-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    return res.data || res;
  }

  async verifyPhoneOtp(phone: string, otp: string) {
    const res = await this.request("/auth/verify-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
    return res.data || res;
  }

  async sendEmailVerification(email: string) {
    const res = await this.request("/auth/send-email-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data || res;
  }

  async verifyEmail(email: string, code: string) {
    const res = await this.request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    return res.data || res;
  }

  async verifyTwoFactor(preAuthTokenOrUserId: string, token: string, rememberMe: boolean = false) {
    const isPreAuth = preAuthTokenOrUserId.length > 50;
    const body = isPreAuth
      ? { preAuthToken: preAuthTokenOrUserId, token, rememberMe }
      : { userId: preAuthTokenOrUserId, token, rememberMe };

    const res = await this.request("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, rememberMe);
    }
    return res.data || res;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.clearToken();
    }
  }
}

export const authService = new AuthService();
