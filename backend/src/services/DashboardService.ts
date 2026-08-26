import { DashboardRepository } from '../repositories/DashboardRepository';

export class DashboardService {
  constructor(private repo: DashboardRepository) {}

  async getOverview(): Promise<any> {
    const counts = await this.repo.getCounts();
    const totalRevenue = await this.repo.getRevenue();
    const complaints = await this.repo.getComplaintsSummary();

    return {
      totalPGs: counts.totalPGs,
      totalOwners: counts.totalOwners,
      totalResidents: counts.totalResidents,
      totalRevenue,
      complaints,
    };
  }
}
