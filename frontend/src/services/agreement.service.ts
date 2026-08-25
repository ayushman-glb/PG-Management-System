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
    const res = await api.get<any>(`/agreements${queryString}`);
    return res?.data ?? res;
  }

  async getResidentAgreements(_residentId?: string) {
    return this.getAgreements();
  }

  async getAgreementById(id: string): Promise<Agreement> {
    const res = await api.get<any>(`/agreements/${id}`);
    return res?.data ?? res;
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
    const res = await api.post<any>("/agreements", payload);
    return res?.data ?? res;
  }

  async updateAgreement(id: string, payload: any): Promise<Agreement> {
    const res = await api.patch<any>(`/agreements/${id}`, payload);
    return res?.data ?? res;
  }

  async sendAgreement(id: string): Promise<Agreement> {
    const res = await api.post<any>(`/agreements/${id}/send`, {});
    return res?.data ?? res;
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
    const res = await api.post<any>(`/agreements/${id}/sign`, payload);
    return res?.data ?? res;
  }

  async verifyAgreement(agreementNumber: string) {
    const res = await api.get<any>(`/agreements/verify/${agreementNumber}`);
    return res?.data ?? res;
  }

  getAgreementPdfUrl(id: string) {
    return `${env.API_URL}/agreements/${id}/pdf`;
  }
}

export const agreementService = new AgreementService();
export default agreementService;
