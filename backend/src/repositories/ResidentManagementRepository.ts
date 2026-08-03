import { PrismaClient, ResidentStatus, BedStatus, RoomTransferStatus } from '@prisma/client';
import {
  IResidentManagementRepository,
  IUpdateResidentStatusPayload,
  ICreateBedHoldPayload,
  ICreateRoomTransferPayload,
  IApproveRoomTransferPayload
} from '../interfaces/IResidentManagementRepository';

export class ResidentManagementRepository implements IResidentManagementRepository {
  constructor(private readonly db: PrismaClient) {}

  async updateResidentStatus(payload: IUpdateResidentStatusPayload): Promise<any> {
    const { residentId, status, reason, updatedBy } = payload;

    const [updatedResident, history] = await this.db.$transaction([
      this.db.resident.update({
        where: { id: residentId },
        data: { status },
        include: { user: true, bed: { include: { room: true } }, pg: true }
      }),
      this.db.residentStatusHistory.create({
        data: {
          residentId,
          status,
          reason,
          updatedBy
        }
      })
    ]);

    await this.db.activityLog.create({
      data: {
        userId: updatedResident.userId,
        action: `RESIDENT_STATUS_${status}`,
        ipAddress: '127.0.0.1',
        userAgent: 'RoomBae-Server',
        details: `Status updated to ${status}. Reason: ${reason || 'N/A'}`
      }
    });

    return updatedResident;
  }

