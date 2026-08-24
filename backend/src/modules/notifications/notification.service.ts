import { PrismaClient, Notification, NotificationType, NotificationChannel } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import { emailService } from '../email';

export interface IBroadcastAnnouncementDTO {
  ownerId: string;
  pgId: string;
  floorId?: string;
  roomId?: string;
  residentId?: string;
  title: string;
  message: string;
  channels?: NotificationChannel[];
}

export class NotificationService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async getUserNotifications(userId: string): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const [notifications, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.db.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notif = await this.db.notification.findUnique({ where: { id: notificationId } });
    if (!notif) throw new NotFoundError('Notification not found.');
    if (notif.userId !== userId) throw new ForbiddenError('You cannot update notifications for another user.');

    return await this.db.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async broadcastAnnouncement(data: IBroadcastAnnouncementDTO): Promise<{ targetCount: number }> {
    if (!data.title || !data.message) {
      throw new BadRequestError('Title and message are required.');
    }

    const pg = await this.db.pG.findUnique({ where: { id: data.pgId } });
    if (!pg) throw new NotFoundError('PG not found.');
    if (pg.ownerId !== data.ownerId) throw new ForbiddenError('You do not own this PG.');

    // Find target resident allocations
    const where: any = { pgId: data.pgId, isActive: true };
    if (data.floorId) where.floorId = data.floorId;
    if (data.roomId) where.roomId = data.roomId;
    if (data.residentId) where.residentId = data.residentId;

    const activeAllocations = await this.db.roomAllocation.findMany({
      where,
      include: { resident: true },
    });

    const targetUsers = activeAllocations.map((a) => a.resident);
    const uniqueUserMap = new Map<string, typeof targetUsers[0]>();
    for (const u of targetUsers) uniqueUserMap.set(u.id, u);

    const users = Array.from(uniqueUserMap.values());

    for (const u of users) {
      await this.db.notification.create({
        data: {
          userId: u.id,
          title: `[${pg.name}] ${data.title}`,
          message: data.message,
          type: NotificationType.ANNOUNCEMENT,
          channel: NotificationChannel.IN_APP,
        },
      });

      // Optionally send email
      try {
        await emailService.sendGenericEmail(u.email, `Announcement from ${pg.name}: ${data.title}`, data.message);
      } catch {}
    }

    return { targetCount: users.length };
  }
}
