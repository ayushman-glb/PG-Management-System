import { PrismaClient, Room, RoomType, Gender, BedStatus, RoomChangeStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export interface ICreateRoomDTO {
  ownerId: string;
  floorId: string;
  roomNumber: string;
  roomType: RoomType;
  allowedGender?: Gender;
  baseRent: number;
  depositAmount?: number;
  isAc?: boolean;
  hasAttachedBathroom?: boolean;
  bedsCount?: number; // Automatic bed creation helper
}

export class RoomService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async createRoom(data: ICreateRoomDTO): Promise<Room> {
    const floor = await this.db.floor.findUnique({
      where: { id: data.floorId },
      include: { pg: true },
    });

    if (!floor) throw new NotFoundError('Floor not found.');
    if (floor.pg.ownerId !== data.ownerId) throw new ForbiddenError('You do not own this property.');

    const room = await this.db.room.create({
      data: {
        floorId: data.floorId,
        pgId: floor.pgId,
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        allowedGender: data.allowedGender,
        baseRent: data.baseRent,
        depositAmount: data.depositAmount || data.baseRent,
        isAc: data.isAc || false,
        hasAttachedBathroom: data.hasAttachedBathroom || false,
      },
    });

    // Automatically create beds based on roomType or bedsCount
    let count = 1;
    if (data.bedsCount) {
      count = data.bedsCount;
    } else if (data.roomType === RoomType.SINGLE) count = 1;
    else if (data.roomType === RoomType.DOUBLE) count = 2;
    else if (data.roomType === RoomType.TRIPLE) count = 3;
    else if (data.roomType === RoomType.FOUR_SHARING) count = 4;

    const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < count; i++) {
      const suffix = bedLetters[i] || `${i + 1}`;
      await this.db.bed.create({
        data: {
          pgId: floor.pgId,
          roomId: room.id,
          bedNumber: `${data.roomNumber}-${suffix}`,
          status: BedStatus.AVAILABLE,
          baseRent: data.baseRent,
          depositAmount: data.depositAmount || data.baseRent,
        },
      });
    }

    return room;
  }

  async getRoomsByFloor(floorId: string): Promise<Room[]> {
    return await this.db.room.findMany({
      where: { floorId },
      include: { beds: true },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async updateRoomStatus(roomId: string, ownerId: string, status: BedStatus): Promise<Room> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      include: { pg: true },
    });

    if (!room) throw new NotFoundError('Room not found.');
    if (room.pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this property.');

    return await this.db.room.update({
      where: { id: roomId },
      data: { status },
    });
  }

  async convertRoom(roomId: string, ownerId: string, newType: RoomType): Promise<Room> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      include: { pg: true, beds: true },
    });

    if (!room) throw new NotFoundError('Room not found.');
    if (room.pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this property.');

    return await this.db.room.update({
      where: { id: roomId },
      data: { roomType: newType },
      include: { beds: true },
    });
  }

  async createRoomTransferRequest(data: {
    residentId: string;
    pgId: string;
    currentBedId: string;
    preferredSharingType?: string;
    preferredRoomNumber?: string;
    reason: string;
    budget?: number;
    preferredMoveDate?: string;
    additionalNotes?: string;
    priority?: string;
  }) {
    let allocation = await this.db.roomAllocation.findFirst({
      where: { residentId: data.residentId, isActive: true },
    });

    if (!allocation) {
      const bed = await this.db.bed.findUnique({
        where: { id: data.currentBedId },
        include: { room: true },
      });
      if (!bed) throw new NotFoundError('Bed not found.');

      // Auto-create an allocation if missing for seed/demo data
      const booking = await this.db.booking.findFirst({
        where: { residentId: data.residentId },
      });
      const bookingId = booking ? booking.id : (await this.db.booking.create({
        data: {
          residentId: data.residentId,
          pgId: data.pgId,
          roomId: bed.roomId,
          bedId: bed.id,
          roomType: bed.room.roomType,
          preferredMoveInDate: new Date(),
          rentAmount: bed.baseRent,
          depositAmount: bed.depositAmount,
        },
      })).id;

      const owner = await this.db.pG.findUnique({ where: { id: data.pgId } });
      allocation = await this.db.roomAllocation.create({
        data: {
          bookingId,
          residentId: data.residentId,
          pgId: data.pgId,
          floorId: bed.room.floorId,
          roomId: bed.roomId,
          bedId: bed.id,
          rent: bed.baseRent,
          deposit: bed.depositAmount,
          allocatedById: owner?.ownerId || data.residentId,
        },
      });
    }

    const roomTypeEnum = (data.preferredSharingType || 'SINGLE') as RoomType;

    const request = await this.db.roomChangeRequest.create({
      data: {
        residentId: data.residentId,
        currentAllocationId: allocation.id,
        currentBedId: data.currentBedId,
        requestedPgId: data.pgId,
        requestedRoomType: roomTypeEnum,
        reason: data.reason,
        status: RoomChangeStatus.REQUESTED,
        adminNotes: data.additionalNotes,
      },
    });

    return request;
  }

  async getRoomTransferRequests(params: { pgId?: string; residentId?: string } = {}) {
    const where: any = {};
    if (params.pgId) where.requestedPgId = params.pgId;
    if (params.residentId) where.residentId = params.residentId;

    return await this.db.roomChangeRequest.findMany({
      where,
      include: {
        resident: { include: { profile: true } },
        currentBed: { include: { room: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async approveRoomTransfer(requestId: string, targetBedId?: string, scheduledDate?: string, notes?: string) {
    const request = await this.db.roomChangeRequest.update({
      where: { id: requestId },
      data: {
        status: RoomChangeStatus.ACCEPTED,
        adminNotes: notes,
        reviewedAt: new Date(),
      },
    });
    return request;
  }

  async rejectRoomTransfer(requestId: string, rejectionReason: string) {
    const request = await this.db.roomChangeRequest.update({
      where: { id: requestId },
      data: {
        status: RoomChangeStatus.REJECTED,
        adminNotes: rejectionReason,
        reviewedAt: new Date(),
      },
    });
    return request;
  }

  async completeRoomTransfer(requestId: string) {
    const request = await this.db.roomChangeRequest.findUnique({
      where: { id: requestId },
      include: { currentAllocation: true },
    });

    if (!request) throw new NotFoundError('Room transfer request not found.');

    await this.db.roomChangeRequest.update({
      where: { id: requestId },
      data: { status: RoomChangeStatus.COMPLETED },
    });

    return { success: true, message: 'Room transfer completed successfully.' };
  }
}
