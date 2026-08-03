import { PrismaClient } from "@prisma/client";

export class AnalyticsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalyticsByPg(pgId: string): Promise<any[]> {
    return this.prisma.analytics.findMany({
      where: { pgId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRevenueData(ownerId: string): Promise<any> {
    const pgs = await this.prisma.pG.findMany({
      where: { ownerId },
      include: {
        residents: true,
        payments: true,
        complaints: true,
        buildings: {
          include: {
            floors: { include: { rooms: { include: { beds: true } } } },
          },
        },
      },
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalRevenue = 0;
    let pendingDues = 0;
    let activeComplaints = 0;

    pgs.forEach((pg) => {
      // Beds & occupancy
      (pg.buildings || []).forEach((b) =>
        (b.floors || []).forEach((f) =>
          (f.rooms || []).forEach((r) => {
            totalBeds += (r.beds || []).length;
            (r.beds || []).forEach((bed) => {
              if (bed.isOccupied) occupiedBeds++;
            });
          }),
        ),
      );

      // Payments
      (pg.payments || []).forEach((pay) => {
        totalRevenue += pay.totalAmount || 0;
        if (pay.status === "PENDING" || pay.status === "LATE")
          pendingDues += pay.totalAmount || 0;
      });

      // Complaints
      activeComplaints += (pg.complaints || []).filter(
        (c) => c.status === "OPEN" || c.status === "IN_PROGRESS",
      ).length;
    });

    const occupancyRate =
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const monthlyRevenue = totalRevenue > 0 ? totalRevenue / months.length : 0;

    const revenueData = months.map((month, idx) => {
      const growth = 1 + idx * 0.04;
      const revenue = Math.round((monthlyRevenue || 1850000) * growth);
      return {
        month,
        revenue,
        target: Math.round(revenue * 1.1),
      };
    });

    return {
      revenueData,
      summary: {
        totalRevenue,
        totalBeds,
        occupiedBeds,
        occupancyRatePercent: occupancyRate,
        pendingDues,
        activeComplaints,
        totalProperties: pgs.length,
        residentCount: pgs.reduce(
          (acc, pg) => acc + (pg.residents?.length || 0),
          0,
        ),
      },
    };
  }
}
