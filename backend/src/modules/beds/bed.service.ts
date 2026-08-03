import { PrismaClient, BedStatus, BedHoldReason } from '@prisma/client';

export class BedService {
  constructor(private readonly db: PrismaClient) {}

  async updateBedStatus(bedId: string, status: string, notes?: string): Promise<boolean> {
    const isOccupied = status === 'OCCUPIED';
    await this.db.bed.update({
      where: { id: bedId },
      data: {
        status: status as BedStatus,
        isOccupied
      }
    });

    await this.db.bedHistory.create({
      data: {
        bedId,
        status: status as BedStatus,
        action: `Status updated to ${status}`,
        notes
      }
    });

    return true;
  }

  async createBedHold(data: { bedId: string; reason: string; holdStartDate?: string; holdEndDate?: string; notes?: string }): Promise<any> {
    await this.db.bed.update({
      where: { id: data.bedId },
      data: { status: BedStatus.HOLD }
    });

    return this.db.bedHold.create({
      data: {
        bedId: data.bedId,
        reason: (data.reason as BedHoldReason) || BedHoldReason.MAINTENANCE,
        holdStartDate: data.holdStartDate ? new Date(data.holdStartDate) : new Date(),
        holdEndDate: data.holdEndDate ? new Date(data.holdEndDate) : undefined,
        notes: data.notes,
        isActive: true
      }
    });
  }

  async releaseBedHold(holdId: string): Promise<boolean> {
    const hold = await this.db.bedHold.update({
      where: { id: holdId },
      data: { isActive: false }
    });

    await this.db.bed.update({
      where: { id: hold.bedId },
      data: { status: BedStatus.AVAILABLE }
    });

    return true;
  }

  async getBedHolds(pgId?: string): Promise<any[]> {
    const where: any = { isActive: true };
    if (pgId) {
      where.bed = {
        room: {
          floor: {
            building: {
              pgId
            }
          }
        }
      };
    }
    return this.db.bedHold.findMany({
      where,
      include: { bed: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
