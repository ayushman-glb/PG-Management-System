import { PrismaClient, RoomType } from '@prisma/client';

export class RoomService {
  constructor(private readonly db: PrismaClient) {}

  async convertRoomType(roomId: string, newType: string): Promise<boolean> {
    await this.db.room.update({
      where: { id: roomId },
      data: { roomType: newType as RoomType }
    });
    return true;
  }

  async getRoomsByPg(pgId: string): Promise<any[]> {
    return this.db.room.findMany({
      where: {
        floor: {
          building: {
            pgId
          }
        }
      },
      include: { beds: true }
    });
  }

  async createRoomTransferRequest(data: any): Promise<any> {
    return this.db.roomTransferRequest.create({
      data: {
        residentId: data.residentId,
        pgId: data.pgId,
        currentBedId: data.currentBedId,
        targetBedId: data.targetBedId,
        preferredSharingType: data.preferredSharingType,
        preferredRoomNumber: data.preferredRoomNumber,
        reason: data.reason,
        budget: data.budget,
        preferredMoveDate: data.preferredMoveDate ? new Date(data.preferredMoveDate) : undefined,
        additionalNotes: data.additionalNotes,
        priority: data.priority || 'MEDIUM',
        attachments: data.attachments || []
      }
    });
  }

  async getRoomTransferRequests(pgId?: string, residentId?: string): Promise<any[]> {
    const where: any = {};
    if (pgId) where.pgId = pgId;
    if (residentId) where.residentId = residentId;
    return this.db.roomTransferRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveRoomTransfer(requestId: string, targetBedId?: string, scheduledDate?: string): Promise<any> {
    return this.db.roomTransferRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        targetBedId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined
      }
    });
  }

  async rejectRoomTransfer(requestId: string, rejectionReason: string): Promise<any> {
    return this.db.roomTransferRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason
      }
    });
  }

  async completeRoomTransfer(requestId: string): Promise<any> {
    const req = await this.db.roomTransferRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new Error('Transfer request not found');

    if (req.targetBedId) {
      await this.db.bed.update({
        where: { id: req.currentBedId },
        data: { isOccupied: false, status: 'AVAILABLE' }
      });
      await this.db.bed.update({
        where: { id: req.targetBedId },
        data: { isOccupied: true, status: 'OCCUPIED' }
      });
      await this.db.resident.update({
        where: { id: req.residentId },
        data: { bedId: req.targetBedId }
      });
    }

    return this.db.roomTransferRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  }
}
