import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class AuthService {
  private getToken(): string | null {
    try {
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  }

  public setToken(token: string) {
    try {
      localStorage.setItem("accessToken", token);
    } catch (e) {}
  }

  public clearToken() {
    try {
      localStorage.removeItem("accessToken");
    } catch (e) {}
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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

  async firebaseLogin(idToken: string) {
    const res = await this.request("/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
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
