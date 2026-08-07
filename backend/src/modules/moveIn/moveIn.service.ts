import { PrismaClient } from "@prisma/client";

export class MoveInService {
  constructor(private readonly db: PrismaClient) {}

  async getMoveInInfo(pgId: string) {
    let info = await this.db.moveInInfo.findUnique({
      where: { pgId },
      include: { pg: true },
    });

    if (!info) {
      const pg = await this.db.pG.findUnique({ where: { id: pgId } });
      if (!pg) throw new Error("PG property not found");

      info = await this.db.moveInInfo.create({
        data: {
          pgId,
          keyHandoverDetails: "Key can be collected at the main gate reception counter on move-in day.",
          houseRules: pg.rules.length > 0 ? pg.rules : [
            "Curfew at 10:30 PM",
            "No loud music after 10 PM",
            "Visitors allowed in common areas only",
          ],
          contactPhone: pg.caretakerPhone || "9876543210",
          contactEmail: "support@roombae.com",
          wifiDetails: "SSID: RoomBae_Guest | Password: WelcomeRoomBae2026",
          gateCode: "4321#",
        },
        include: { pg: true },
      });
    }

    return info;
  }

  async upsertMoveInInfo(
    pgId: string,
    data: {
      keyHandoverDetails: string;
      houseRules: string[];
      contactPhone: string;
      contactEmail: string;
      wifiDetails?: string;
      gateCode?: string;
    }
  ) {
    return this.db.moveInInfo.upsert({
      where: { pgId },
      create: {
        pgId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }

  async getTenantDashboardSummary(userId: string) {
    const [resident, activeApp, recentPayments, recentComplaints] = await Promise.all([
      this.db.resident.findUnique({
        where: { userId },
        include: { pg: true, bed: { include: { room: true } } },
      }),
      this.db.application.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { pg: true },
      }),
      this.db.payment.findMany({
        where: { resident: { userId } },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      this.db.complaint.findMany({
        where: { resident: { userId } },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      resident,
      activeApplication: activeApp,
      recentPayments,
      recentComplaints,
    };
  }
}
