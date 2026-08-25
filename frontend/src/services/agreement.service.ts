import { env } from "@config/env";
import { api } from "./api";
import { Agreement, SignatureType } from "../types/Agreement";

export class AgreementService {
  async getAgreements(params?: { pgId?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.pgId) query.append("pgId", params.pgId);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get<{ agreements: Agreement[]; total: number }>(`/agreements${queryString}`);
  }

  async getResidentAgreements(_residentId?: string) {
    return this.getAgreements();
  }

  async getAgreementById(id: string): Promise<Agreement> {
    return api.get<Agreement>(`/agreements/${id}`);
  }

  async createAgreement(payload: {
    residentId: string;
    pgId: string;
    allocationId?: string;
    rentAmount: number;
    depositAmount: number;
    startDate: string | Date;
    endDate: string | Date;
    lockInPeriodMonths?: number;
    noticePeriodDays?: number;
    status?: string;
  }): Promise<Agreement> {
    return api.post<Agreement>("/agreements", payload);
  }

  async updateAgreement(id: string, payload: any): Promise<Agreement> {
    return api.patch<Agreement>(`/agreements/${id}`, payload);
  }

  async sendAgreement(id: string): Promise<Agreement> {
    return api.post<Agreement>(`/agreements/${id}/send`, {});
  }

  async signAgreement(
    id: string,
    payload: {
      signatureType: SignatureType;
      signatureData: string;
      consent?: boolean;
      override?: boolean;
    }
  ): Promise<Agreement> {
    return api.post<Agreement>(`/agreements/${id}/sign`, payload);
  }

  async verifyAgreement(agreementNumber: string) {
    return api.get(`/agreements/verify/${agreementNumber}`);
  }

  getAgreementPdfUrl(id: string) {
    return `${env.API_URL}/agreements/${id}/pdf`;
  }
}

export const agreementService = new AgreementService();
export default agreementService;
