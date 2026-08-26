import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors/CustomErrors';
import { SocketServer } from '../../socket/socketServer';

export class MessageService {
  async getOrCreateThread(userId: string, pgId: string) {
    if (!pgId) throw new BadRequestError('PG / Property ID is required.');

    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
      include: { owner: true },
    });
    if (!pg) throw new NotFoundError('Property not found.');

    const thread = await prisma.messageThread.upsert({
      where: {
        pgId_userId: { pgId, userId },
      },
      create: {
        pgId,
        userId,
        ownerId: pg.ownerId,
        lastMessage: 'Conversation started',
        lastSentAt: new Date(),
      },
      update: {},
      include: {
        pg: {
          include: {
            location: true,
            images: { take: 1 },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
      },
    });

    return thread;
  }

  async getThreads(userId: string, role: string) {
    if (role === 'PG_OWNER') {
      return prisma.messageThread.findMany({
        where: { ownerId: userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: true,
            },
          },
          pg: {
            include: {
              location: true,
              images: { take: 1 },
            },
          },
        },
        orderBy: { lastSentAt: 'desc' },
      });
    }

    return prisma.messageThread.findMany({
      where: { userId },
      include: {
        pg: {
          include: {
            location: true,
            images: { take: 1 },
          },
        },
      },
      orderBy: { lastSentAt: 'desc' },
    });
  }

  async getThreadMessages(threadId: string, userId: string, role: string) {
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundError('Message thread not found.');

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      if (thread.userId !== userId && thread.ownerId !== userId) {
        throw new ForbiddenError('Unauthorized to access this thread.');
      }
    }

    // Reset unread counter for reader
    if (thread.userId === userId && thread.unreadUser > 0) {
      await prisma.messageThread.update({
        where: { id: threadId },
        data: { unreadUser: 0 },
      });
    } else if (thread.ownerId === userId && thread.unreadOwner > 0) {
      await prisma.messageThread.update({
        where: { id: threadId },
        data: { unreadOwner: 0 },
      });
    }

    return prisma.message.findMany({
      where: { threadId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(senderId: string, threadId: string, content: string, attachments: string[] = []) {
    if (!content && attachments.length === 0) {
      throw new BadRequestError('Message content or attachment is required.');
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundError('Message thread not found.');

    if (thread.userId !== senderId && thread.ownerId !== senderId) {
      throw new ForbiddenError('Unauthorized to send messages in this thread.');
    }

    const isSenderResident = thread.userId === senderId;
    const recipientId = isSenderResident ? thread.ownerId : thread.userId;

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId,
        content: content.trim(),
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
    });

    await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        lastMessage: content.trim() || 'Attachment',
        lastSentAt: new Date(),
        unreadUser: isSenderResident ? thread.unreadUser : { increment: 1 },
        unreadOwner: isSenderResident ? { increment: 1 } : thread.unreadOwner,
      },
    });

    // Real-time broadcast via Socket.IO
    SocketServer.emitToUser(recipientId, 'new_message', {
      threadId,
      message,
    });
    SocketServer.emitToPG(thread.pgId, 'pg_message', {
      threadId,
      message,
    });

    return message;
  }
}
