import { PrismaClient } from '@prisma/client';
import { BedService } from './bed.service';

const prisma = new PrismaClient();
const bedService = new BedService(prisma);

export const bedGraphQLResolvers = {
  Query: {
    bedHolds: async (_: any, { pgId }: { pgId?: string }) => {
      return bedService.getBedHolds(pgId);
    }
  },
  Mutation: {
    updateBedStatus: async (_: any, { bedId, status, notes }: { bedId: string; status: string; notes?: string }) => {
      return bedService.updateBedStatus(bedId, status, notes);
    },
    createBedHold: async (_: any, args: any) => {
      return bedService.createBedHold(args);
    },
    releaseBedHold: async (_: any, { holdId }: { holdId: string }) => {
      return bedService.releaseBedHold(holdId);
    }
  }
};
