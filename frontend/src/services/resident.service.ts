import { api } from "./api";

export class ResidentService {
  async onboardResident(kycData: any) {
    const res = await api.post("/residents/onboard", kycData);
    return res?.data ?? res;
  }

  async getResidentDirectory(params?: { propertyId?: string; search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.propertyId) query.append("propertyId", params.propertyId);
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/residents/directory${queryString}`);
    return res?.data ?? res;
  }

  async getPortalMe() {
    const res = await api.get("/residents/portal/me");
    return res?.data ?? res;
  }

  async updateResidentStatus(residentId: string, status: string, reason?: string) {
    const res = await api.patch(`/residents/${residentId}/status`, { status, reason });
    return res?.data ?? res;
  }

  async getResidents() {
    const res = await api.get("/residents");
    return res?.data ?? res;
  }

  async getResidentById(id: string) {
    const res = await api.get(`/residents/${id}`);
    return res?.data ?? res;
  }

  async getResidentStatusHistory(residentId: string) {
    const res = await api.get(`/residents/${residentId}/status-history`);
    return res?.data ?? res;
  }
}

export const residentService = new ResidentService();
