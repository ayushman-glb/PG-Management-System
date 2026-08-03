import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const settingsGraphQLResolvers = {
  Query: {
    auditLogs: async (_: any, { limit }: { limit?: number }) => {
      return prisma.activityLog.findMany({
        take: limit || 20,
        orderBy: { timestamp: 'desc' }
      });
    }
  }
};
