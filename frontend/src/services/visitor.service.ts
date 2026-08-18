import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class VisitorService {
  private getToken(): string | null {
    try {
      return (
        localStorage.getItem("roombae_access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
      );
    } catch {
      return null;
    }
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
      throw new Error(data.message || "Visitor API request failed");
    }
    return data;
  }

  async createVisitorPass(data: any) {
    const res = await this.request("/residents/portal/visitor-pass", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async createGatePass(data: any) {
    const res = await this.request("/residents/portal/gate-pass", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }
}

export const visitorService = new VisitorService();
