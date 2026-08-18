import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class PropertyService {
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

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Property API request failed");
    }
    return data;
  }

  async getPublicProperties(params?: {
    city?: string;
    minRent?: number;
    maxRent?: number;
    roomType?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.city) query.append("city", params.city);
    if (params?.minRent) query.append("minRent", params.minRent.toString());
    if (params?.maxRent) query.append("maxRent", params.maxRent.toString());
    if (params?.roomType) query.append("roomType", params.roomType);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/properties/public${queryString}`);
    return res.data;
  }

  async getPropertyById(id: string) {
    const res = await this.request(`/properties/${id}`);
    return res.data;
  }

  async createProperty(propertyData: any) {
    const res = await this.request("/properties", {
      method: "POST",
      body: JSON.stringify(propertyData),
    });
    return res.data;
  }

  async getOwnerSummary() {
    try {
      const res = await this.request("/dashboard/overview");
      return res.data;
    } catch (e) {
      const res = await this.request("/properties/owner-summary");
      return res.data;
    }
  }
}

export const propertyService = new PropertyService();
