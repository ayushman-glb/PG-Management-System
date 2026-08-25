import { env } from "@config/env";
import { api } from "./api";

export class AgreementService {
  async getAgreements(params?: { pgId?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.pgId) query.append("pgId", params.pgId);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/agreements${queryString}`);
    return res?.data ?? res;
  }

  async getResidentAgreements(_residentId?: string) {
    return this.getAgreements();
  }

  async getAgreementById(id: string) {
    const res = await api.get(`/agreements/${id}`);
    return res?.data ?? res;
  }

  async signAgreement(id: string, signatureData: { signerType: string; signerName: string; signatureDataSvg: string; signatureImageUrl?: string; ipAddress?: string; userAgent?: string }) {
    const res = await api.post(`/agreements/${id}/sign`, signatureData);
    return res?.data ?? res;
  }

  async verifyAgreement(agreementNumber: string) {
    const res = await api.get(`/agreements/verify/${agreementNumber}`);
    return res?.data ?? res;
  }

  getAgreementPdfUrl(id: string) {
    return `${env.API_URL}/agreements/${id}/pdf`;
  }
}

export const agreementService = new AgreementService();
export default agreementService;
