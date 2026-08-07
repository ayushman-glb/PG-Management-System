import { PrismaClient } from "@prisma/client";
import { SocketServer } from "../../socket/socketServer";

export class ToursService {
  constructor(private readonly db: PrismaClient) {}

  // Shortlist operations
  async toggleShortlist(userId: string, pgId: string) {
    const existing = await this.db.shortlist.findUnique({
      where: { userId_pgId: { userId, pgId } },
    });

    if (existing) {
      await this.db.shortlist.delete({ where: { id: existing.id } });
      return { shortlisted: false, message: "Removed from shortlist" };
    } else {
      await this.db.shortlist.create({
        data: { userId, pgId },
      });
      return { shortlisted: true, message: "Added to shortlist" };
    }
  }

  async getUserShortlist(userId: string) {
    const items = await this.db.shortlist.findMany({
      where: { userId },
      include: { pg: true },
      orderBy: { createdAt: "desc" },
    });
    return items.map((i) => i.pg);
  }

  // Tour operations
  async requestTour(data: {
    userId: string;
    pgId: string;
    requestedSlot: Date | string;
    notes?: string;
  }) {
    const property = await this.db.pG.findUnique({ where: { id: data.pgId } });
    if (!property) throw new Error("Property not found");

    const tour = await this.db.tour.create({
      data: {
        userId: data.userId,
        pgId: data.pgId,
        ownerId: property.ownerId,
        requestedSlot: new Date(data.requestedSlot),
        notes: data.notes,
        status: "PENDING",
      },
      include: { pg: true, user: true },
    });

    // Real-time Socket.IO notification to PG Owner
    SocketServer.emitToUser(property.ownerId, "tour:created", {
      message: `New tour request for ${property.name}`,
      tour,
    });

    return tour;
  }

  async listTours(user: { id: string; role: string }) {
    if (user.role === "OWNER" || user.role === "MANAGER" || user.role === "ADMIN") {
      const owner = await this.db.owner.findFirst({ where: { userId: user.id } });
      const ownerId = owner?.id || user.id;

      return this.db.tour.findMany({
        where: { ownerId },
        include: { pg: true, user: true },
        orderBy: { requestedSlot: "asc" },
      });
    }

    // Default tenant view
    return this.db.tour.findMany({
      where: { userId: user.id },
      include: { pg: true },
      orderBy: { requestedSlot: "asc" },
    });
  }

  async updateTourStatus(
    tourId: string,
    data: { status: "CONFIRMED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED"; ownerNotes?: string; requestedSlot?: string }
  ) {
    const updateData: any = {
      status: data.status,
      ownerNotes: data.ownerNotes,
    };
    if (data.requestedSlot) {
      updateData.requestedSlot = new Date(data.requestedSlot);
    }

    const tour = await this.db.tour.update({
      where: { id: tourId },
      data: updateData,
      include: { pg: true },
    });

    // Real-time Socket.IO notification to Tenant
    SocketServer.emitToUser(tour.userId, "tour:updated", {
      message: `Your tour for ${tour.pg.name} has been ${data.status.toLowerCase()}`,
      tour,
    });

    return tour;
  }
}
