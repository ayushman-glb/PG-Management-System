import { api } from "./api";

export class AnalyticsService {
  async getOwnerAnalytics(pgId?: string) {
    const query = pgId ? `?pgId=${pgId}` : "";
    return api.get(`/analytics/owner${query}`);
  }

  async getOccupancyAnalytics(pgId?: string) {
    const query = pgId ? `?pgId=${pgId}` : "";
    return api.get(`/analytics/occupancy${query}`);
  }

  async getAdminAnalytics() {
    return api.get("/analytics/admin");
  }

  async getProfitLoss(pgId?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (pgId) params.set("pgId", pgId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/analytics/pl${query}`);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