  async getResidentStatusHistory(residentId: string): Promise<any[]> {
    return this.db.residentStatusHistory.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateBedStatus(bedId: string, status: BedStatus, updatedBy: string, notes?: string): Promise<any> {
    const isOccupied = status === BedStatus.OCCUPIED;
    const [updatedBed] = await this.db.$transaction([
      this.db.bed.update({
        where: { id: bedId },
        data: { status, isOccupied },
        include: { room: true, resident: true }
      }),
      this.db.bedHistory.create({
        data: {
          bedId,
          status,
          notes,
          updatedBy,
          action: `BED_STATUS_${status}`
        }
      })
    ]);

    return updatedBed;
  }

  async createBedHold(payload: ICreateBedHoldPayload): Promise<any> {
    const { bedId, reason, holdStartDate, holdEndDate, createdBy, notes } = payload;

    const [hold, updatedBed] = await this.db.$transaction([
      this.db.bedHold.create({
        data: {
          bedId,
          reason,
          holdStartDate: holdStartDate || new Date(),
          holdEndDate,
          createdBy,
          notes,
          isActive: true
        }
      }),
      this.db.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.HOLD },
        include: { room: true }
      }),
      this.db.bedHistory.create({
        data: {
          bedId,
          status: BedStatus.HOLD,
          action: `BED_HOLD_${reason}`,
          notes,
          updatedBy: createdBy
        }
      })

    ]);

    return { hold, bed: updatedBed };
  }

  async releaseBedHold(holdId: string, updatedBy: string): Promise<any> {
    const hold = await this.db.bedHold.findUnique({ where: { id: holdId } });
    if (!hold) throw new Error('Bed hold not found');

    const [releasedHold, updatedBed] = await this.db.$transaction([
      this.db.bedHold.update({
        where: { id: holdId },
        data: { isActive: false }
      }),
      this.db.bed.update({
        where: { id: hold.bedId },
        data: { status: BedStatus.AVAILABLE },
        include: { room: true }
      }),
      this.db.bedHistory.create({
        data: {
          bedId: hold.bedId,
          status: BedStatus.AVAILABLE,
          action: 'BED_HOLD_RELEASED',
          updatedBy
        }
      })
    ]);

    return { hold: releasedHold, bed: updatedBed };
  }

  async getBedHolds(pgId?: string): Promise<any[]> {
    try {
      return await this.db.bedHold.findMany({
        where: {
          isActive: true,
          ...(pgId ? { bed: { room: { floor: { building: { pgId } } } } } : {})
        },
        include: {
          bed: { include: { room: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      return [];
    }
  }

  async getBedHistory(bedId: string): Promise<any[]> {
    try {
      return await this.db.bedHistory.findMany({
        where: { bedId },
        orderBy: { timestamp: 'desc' }
      });
    } catch {
      return [];
    }
  }

  async createRoomTransferRequest(payload: ICreateRoomTransferPayload): Promise<any> {
    const request = await this.db.roomTransferRequest.create({
      data: {
        residentId: payload.residentId,
        pgId: payload.pgId,
        currentBedId: payload.currentBedId,
        preferredSharingType: payload.preferredSharingType,
        preferredRoomNumber: payload.preferredRoomNumber,
        reason: payload.reason,
        budget: payload.budget,
        preferredMoveDate: payload.preferredMoveDate,
        additionalNotes: payload.additionalNotes,
        priority: payload.priority ? (payload.priority as any) : 'MEDIUM',
        status: RoomTransferStatus.PENDING,
        attachments: payload.attachments || []
      },
      include: {
        resident: { include: { user: true } },
        currentBed: { include: { room: true } },
        pg: true
      }
    });

    await this.db.roomTransferHistory.create({
      data: {
        requestId: request.id,
        fromBedId: payload.currentBedId,
        performedBy: payload.residentId,
        notes: 'Room transfer request submitted'
      }
    });

    return request;
  }

  async getRoomTransferRequests(pgId?: string, residentId?: string): Promise<any[]> {
    try {
      return await this.db.roomTransferRequest.findMany({
        where: {
          ...(pgId ? { pgId } : {}),
          ...(residentId ? { residentId } : {})
        },
        include: {
          resident: { include: { user: true } },
          currentBed: { include: { room: true } },
          targetBed: { include: { room: true } },
          pg: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      return [];
    }
  }

  async getRoomTransferRequestById(requestId: string): Promise<any | null> {
    try {
      return await this.db.roomTransferRequest.findUnique({
        where: { id: requestId },
        include: {
          resident: { include: { user: true } },
          currentBed: { include: { room: true } },
          targetBed: { include: { room: true } },
          pg: true
        }
      });
    } catch {
      return null;
    }
  }

  async approveRoomTransferRequest(payload: IApproveRoomTransferPayload): Promise<any> {
    const { requestId, targetBedId, scheduledDate, performedBy, notes } = payload;

    const request = await this.db.roomTransferRequest.update({
      where: { id: requestId },
      data: {
        status: RoomTransferStatus.APPROVED,
        targetBedId: targetBedId || undefined,
        scheduledDate: scheduledDate || new Date(),
        additionalNotes: notes
      },
      include: {
        resident: { include: { user: true } },
        currentBed: { include: { room: true } },
        targetBed: { include: { room: true } },
        pg: true
      }
    });

    await this.db.roomTransferHistory.create({
      data: {
        requestId,
        fromBedId: request.currentBedId,
        toBedId: targetBedId,
        performedBy,
        notes: notes || 'Transfer request approved'
      }
    });

    return request;
  }

  async rejectRoomTransferRequest(requestId: string, rejectionReason: string, performedBy: string): Promise<any> {
    const request = await this.db.roomTransferRequest.update({
      where: { id: requestId },
      data: {
        status: RoomTransferStatus.REJECTED,
        rejectionReason
      },
      include: {
        resident: { include: { user: true } },
        currentBed: { include: { room: true } },
        pg: true
      }
    });

    await this.db.roomTransferHistory.create({
      data: {
        requestId,
        performedBy,
        notes: `Transfer request rejected: ${rejectionReason}`
      }
    });

    return request;
  }

  async completeRoomTransfer(requestId: string, performedBy: string): Promise<any> {
    const transferReq = await this.db.roomTransferRequest.findUnique({
      where: { id: requestId },
      include: { resident: true }
    });

    if (!transferReq || !transferReq.targetBedId) {
      throw new Error('Room transfer request or target bed not found');
    }

    const oldBedId = transferReq.currentBedId;
    const newBedId = transferReq.targetBedId;

    // Transaction: Swap resident's bed, release old bed, occupy new bed, complete transfer
    const [updatedReq, updatedResident] = await this.db.$transaction([
      this.db.roomTransferRequest.update({
        where: { id: requestId },
        data: {
          status: RoomTransferStatus.COMPLETED,
          completedAt: new Date()
        },
        include: {
          resident: { include: { user: true } },
          currentBed: { include: { room: true } },
          targetBed: { include: { room: true } },
          pg: true
        }
      }),
      this.db.resident.update({
        where: { id: transferReq.residentId },
        data: { bedId: newBedId },
        include: { user: true, bed: { include: { room: true } } }
      }),
      this.db.bed.update({
        where: { id: oldBedId },
        data: { status: BedStatus.AVAILABLE, isOccupied: false }
      }),
      this.db.bed.update({
        where: { id: newBedId },
        data: { status: BedStatus.OCCUPIED, isOccupied: true }
      }),
      this.db.roomTransferHistory.create({
        data: {
          requestId,
          fromBedId: oldBedId,
          toBedId: newBedId,
          performedBy,
          notes: 'Transfer completed successfully'
        }
      })
    ]);

    return { request: updatedReq, resident: updatedResident };
  }

  async convertRoomType(roomId: string, newType: 'SINGLE' | 'DOUBLE' | 'TRIPLE', performedBy: string): Promise<any> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      include: { beds: true, floor: { include: { building: { include: { pg: true } } } } }
    });

    if (!room) throw new Error('Room not found');

    const targetBedCount = newType === 'SINGLE' ? 1 : newType === 'DOUBLE' ? 2 : 3;
    const currentBeds = room.beds;

    if (currentBeds.length === targetBedCount) {
      return room;
    }

    // Adjust beds in room
    if (currentBeds.length < targetBedCount) {
      // Add extra beds
      for (let i = currentBeds.length + 1; i <= targetBedCount; i++) {
        const bedLetter = String.fromCharCode(64 + i);
        await this.db.bed.create({
          data: {
            roomId: room.id,
            bedNumber: `${room.roomNumber}-${bedLetter}`,
            status: BedStatus.AVAILABLE,
            isOccupied: false
          }
        });
      }
    } else if (currentBeds.length > targetBedCount) {
      // Remove unoccupied beds
      const unoccupiedBeds = currentBeds.filter(b => !b.isOccupied);
      const bedsToRemove = unoccupiedBeds.slice(0, currentBeds.length - targetBedCount);
      for (const bed of bedsToRemove) {
        await this.db.bed.delete({ where: { id: bed.id } });
      }
    }

    const updatedRoom = await this.db.room.update({
      where: { id: roomId },
      data: { roomType: newType as any },
      include: { beds: true }
    });

    await this.db.activityLog.create({
      data: {
        userId: performedBy,
        action: `ROOM_CONVERTED_${newType}`,
        ipAddress: '127.0.0.1',
        userAgent: 'RoomBae-Server',
        details: `Room ${room.roomNumber} converted to ${newType}`
      }
    });

    return updatedRoom;
  }

  async getAuditLogs(limit: number = 50): Promise<any[]> {
    try {
      return await this.db.activityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: { user: true }
      });
    } catch {
      return [];
    }
  }

  async getNotifications(userId: string): Promise<any[]> {
    try {
      return await this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      return [];
    }
  }
}

