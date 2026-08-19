import { env } from "@config/env";
import type { ApiResponse } from "../types";
import { authService } from "./auth.service";

export class BedService {
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
      throw new Error(data.message || "Bed API request failed");
    }
    return data;
  }

  async updateBedStatus(bedId: string, status: string, notes?: string) {
    const res = await this.request(`/beds/${bedId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, remarks: notes }),
    });
    return res.data;
  }

  async createBedHold(bedId: string, reason: string, holdStartDate?: string, holdEndDate?: string, notes?: string) {
    const res = await this.request("/beds/holds", {
      method: "POST",
      body: JSON.stringify({ bedId, reason, holdStartDate, holdEndDate, notes }),
    });
    return res.data;
  }

  async releaseBedHold(holdId: string) {
    const res = await this.request(`/beds/holds/${holdId}`, {
      method: "DELETE",
    });
    return res.data;
  }

  async getBedHolds(pgId?: string) {
    const query = pgId ? `?pgId=${pgId}` : "";
    const res = await this.request(`/beds/holds${query}`);
    return res.data;
  }
}

export const bedService = new BedService();
