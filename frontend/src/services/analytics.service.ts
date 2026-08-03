import { api } from "./api";

export class AnalyticsService {
  async getDashboardOverview() {
    return api.get("/analytics/dashboard");
  }

  async getRevenueStats(period: string = "monthly") {
    return api.get(`/analytics/revenue?period=${period}`);
  }

  async getOccupancyStats() {
    return api.get("/analytics/occupancy");
  }
}

export const analyticsService = new AnalyticsService();
