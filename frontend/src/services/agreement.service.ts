import { env } from "@config/env";
import type { ApiResponse } from "../types";
import { authService } from "./auth.service";

export class AgreementService {
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
      throw new Error(data.message || "Agreement API request failed");
    }
    return data;
  }

  async getAgreements(params?: { pgId?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.pgId) query.append("pgId", params.pgId);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/agreements${queryString}`);
    return res.data;
  }

  async getResidentAgreements(_residentId?: string) {
    return this.getAgreements();
  }

  async getAgreementById(id: string) {
    const res = await this.request(`/agreements/${id}`);
    return res.data;
  }

  async signAgreement(id: string, signatureData: { signerType: string; signerName: string; signatureDataSvg: string; signatureImageUrl?: string; ipAddress?: string; userAgent?: string }) {
    const res = await this.request(`/agreements/${id}/sign`, {
      method: "POST",
      body: JSON.stringify(signatureData),
    });
    return res.data;
  }

  async verifyAgreement(agreementNumber: string) {
    const res = await this.request(`/agreements/verify/${agreementNumber}`);
    return res.data;
  }

  getAgreementPdfUrl(id: string) {
    return `${env.API_URL}/agreements/${id}/pdf`;
  }
}

export const agreementService = new AgreementService();
export default agreementService;
