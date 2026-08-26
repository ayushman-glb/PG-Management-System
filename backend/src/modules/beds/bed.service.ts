import { PrismaClient, Bed, BedStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export class BedService {
  constructor(private customDb?: PrismaClient) {}

  private get db(): PrismaClient {
    return this.customDb || (global as any).prismaSingleton || prisma;
  }

  async createBed(ownerId: string, roomId: string, bedNumber: string, baseRent?: number, depositAmount?: number): Promise<Bed> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      include: { pg: true },
    });

    if (!room) throw new NotFoundError('Room not found.');
    if (room.pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this property.');

    return await this.db.bed.create({
      data: {
        pgId: room.pgId,
        roomId: room.id,
        bedNumber,
        status: BedStatus.AVAILABLE,
        baseRent: baseRent || room.baseRent,
        depositAmount: depositAmount || room.depositAmount,
      },
    });
  }

  async getBedsByRoom(roomId: string): Promise<Bed[]> {
    return await this.db.bed.findMany({
      where: { roomId },
      orderBy: { bedNumber: 'asc' },
    });
  }

  async updateBedStatus(bedId: string, status: BedStatus, remarks?: string): Promise<Bed> {
    const bed = await this.db.bed.findUnique({
      where: { id: bedId },
    });

    if (!bed) throw new NotFoundError('Bed not found.');

    if (bed.status === BedStatus.OCCUPIED && status === BedStatus.AVAILABLE) {
      return await this.db.bed.update({
        where: { id: bedId },
        data: { status, currentResidentId: null },
      });
    }

    return await this.db.bed.update({
      where: { id: bedId },
      data: { status },
    });
  }

  async createBedHold(data: { bedId: string; reason: string; holdStartDate?: string; holdEndDate?: string; notes?: string }) {
    const bed = await this.db.bed.findUnique({ where: { id: data.bedId } });
    if (!bed) throw new NotFoundError('Bed not found.');

    await this.db.bed.update({
      where: { id: data.bedId },
      data: { status: BedStatus.RESERVED },
    });

    let holdRecord: any = null;
    if ((this.db as any).bedHold?.create) {
      holdRecord = await (this.db as any).bedHold.create({
        data: {
          bedId: data.bedId,
          reason: data.reason,
          notes: data.notes,
        },
      });
    }

    return {
      id: holdRecord?.id || `hold_${data.bedId}`,
      bedId: data.bedId,
      reason: data.reason,
      holdStartDate: data.holdStartDate || new Date().toISOString(),
      holdEndDate: data.holdEndDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: data.notes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
  }

  async releaseBedHold(holdIdOrBedId: string) {
    const bedId = holdIdOrBedId.replace('hold_', '');
    const bed = await this.db.bed.findUnique({ where: { id: bedId } });
    if (bed) {
      await this.db.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.AVAILABLE },
      });
    }
    return { success: true, message: 'Bed hold released.' };
  }

  async getBedHolds(pgId?: string) {
    const where: any = { status: BedStatus.RESERVED };
    if (pgId) where.pgId = pgId;

    const beds = await this.db.bed.findMany({
      where,
      include: { room: true, pg: true },
    });

    return beds.map((b) => ({
      id: `hold_${b.id}`,
      bedId: b.id,
      bedNumber: b.bedNumber,
      roomNumber: b.room.roomNumber,
      pgName: b.pg.name,
      reason: 'Temporary Reservation',
      status: 'ACTIVE',
      createdAt: b.updatedAt,
    }));
  }
}
