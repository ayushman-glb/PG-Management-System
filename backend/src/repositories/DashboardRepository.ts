import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/prisma';

export interface IDashboardMetrics {
  totalPGs: number;
  totalOwners: number;
  totalResidents: number;
  totalBuildings: number;
  totalFloors: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRatePercent: number;
  totalRevenue: number;
  pendingRent: number;
  totalMaintenanceCost: number;
  totalVisitors: number;
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
  unreadNotifications: number;
  foodRatingAverage: number;
}

export class DashboardRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  private get client(): PrismaClient {
    return (global as any).prismaSingleton || this.db;
  }

  async getAggregatedMetrics(): Promise<IDashboardMetrics> {
    const [
      totalPGs,
      totalOwners,
      totalResidents,
      totalBeds,
      occupiedBeds,
      totalRooms,
      totalBuildings,
      paymentsAgg,
      complaintsAgg,
      maintenanceAgg,
      totalVisitors,
      unreadNotifications,
    ] = await Promise.all([
      this.client.pG.count(),
      this.client.owner.count(),
      this.client.resident.count({ where: { status: 'ACTIVE' } }),
      this.client.bed.count(),
      this.client.bed.count({ where: { isOccupied: true } }),
      this.client.room.count(),
      this.client.building.count(),
      this.client.payment.aggregate({
        _sum: { totalAmount: true, baseAmount: true },
        where: { status: 'PAID' },
      }),
      this.client.complaint.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.client.maintenance.aggregate({
        _sum: { cost: true },
      }),
      this.client.visitor.count(),
      this.client.notification.count({ where: { isRead: false } }),
    ]);

    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRatePercent = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;
    const totalRevenue = paymentsAgg._sum.totalAmount || 0;
    const pendingRent = paymentsAgg._sum.baseAmount || 0;
    const totalMaintenanceCost = maintenanceAgg._sum.cost || 0;

    let openComplaints = 0;
    let resolvedComplaints = 0;
    let inProgressComplaints = 0;

    complaintsAgg.forEach((c) => {
      if (c.status === 'OPEN') openComplaints = c._count._all;
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') resolvedComplaints += c._count._all;
      if (c.status === 'IN_PROGRESS') inProgressComplaints = c._count._all;
    });

    return {
      totalPGs,
      totalOwners,
      totalResidents,
      totalBuildings,
      totalFloors: totalBuildings * 3,
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      occupancyRatePercent,
      totalRevenue,
      pendingRent,
      totalMaintenanceCost,
      totalVisitors,
      complaints: {
        open: openComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        total: openComplaints + inProgressComplaints + resolvedComplaints,
      },
      unreadNotifications,
      foodRatingAverage: 0,
    };
  }

  async getRevenueTrend() {
    const payments = await this.client.payment.findMany({
      where: { status: 'PAID' },
      select: { totalAmount: true, paymentDate: true, paymentMethod: true },
      orderBy: { paymentDate: 'asc' },
    });

    const monthlyRevenueMap: Record<string, number> = {};
    payments.forEach((p) => {
      const monthKey = new Date(p.paymentDate).toISOString().slice(0, 7);
      monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + p.totalAmount;
    });

    const trend = Object.entries(monthlyRevenueMap).map(([month, amount]) => ({
      month,
      revenue: amount,
    }));

    return {
      trend,
      totalCollected: payments.reduce((acc, curr) => acc + curr.totalAmount, 0),
      count: payments.length,
    };
  }

  async getOccupancyBreakdown() {
    const [roomTypeStats, bedStats] = await Promise.all([
      this.client.room.groupBy({
        by: ['roomType'],
        _count: { _all: true },
        _avg: { rentAmount: true },
      }),
      this.client.bed.groupBy({
        by: ['isOccupied', 'status'],
        _count: { _all: true },
      }),
    ]);

    return {
      roomTypes: roomTypeStats.map((r) => ({
        type: r.roomType,
        count: r._count._all,
        averageRent: r._avg.rentAmount || 0,
      })),
      bedStatusBreakdown: bedStats,
    };
  }

  async getRecentActivity(limit: number = 10) {
    const [recentPayments, recentComplaints, recentLogs] = await Promise.all([
      this.client.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { resident: { select: { name: true, phone: true } } },
      }),
      this.client.complaint.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { resident: { select: { name: true } }, pg: { select: { name: true } } },
      }),
      this.client.activityLog.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return { recentPayments, recentComplaints, recentLogs };
  }
}
