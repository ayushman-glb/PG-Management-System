import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class AuthService {
  private getToken(): string | null {
    try {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("roombae_access_token")
      );
    } catch {
      return null;
    }
  }

  public setToken(token: string) {
    try {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token);
      localStorage.setItem("roombae_access_token", token);
    } catch (e) {}
  }

  public clearToken() {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("roombae_access_token");
    } catch (e) {}
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

    if (response.status === 401 && !isRetry && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      try {
        const refreshRes = await fetch(`${env.API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData?.data?.accessToken || refreshData?.accessToken;
          if (newToken) {
            this.setToken(newToken);
            return this.request<T>(endpoint, options, true);
          }
        }
        // If refresh fails, clear token
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

  async login(identifierOrCredentials: any, passwordArg?: string) {
    let identifier = typeof identifierOrCredentials === "string" ? identifierOrCredentials : (identifierOrCredentials.identifier || identifierOrCredentials.email || "");
    let password = passwordArg || (typeof identifierOrCredentials === "object" ? identifierOrCredentials.password : "");

    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
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
    return res.data;
  }

  async getCurrentUser() {
    const res = await this.request("/auth/me", { method: "GET" });
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

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.clearToken();
    }
  }
}

export const authService = new AuthService();
