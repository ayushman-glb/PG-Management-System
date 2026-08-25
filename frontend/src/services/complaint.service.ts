import { api } from "./api";

export class ComplaintService {
  async listComplaints(params?: { pgId?: string; propertyId?: string; priority?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    const pgId = params?.pgId || params?.propertyId;
    if (pgId) query.append("pgId", pgId);
    if (params?.priority && params.priority !== "all") query.append("priority", params.priority);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/complaints${queryString}`);
    return res?.data ?? res;
  }

  async getComplaintById(id: string) {
    const res = await api.get(`/complaints/${id}`);
    return res?.data ?? res;
  }

  async createComplaint(data: { pgId?: string; propertyId?: string; category: string; title: string; description: string; priority?: string; roomId?: string; bedId?: string; images?: string[] }) {
    const payload = {
      ...data,
      pgId: data.pgId || data.propertyId,
    };
    const res = await api.post("/complaints", payload);
    return res?.data ?? res;
  }

  async updateComplaintStatus(id: string, status: string, notes?: string) {
    const res = await api.patch(`/complaints/${id}/status`, { status, notes });
    return res?.data ?? res;
  }

  async acknowledgeComplaint(id: string, satisfied: boolean, rejectionReason?: string) {
    const res = await api.post(`/complaints/${id}/acknowledge`, { satisfied, rejectionReason });
    return res?.data ?? res;
  }

  async addMessage(id: string, message: string, isStaff: boolean = false) {
    const res = await api.post(`/complaints/${id}/messages`, { message, isStaff });
    return res?.data ?? res;
  }
}

export const complaintService = new ComplaintService();
export default complaintService;
