import { PrismaClient, Bed, BedStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export class BedService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
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

  async updateBedStatus(bedId: string, ownerId: string, status: BedStatus): Promise<Bed> {
    const bed = await this.db.bed.findUnique({
      where: { id: bedId },
      include: { pg: true },
    });

    if (!bed) throw new NotFoundError('Bed not found.');
    if (bed.pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this property.');

    if (bed.status === BedStatus.OCCUPIED && status === BedStatus.AVAILABLE) {
      // Clear resident assignment when releasing bed
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
}
