import { env } from "@config/env";
import type { ApiResponse } from "../types";
import { authService } from "./auth.service";

export class ComplaintService {
  private getToken(): string | null {
    return authService.getToken();
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

  async listComplaints(params?: { pgId?: string; propertyId?: string; priority?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    const pgId = params?.pgId || params?.propertyId;
    if (pgId) query.append("pgId", pgId);
    if (params?.priority && params.priority !== "all") query.append("priority", params.priority);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/complaints${queryString}`);
    return res.data;
  }

  async getComplaintById(id: string) {
    const res = await this.request(`/complaints/${id}`);
    return res.data;
  }

  async createComplaint(data: { pgId?: string; propertyId?: string; category: string; title: string; description: string; priority?: string; roomId?: string; bedId?: string; images?: string[] }) {
    const payload = {
      ...data,
      pgId: data.pgId || data.propertyId,
    };
    const res = await this.request("/complaints", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async updateComplaintStatus(id: string, status: string, notes?: string) {
    const res = await this.request(`/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
    return res.data;
  }

  async acknowledgeComplaint(id: string, satisfied: boolean, rejectionReason?: string) {
    const res = await this.request(`/complaints/${id}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ satisfied, rejectionReason }),
    });
    return res.data;
  }

  async addMessage(id: string, message: string, isStaff: boolean = false) {
    const res = await this.request(`/complaints/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ message, isStaff }),
    });
    return res.data;
  }
}

export const complaintService = new ComplaintService();
export default complaintService;
