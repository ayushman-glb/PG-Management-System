import { api } from "./api";

export class AnalyticsService {
  async getDashboardOverview() {
    return api.get("/analytics/revenue");
  }

  async getRevenueStats(period: string = "monthly") {
    return api.get(`/analytics/revenue?period=${period}`);
  }

  async getOccupancyStats() {
    return api.get("/analytics/revenue");
  }

  async getByPg(pgId: string) {
    return api.get(`/analytics/pg/${pgId}`);
  }
}

export const analyticsService = new AnalyticsService();
