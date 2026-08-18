import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class ResidentService {
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
      throw new Error(data.message || "Resident API request failed");
    }
    return data;
  }

  async onboardResident(kycData: any) {
    const res = await this.request("/residents/onboard", {
      method: "POST",
      body: JSON.stringify(kycData),
    });
    return res.data;
  }

  async getResidentDirectory(params?: { propertyId?: string; search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.propertyId) query.append("propertyId", params.propertyId);
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/residents/directory${queryString}`);
    return res.data;
  }

  async getPortalMe() {
    const res = await this.request("/residents/portal/me");
    return res.data;
  }

  async updateResidentStatus(residentId: string, status: string, reason?: string) {
    const res = await this.request("/resident-management/status", {
      method: "POST",
      body: JSON.stringify({ residentId, status, reason }),
    });
    return res.data;
  }

  async getResidents() {
    const res = await this.request("/residents");
    return res.data || res;
  }

  async getResidentById(id: string) {
    const res = await this.request(`/residents/${id}`);
    return res.data || res;
  }

  async getResidentStatusHistory(residentId: string) {
    const res = await this.request(`/resident-management/status/history/${residentId}`);
    return res.data;
  }
}

export const residentService = new ResidentService();
