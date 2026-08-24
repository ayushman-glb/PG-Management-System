import { api } from "./api";

export class AdminService {
  async getDashboardStats() {
    return api.get("/admin/stats");
  }

  async listUsers(params: { role?: string; search?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.role && params.role !== "all") query.set("role", params.role);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/admin/users${queryString}`);
  }

  async setUserSuspension(userId: string, isSuspended: boolean, reason?: string) {
    return api.patch(`/admin/users/${userId}/suspend`, { isSuspended, reason });
  }

  async getPendingPGs() {
    return api.get("/admin/pgs/pending");
  }

  async verifyPG(pgId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    return api.patch(`/admin/pgs/${pgId}/verify`, { status, rejectionReason });
  }

  async getPendingKYCDocuments() {
    return api.get("/admin/kyc/pending");
  }

  async verifyKYCDocument(docId: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    return api.patch(`/admin/kyc/${docId}/verify`, { status, rejectionReason });
  }

  async getAuditLogs(params: { page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/admin/audit-logs${queryString}`);
  }
}

export const adminService = new AdminService();
export default adminService;
