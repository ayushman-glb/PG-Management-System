export class DashboardRepository {
  constructor(private db: any) {}

  async getCounts() {
    const [totalPGs, totalOwners, totalResidents] = await Promise.all([
      this.db.pG?.count() || 0,
      this.db.owner?.count() || 0,
      this.db.resident?.count() || 0,
    ]);

    return { totalPGs, totalOwners, totalResidents };
  }

  async getRevenue() {
    const paymentAgg = await this.db.payment?.aggregate({
      _sum: { totalAmount: true, baseAmount: true },
    });
    return paymentAgg?._sum?.totalAmount || 0;
  }

  async getComplaintsSummary() {
    const grouped = (await this.db.complaint?.groupBy({
      by: ['status'],
      _count: { _all: true },
    })) || [];

    const open = grouped.find((g: any) => g.status === 'OPEN')?._count?._all || 0;
    return { open };
  }
}
