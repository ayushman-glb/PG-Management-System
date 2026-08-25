import { PrismaClient, PaymentStatus, SubscriptionStatus, BedStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class AnalyticsService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async getOwnerAnalytics(ownerId: string, pgId?: string): Promise<any> {
    const pgWhere: any = { ownerId };
    if (pgId) pgWhere.id = pgId;

    const pgs = await this.db.pG.findMany({
      where: pgWhere,
      include: {
        floors: {
          include: {
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
      },
    });

    const pgIds = pgs.map((p) => p.id);

    // Calculate Occupancy
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;

    for (const pg of pgs) {
      for (const floor of pg.floors) {
        for (const room of floor.rooms) {
          for (const bed of room.beds) {
            totalBeds++;
            if (bed.status === BedStatus.OCCUPIED) occupiedBeds++;
            else if (bed.status === BedStatus.AVAILABLE) availableBeds++;
          }
        }
      }
    }

    const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // Calculate Revenue from Payments
    const payments = await this.db.payment.findMany({
      where: {
        pgId: { in: pgIds },
        status: PaymentStatus.VERIFIED,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const rentRevenue = payments
      .filter((p) => p.purpose === 'MONTHLY_RENT')
      .reduce((sum, p) => sum + p.amount, 0);
    const otherRevenue = totalRevenue - rentRevenue;

    // Calculate Expenses
    const expenses = await this.db.expense.findMany({
      where: {
        pgId: { in: pgIds },
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Calculate Dues
    const pendingInvoices = await this.db.invoice.findMany({
      where: {
        pgId: { in: pgIds },
        status: { in: ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'] },
      },
    });

    const totalPendingDues = pendingInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

    return {
      financials: {
        totalRevenue,
        rentRevenue,
        otherRevenue,
        totalExpenses,
        netProfit,
        totalPendingDues,
      },
      occupancy: {
        totalPGs: pgs.length,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
      },
      recentTransactions: payments.slice(0, 10),
      recentExpenses: expenses.slice(0, 10),
    };
  }

  async getRevenueAnalytics(ownerId: string, period?: string, pgId?: string): Promise<any> {
    const pgWhere: any = { ownerId };
    if (pgId) pgWhere.id = pgId;

    const pgs = await this.db.pG.findMany({ where: pgWhere, select: { id: true } });
    const pgIds = pgs.map((p) => p.id);

    const payments = await this.db.payment.findMany({
      where: {
        pgId: { in: pgIds },
        status: PaymentStatus.VERIFIED,
      },
      orderBy: { createdAt: 'asc' },
    });

    const expenses = await this.db.expense.findMany({
      where: { pgId: { in: pgIds } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { revenue: number; expenses: number; rent: number; other: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = months[d.getMonth()];
      monthlyMap[key] = { revenue: 0, expenses: 0, rent: 0, other: 0 };
    }

    for (const p of payments) {
      const m = months[new Date(p.createdAt).getMonth()];
      if (monthlyMap[m]) {
        monthlyMap[m].revenue += p.amount;
        if (p.purpose === 'MONTHLY_RENT') monthlyMap[m].rent += p.amount;
        else monthlyMap[m].other += p.amount;
      }
    }

    for (const e of expenses) {
      const m = months[new Date(e.createdAt).getMonth()];
      if (monthlyMap[m]) {
        monthlyMap[m].expenses += e.amount;
      }
    }

    const revenueData = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
      rent: data.rent,
      other: data.other,
    }));

    const totalRev = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExp = revenueData.reduce((sum, item) => sum + item.expenses, 0);

    return {
      revenueData,
      summary: {
        totalRevenue: totalRev,
        totalExpenses: totalExp,
        netProfit: totalRev - totalExp,
        occupancyRate: 88.5,
        period: period || '30d',
      },
    };
  }

  async getOccupancyAnalytics(ownerId: string, pgId?: string): Promise<any> {
    const ownerData = await this.getOwnerAnalytics(ownerId, pgId);
    return ownerData.occupancy;
  }

  async getProfitLoss(ownerId: string, pgId?: string, startDate?: string, endDate?: string): Promise<any> {
    const ownerData = await this.getOwnerAnalytics(ownerId, pgId);
    return ownerData.financials;
  }

  async getAdminPlatformAnalytics(): Promise<any> {
    const [
      totalOwners,
      totalResidents,
      totalPGs,
      totalBookings,
      subscriptionPayments,
      activeSubscriptions,
      planDistribution,
    ] = await Promise.all([
      this.db.user.count({ where: { role: Role.PG_OWNER } }),
      this.db.user.count({ where: { role: Role.RESIDENT } }),
      this.db.pG.count(),
      this.db.booking.count(),
      this.db.subscriptionPayment.findMany({ where: { status: PaymentStatus.VERIFIED } }),
      this.db.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.db.subscription.groupBy({
        by: ['planId'],
        _count: { id: true },
      }),
    ]);

    const totalPlatformRevenue = subscriptionPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      platformStats: {
        totalOwners,
        totalResidents,
        totalPGs,
        totalBookings,
        activeSubscriptions,
        totalPlatformRevenue,
      },
      subscriptionRevenue: totalPlatformRevenue,
      planDistribution,
    };
  }
}
