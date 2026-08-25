import { api } from "./api";

export class AdminService {
  async getDashboardStats() {
    const res = await api.get("/admin/stats");
    return res?.data ?? res;
  }

  async listUsers(params: { role?: string; search?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.role && params.role !== "all") query.set("role", params.role);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/admin/users${queryString}`);
    return res?.data ?? res;
  }

  async setUserSuspension(userId: string, isSuspended: boolean, reason?: string) {
    const res = await api.patch(`/admin/users/${userId}/suspend`, { isSuspended, reason });
    return res?.data ?? res;
  }

  async getPendingPGs() {
    const res = await api.get("/admin/pgs/pending");
    return res?.data ?? res;
  }

  async verifyPG(pgId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const res = await api.patch(`/admin/pgs/${pgId}/verify`, { status, rejectionReason });
    return res?.data ?? res;
  }

  async getPendingKYCDocuments() {
    const res = await api.get("/admin/kyc/pending");
    return res?.data ?? res;
  }

  async verifyKYCDocument(docId: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    const res = await api.patch(`/admin/kyc/${docId}/verify`, { status, rejectionReason });
    return res?.data ?? res;
  }

  async getAuditLogs(params: { page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/admin/audit-logs${queryString}`);
    return res?.data ?? res;
  }
}

export const adminService = new AdminService();
export default adminService;
