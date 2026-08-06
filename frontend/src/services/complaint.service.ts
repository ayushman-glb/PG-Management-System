import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class ComplaintService {
  private getToken(): string | null {
    try {
      return localStorage.getItem("accessToken");
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
      throw new Error(data.message || "Complaint API request failed");
    }
    return data;
  }

  async listComplaints(params?: { propertyId?: string; priority?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.propertyId) query.append("propertyId", params.propertyId);
    if (params?.priority) query.append("priority", params.priority);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/complaints${queryString}`);
    return res.data;
  }

  async createComplaint(data: { category: string; title: string; description: string; priority?: string }) {
    const res = await this.request("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async updateComplaintStatus(id: string, status: string) {
    const res = await this.request(`/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return res.data;
  }
}

export const complaintService = new ComplaintService();
