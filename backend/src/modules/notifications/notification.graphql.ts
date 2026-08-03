import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();
const notificationService = new NotificationService(prisma);

export const notificationGraphQLResolvers = {
  Query: {
    notifications: async (_: any, { userId }: { userId: string }) => {
      return notificationService.getUserNotifications(userId);
    }
  }
};
