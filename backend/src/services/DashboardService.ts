import { DashboardRepository, IDashboardMetrics } from '../repositories/DashboardRepository';

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository = new DashboardRepository()) {}

  async getOverview(): Promise<IDashboardMetrics> {
    return this.dashboardRepository.getAggregatedMetrics();
  }

  async getRevenueAnalytics(): Promise<any> {
    return this.dashboardRepository.getRevenueTrend();
  }

  async getOccupancyAnalytics(): Promise<any> {
    return this.dashboardRepository.getOccupancyBreakdown();
  }
}
