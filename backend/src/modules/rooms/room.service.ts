import { PrismaClient, Room, RoomType, Gender, BedStatus } from '@prisma/client';
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
}
