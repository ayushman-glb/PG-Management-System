import { env } from "@config/env";
import type { ApiResponse } from "../types";
import { updateSocketAuth, disconnectSocket } from "./socket";
import { useUIStore } from "../store/useUIStore";

// ─── Cross-tab sync channel (Section 1 fix) ────────────────────────────────
// The access token MUST NOT be persisted to localStorage (XSS risk).
// We use BroadcastChannel ("roombae-auth") so other tabs react to auth state
// changes via signal-only messages without storing or sharing the raw token.
const AUTH_CHANNEL_NAME = "roombae-auth";

export class AuthService {
  private inMemoryToken: string | null = null;
  private channel: BroadcastChannel | null = null;
  private authStateListeners: Set<(isAuthenticated: boolean) => void> = new Set();

  constructor() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      this.channel.onmessage = async (ev) => {
        if (ev.data?.type === "LOGOUT") {
          // Another tab logged out — clear this tab's in-memory token silently
          this.inMemoryToken = null;
          disconnectSocket();
          this.notifyAuthState(false);
        } else if (
          ev.data?.type === "LOGIN" ||
          ev.data?.type === "TOKEN_REFRESHED" ||
          ev.data?.type === "TOKEN_SET"
        ) {
          // Another tab obtained a new token — trigger this tab's own silent refresh
          // relying on the shared httpOnly cookie to obtain a fresh token in its own memory.
          try {
            await this.refreshToken();
            this.notifyAuthState(true);
          } catch {
            // Silent catch — tab will refresh on next user interaction
          }
        }
      };
    }
  }

  public subscribeAuthState(listener: (isAuthenticated: boolean) => void): () => void {
    this.authStateListeners.add(listener);
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  private notifyAuthState(isAuthenticated: boolean) {
    for (const listener of this.authStateListeners) {
      try {
        listener(isAuthenticated);
      } catch {}
    }
  }

  public getToken(): string | null {
    // Access token is in-memory only — never read from localStorage or persistent storage.
    return this.inMemoryToken;
  }

  public setToken(
    token: string,
    broadcastType: "LOGIN" | "TOKEN_REFRESHED" | "TOKEN_SET" = "TOKEN_SET"
  ) {
    this.inMemoryToken = token;
    updateSocketAuth(token);
    // Notify other tabs that a new session is active (no token value is sent).
    try {
      this.channel?.postMessage({ type: broadcastType });
    } catch {
      /* ignore */
    }
    this.notifyAuthState(true);
  }

  public getStoredRefreshToken(): string | null {
    try {
      return (
        sessionStorage.getItem("roombae_refresh_token") ||
        localStorage.getItem("roombae_refresh_token")
      );
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
      // Clean up any legacy keys that may have been written by older builds.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("roombae_access_token");
      // Refresh token clearance is intentional on logout.
      localStorage.removeItem("roombae_refresh_token");
      sessionStorage.removeItem("roombae_refresh_token");
      sessionStorage.removeItem("user");
      if (typeof document !== "undefined") {
        document.cookie = "hasSession=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
    } catch {}
    disconnectSocket();
    // Broadcast logout to other open tabs.
    try {
      this.channel?.postMessage({ type: "LOGOUT" });
    } catch {
      /* ignore */
    }
    this.notifyAuthState(false);
  }

  public hasStoredSession(): boolean {
    // Access token is in-memory only.
    // Check if in-memory token, stored refresh token, cached user session, or hasSession marker cookie exists.
    try {
      if (this.inMemoryToken) return true;
      if (this.getStoredRefreshToken()) return true;
      if (typeof localStorage !== "undefined" && localStorage.getItem("user")) return true;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("user")) return true;
      if (typeof document !== "undefined" && document.cookie.includes("hasSession=1")) return true;
    } catch {}
    // If no session marker exists, visitor is anonymous: skip silent refresh to prevent log noise
    return false;
  }

  private inMemoryCsrfToken: string | null = null;

  public getCsrfToken(): string | null {
    if (this.inMemoryCsrfToken) return this.inMemoryCsrfToken;
    if (typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('roombae_csrf_token');
        if (stored) {
          this.inMemoryCsrfToken = stored;
          return stored;
        }
      } catch {}
    }
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return null;
  }

  /**
   * Fetches a fresh CSRF token from the backend bootstrap endpoint.
   * Extracts token from response body (for cross-origin environments like GitHub Pages -> Render)
   * and sets cookie header.
   */
  async bootstrapCsrf(): Promise<string | null> {
    try {
      const res = await fetch(`${env.API_URL}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const token = json?.data?.csrfToken || json?.csrfToken || res.headers.get('x-csrf-token');
        if (token) {
          this.inMemoryCsrfToken = token;
          try {
            sessionStorage.setItem('roombae_csrf_token', token);
          } catch {}
          return token;
        }
      }
    } catch {
      // Non-fatal fallback
    }
    return this.getCsrfToken();
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

    const method = options.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let csrf = this.getCsrfToken();
      if (!csrf && !endpoint.includes('/auth/csrf-token')) {
        csrf = await this.bootstrapCsrf();
      }
      if (csrf) {
        headers['x-csrf-token'] = csrf;
      }
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
        const refreshed = await this.refreshToken();
        if (refreshed?.accessToken || this.getToken()) {
          return this.request<T>(endpoint, options, true);
        }
      } catch (refreshErr) {
        console.warn("⚠️ Token auto-refresh failed:", refreshErr);
      }
    }

    // Automatic 403 CSRF Recovery
    if (response.status === 403 && !isRetry && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        const errorClone = response.clone();
        const errJson = await errorClone.json().catch(() => ({}));
        const isCsrfError =
          errJson?.error?.code === 'CSRF_INVALID' ||
          errJson?.error?.code === 'CSRF_MISSING' ||
          errJson?.error?.code === 'CSRF_SIGNATURE_INVALID' ||
          errJson?.message?.toLowerCase().includes('csrf');

        if (isCsrfError) {
          await this.bootstrapCsrf();
          return this.request<T>(endpoint, options, true);
        }
      } catch {}
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Authentication request failed");
    }

    // DEV-ONLY: remove or verify gated before production deploy
    const isDevMode = typeof import.meta !== "undefined" && import.meta.env?.MODE !== "production" && Boolean(import.meta.env?.DEV);
    if (isDevMode && (data?.devOtp || data?.data?.devOtp)) {
      const devOtp = data?.devOtp || data?.data?.devOtp;
      console.log('%c[DEV OTP] %s', 'color: orange; font-weight: bold;', devOtp);
    }

    return data;
  }

  async login(identifierOrCredentials: any, passwordArg?: string, rememberMeArg?: boolean) {
    let identifier = typeof identifierOrCredentials === "string" 
      ? identifierOrCredentials 
      : (identifierOrCredentials.identifier || identifierOrCredentials.email || identifierOrCredentials.phone || identifierOrCredentials.residentCode || "");
    let password = passwordArg || (typeof identifierOrCredentials === "object" ? identifierOrCredentials.password : "");
    let rememberMe = rememberMeArg !== undefined ? rememberMeArg : (typeof identifierOrCredentials === "object" ? Boolean(identifierOrCredentials.rememberMe) : false);

    let visitorId: string | undefined;
    let deviceLabel: string | undefined;
    let screenResolution: string | undefined;

    try {
      const { deviceIdentityProvider } = await import("./deviceIdentity");
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      visitorId = identity.visitorId;
      deviceLabel = identity.deviceLabel;
      screenResolution = identity.screenResolution;
    } catch {
      // Ignore if fingerprinting unavailable
    }

    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ 
        identifier: identifier.trim(), 
        email: identifier.trim(), 
        password, 
        rememberMe, 
        visitorId, 
        deviceLabel,
        screenResolution,
      }),
    });

    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken, "LOGIN");
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, rememberMe);
    }

    if (res.data?.deviceSecurity?.isNewDevice || res.data?.deviceSecurity?.requiresAlert) {
      const ds = res.data.deviceSecurity;
      useUIStore.getState().openNewDeviceModal({
        deviceLabel: ds.deviceLabel || deviceLabel || "New Browser",
        deviceId: ds.deviceId,
        visitorId: ds.visitorId || visitorId,
        screenResolution: ds.screenResolution || screenResolution,
        ipAddress: ds.ipAddress,
        region: ds.region,
        status: ds.status,
        riskLevel: ds.riskLevel,
      });
    }

    return res.data || res;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    currentAddress?: string;
  }) {
    let visitorId: string | undefined;
    let deviceLabel: string | undefined;
    try {
      const { deviceIdentityProvider } = await import("./deviceIdentity");
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      visitorId = identity.visitorId;
      deviceLabel = identity.deviceLabel;
    } catch {}

    const nameParts = (data.name || "").trim().split(" ");
    const firstName = data.firstName || nameParts[0] || "Resident";
    const lastName = data.lastName || nameParts.slice(1).join(" ") || "User";
    const username = data.username || data.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + Math.floor(100 + Math.random() * 900);

    const payload = {
      ...data,
      email: data.email.trim(),
      phone: data.phone || "+919876543210",
      username,
      password: data.password,
      firstName,
      lastName,
      currentAddress: data.currentAddress || "Bangalore, India",
      acceptedTermsVersion: "1.0",
      acceptedPrivacyVersion: "1.0",
      visitorId,
      deviceLabel,
    };

    const res = await this.request("/auth/register/resident", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken, "LOGIN");
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, false);
    }
    return res.data || res;
  }

  async registerOwner(data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email: string;
    password: string;
    phone?: string;
    currentAddress?: string;
    numPGsToRegister?: number;
  }) {
    let visitorId: string | undefined;
    let deviceLabel: string | undefined;
    try {
      const { deviceIdentityProvider } = await import("./deviceIdentity");
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      visitorId = identity.visitorId;
      deviceLabel = identity.deviceLabel;
    } catch {}

    const nameParts = (data.name || "").trim().split(" ");
    const firstName = data.firstName || nameParts[0] || "Owner";
    const lastName = data.lastName || nameParts.slice(1).join(" ") || "User";
    const username = data.username || data.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + Math.floor(100 + Math.random() * 900);

    const payload = {
      email: data.email.trim(),
      phone: data.phone || "+919876543210",
      username,
      password: data.password,
      firstName,
      lastName,
      currentAddress: data.currentAddress || "Bangalore, India",
      numPGsToRegister: data.numPGsToRegister || 1,
      acceptedTermsVersion: "1.0",
      acceptedPrivacyVersion: "1.0",
      visitorId,
      deviceLabel,
    };

    const res = await this.request("/auth/register/owner", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken, "LOGIN");
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, false);
    }
    return res.data || res;
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
      this.setToken(res.data.accessToken, "LOGIN");
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

  async refreshToken(): Promise<any> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const storedRefreshToken = this.getStoredRefreshToken();
        // /refresh-token requires CSRF double-submit (same as login/logout).
        // We read the existing csrf-token cookie; if missing we call the
        // bootstrap endpoint first so a fresh session can still refresh.
        let csrf = this.getCsrfToken();
        if (!csrf) {
          try {
            await this.bootstrapCsrf();
            csrf = this.getCsrfToken();
          } catch {
            // proceed without — backend will reject with 403 if cookie is absent
          }
        }
        const refreshHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (csrf) {
          refreshHeaders["x-csrf-token"] = csrf;
        }
        const response = await fetch(`${env.API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: refreshHeaders,
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: "include",
        });

        if (!response.ok) {
          this.clearToken();
          throw new Error("Session refresh failed");
        }

        const data = await response.json();
        const newToken = data?.data?.accessToken || data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;

        if (newToken) {
          this.setToken(newToken, "TOKEN_REFRESHED");
        }
        if (newRefreshToken) {
          const isPersistent = Boolean(localStorage.getItem("roombae_refresh_token"));
          this.setRefreshToken(newRefreshToken, isPersistent);
        }

        return data?.data || data;
      } catch (err) {
        this.clearToken();
        throw err;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async sendPhoneOtp(phone: string, purpose: string = "PHONE_VERIFICATION") {
    const res = await this.request("/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone, purpose }),
    });
    return res.data || res;
  }

  async verifyPhoneOtp(phone: string, otp: string, purpose: string = "PHONE_VERIFICATION") {
    const res = await this.request("/auth/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp, purpose }),
    });
    return res.data || res;
  }

  async resendPhoneOtp(phone: string) {
    const res = await this.request("/auth/phone/resend-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    return res.data || res;
  }

  async getPhoneAuthStatus(phone?: string) {
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const res = await this.request(`/auth/phone/status${query}`, {
      method: "GET",
    });
    return res.data || res;
  }

  async removePhoneAuth() {
    const res = await this.request("/auth/phone/remove", {
      method: "DELETE",
    });
    return res.data || res;
  }

  async sendEmailOtp(email: string, name?: string) {
    const res = await this.request("/auth/email/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
    return res.data || res;
  }

  async verifyEmailOtp(email: string, otp: string) {
    const res = await this.request("/auth/email/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    return res.data || res;
  }

  async resendEmailOtp(email: string, name?: string) {
    const res = await this.request("/auth/email/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
    return res.data || res;
  }

  async sendPasswordReset(email: string) {
    const res = await this.request("/auth/password/send-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data || res;
  }

  async verifyPasswordReset(email: string, otp: string, newPassword?: string) {
    const res = await this.request("/auth/password/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
    return res.data || res;
  }

  async sendEmailVerification(email: string, name?: string) {
    return this.sendEmailOtp(email, name);
  }

  async verifyEmail(email: string, code: string) {
    return this.verifyEmailOtp(email, code);
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

  /**
   * Initiates Google OAuth 2.0 redirect flow.
   */
  initiateGoogleOAuth(role: "RESIDENT" | "PG_OWNER" = "RESIDENT", redirectUrl?: string) {
    const targetUrl = `${env.API_URL}/auth/google?role=${encodeURIComponent(role)}${redirectUrl ? `&redirectUrl=${encodeURIComponent(redirectUrl)}` : ""}`;
    window.location.href = targetUrl;
  }

  /**
   * Direct Google token verification (e.g. from Google Identity Services button).
   */
  async verifyGoogleToken(idToken: string, role: "RESIDENT" | "PG_OWNER" = "RESIDENT") {
    let visitorId: string | undefined;
    let deviceLabel: string | undefined;
    let screenResolution: string | undefined;

    try {
      const { deviceIdentityProvider } = await import("./deviceIdentity");
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      visitorId = identity.visitorId;
      deviceLabel = identity.deviceLabel;
      screenResolution = identity.screenResolution;
    } catch {}

    const res = await this.request("/auth/google/verify", {
      method: "POST",
      body: JSON.stringify({
        idToken,
        role,
        visitorId,
        deviceLabel,
        screenResolution,
      }),
    });

    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken, "LOGIN");
    }
    if (res.data?.refreshToken) {
      this.setRefreshToken(res.data.refreshToken, false);
    }

    return res.data || res;
  }

  /**
   * Links Google identity to the currently authenticated account.
   */
  async linkGoogleAccount(idToken: string, password?: string, twoFactorCode?: string) {
    const res = await this.request("/auth/google/link", {
      method: "POST",
      body: JSON.stringify({ idToken, password, twoFactorCode }),
    });
    return res.data || res;
  }

  /**
   * Unlinks Google identity from the currently authenticated account.
   */
  async unlinkGoogleAccount(password?: string) {
    const res = await this.request("/auth/google/unlink", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return res.data || res;
  }

  /**
   * Creates a RoomBae password for Google-first accounts.
   */
  async createPassword(password: string) {
    const res = await this.request("/auth/create-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return res.data || res;
  }

  /**
   * Completes preliminary profile onboarding (phone, address, role fields, legal acceptance).
   */
  async completeProfile(profileData: any) {
    const res = await this.request("/auth/complete-profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
    return res.data || res;
  }

  /**
   * Retrieves linked authentication methods for user settings.
   */
  async getAuthMethods() {
    const res = await this.request("/auth/auth-methods", {
      method: "GET",
    });
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
