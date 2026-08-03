import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class RoomService {
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
      throw new Error(data.message || "Room API request failed");
    }
    return data;
  }

  async createRoomTransferRequest(data: {
    residentId: string;
    pgId: string;
    currentBedId: string;
    preferredSharingType?: string;
    preferredRoomNumber?: string;
    reason: string;
    budget?: number;
    preferredMoveDate?: string;
    additionalNotes?: string;
    priority?: string;
  }) {
    const res = await this.request("/resident-management/transfers/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async getRoomTransferRequests(params?: { pgId?: string; residentId?: string }) {
    const query = new URLSearchParams();
    if (params?.pgId) query.append("pgId", params.pgId);
    if (params?.residentId) query.append("residentId", params.residentId);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/resident-management/transfers${queryString}`);
    return res.data;
  }

  async approveRoomTransfer(requestId: string, targetBedId?: string, scheduledDate?: string, notes?: string) {
    const res = await this.request(`/resident-management/transfers/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({ targetBedId, scheduledDate, notes }),
    });
    return res.data;
  }

  async rejectRoomTransfer(requestId: string, rejectionReason: string) {
    const res = await this.request(`/resident-management/transfers/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason }),
    });
    return res.data;
  }

  async completeRoomTransfer(requestId: string) {
    const res = await this.request(`/resident-management/transfers/${requestId}/complete`, {
      method: "POST",
    });
    return res.data;
  }
}

export const roomService = new RoomService();
