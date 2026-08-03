import { PrismaClient } from '@prisma/client';

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserNotifications(userId: string): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    return true;
  }

  async createNotification(userId: string, title: string, message: string, type: string = 'SYSTEM'): Promise<any> {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false
      }
    });
  }
}
