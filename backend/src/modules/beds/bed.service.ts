import { PrismaClient, BedStatus, BedHoldReason } from '@prisma/client';
import { Container } from '../../container';
import { AppError } from '../../utils/appError';

export class BedService {
  constructor(private readonly db: PrismaClient) {}

  async updateBedStatus(bedId: string, status: string, notes?: string): Promise<boolean> {
    // Acquire Redlock concurrency lock on bed ID to prevent double booking or conflicting status mutations
    const lock = await Container.lockService.acquireLock(`bed:lock:${bedId}`, 10000);
    if (!lock.lockAcquired) {
      throw new AppError('Bed status edit locked by concurrent operation. Please try again.', 409);
    }

    try {
      const existingBed = await this.db.bed.findUnique({ where: { id: bedId } });
      if (!existingBed) {
        throw new AppError('Bed not found', 404);
      }

      if (status === 'OCCUPIED' && existingBed.isOccupied) {
        throw new AppError('Bed is already occupied by a resident.', 400);
      }

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

      try {
        const io = (await import('../../socket/socketServer')).getSocketServer();
        if (io) {
          io.emit('bed:status_change', { bedId, status, isOccupied });
        }
      } catch {}

      return true;
    } finally {
      await lock.release();
    }
  }

  async createBedHold(data: { bedId: string; reason: string; holdStartDate?: string; holdEndDate?: string; notes?: string }): Promise<any> {
    const lock = await Container.lockService.acquireLock(`bed:lock:${data.bedId}`, 10000);
    if (!lock.lockAcquired) {
      throw new AppError('Bed hold locked by concurrent operation.', 409);
    }

    try {
      const existingBed = await this.db.bed.findUnique({ where: { id: data.bedId } });
      if (!existingBed || existingBed.isOccupied) {
        throw new AppError('Cannot place hold on an occupied or missing bed.', 400);
      }

      await this.db.bed.update({
        where: { id: data.bedId },
        data: { status: BedStatus.HOLD }
      });

      return await this.db.bedHold.create({
        data: {
          bedId: data.bedId,
          reason: (data.reason as BedHoldReason) || BedHoldReason.MAINTENANCE,
          holdStartDate: data.holdStartDate ? new Date(data.holdStartDate) : new Date(),
          holdEndDate: data.holdEndDate ? new Date(data.holdEndDate) : undefined,
          notes: data.notes,
          isActive: true
        }
      });
    } finally {
      await lock.release();
    }
  }

  async releaseBedHold(holdId: string): Promise<boolean> {
    const hold = await this.db.bedHold.findUnique({ where: { id: holdId } });
    if (!hold) throw new AppError('Bed hold record not found', 404);

    const lock = await Container.lockService.acquireLock(`bed:lock:${hold.bedId}`, 10000);
    if (!lock.lockAcquired) {
      throw new AppError('Bed release locked by concurrent operation.', 409);
    }

    try {
      await this.db.bedHold.update({
        where: { id: holdId },
        data: { isActive: false }
      });

      await this.db.bed.update({
        where: { id: hold.bedId },
        data: { status: BedStatus.AVAILABLE }
      });

      return true;
    } finally {
      await lock.release();
    }
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
