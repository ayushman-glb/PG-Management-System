import { PrismaClient, BedStatus, PaymentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class DashboardService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async getOverview(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      const [totalProperties, totalUsers, totalResidents, totalOwners, totalBeds, occupiedBeds] = await Promise.all([
        this.db.pG.count(),
        this.db.user.count(),
        this.db.user.count({ where: { role: Role.RESIDENT } }),
        this.db.user.count({ where: { role: Role.PG_OWNER } }),
        this.db.bed.count(),
        this.db.bed.count({ where: { status: BedStatus.OCCUPIED } }),
      ]);

      const availableBeds = totalBeds - occupiedBeds;
      const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

      return {
        totalProperties,
        totalUsers,
        totalResidents,
        totalOwners,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
      };
    }

    // PG_OWNER overview
    const pgs = await this.db.pG.findMany({
      where: { ownerId: userId },
      include: {
        location: true,
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

    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;

    for (const pg of pgs) {
      for (const floor of pg.floors) {
        totalRooms += floor.rooms.length;
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

    const [payments, pendingComplaints, pendingBookings] = await Promise.all([
      this.db.payment.findMany({
        where: { pgId: { in: pgIds }, status: PaymentStatus.VERIFIED },
      }),
      this.db.complaint.count({
        where: { pgId: { in: pgIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.db.booking.count({
        where: { pgId: { in: pgIds }, status: { in: ['APPLIED', 'WAITING', 'PAYMENT_PENDING'] } },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalProperties: pgs.length,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      totalResidents: occupiedBeds,
      monthlyRevenue: totalRevenue,
      pendingComplaints,
      pendingBookings,
      properties: pgs.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.location?.address || 'Address N/A',
        city: p.location?.city || 'City N/A',
        status: p.status,
      })),
    };
  }

  async getRevenue(userId: string, userRole: Role) {
    const pgWhere: any = userRole === Role.ADMIN ? {} : { ownerId: userId };
    const pgs = await this.db.pG.findMany({ where: pgWhere, select: { id: true } });
    const pgIds = pgs.map((p) => p.id);

    const payments = await this.db.payment.findMany({
      where: { pgId: { in: pgIds }, status: PaymentStatus.VERIFIED },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    return { totalRevenue, payments };
  }

  async getOccupancy(userId: string, userRole: Role) {
    const pgWhere: any = userRole === Role.ADMIN ? {} : { ownerId: userId };
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

    const properties = pgs.map((pg) => {
      let totalBeds = 0;
      let occupiedBeds = 0;
      for (const floor of pg.floors) {
        for (const room of floor.rooms) {
          for (const bed of room.beds) {
            totalBeds++;
            if (bed.status === BedStatus.OCCUPIED) occupiedBeds++;
          }
        }
      }
      return {
        id: pg.id,
        name: pg.name,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0,
      };
    });

    return { properties };
  }
}
