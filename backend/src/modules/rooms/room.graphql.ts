import { PrismaClient } from '@prisma/client';
import { RoomService } from './room.service';

const prisma = new PrismaClient();
const roomService = new RoomService(prisma);

export const roomGraphQLResolvers = {
  Query: {
    roomTransferRequests: async (_: any, { pgId, residentId }: { pgId?: string; residentId?: string }) => {
      return roomService.getRoomTransferRequests(pgId, residentId);
    }
  },
  Mutation: {
    convertRoomType: async (_: any, { roomId, newType }: { roomId: string; newType: string }) => {
      return roomService.convertRoomType(roomId, newType);
    },
    requestRoomTransfer: async (_: any, args: any) => {
      return roomService.createRoomTransferRequest(args);
    },
    approveRoomTransfer: async (_: any, { requestId, targetBedId, scheduledDate }: any) => {
      return roomService.approveRoomTransfer(requestId, targetBedId, scheduledDate);
    },
    rejectRoomTransfer: async (_: any, { requestId, rejectionReason }: any) => {
      return roomService.rejectRoomTransfer(requestId, rejectionReason);
    },
    completeRoomTransfer: async (_: any, { requestId }: any) => {
      return roomService.completeRoomTransfer(requestId);
    }
  }
};
