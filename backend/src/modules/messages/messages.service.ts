import { PrismaClient } from "@prisma/client";
import { SocketServer } from "../../socket/socketServer";

export class MessagesService {
  constructor(private readonly db: PrismaClient) {}

  async getOrCreateThread(tenantId: string, pgId: string) {
    const property = await this.db.pG.findUnique({ where: { id: pgId } });
    if (!property) throw new Error("Property not found");

    let thread = await this.db.chatThread.findUnique({
      where: { tenantId_pgId: { tenantId, pgId } },
      include: { pg: true, tenant: true, owner: true },
    });

    if (!thread) {
      // Find user ID for owner
      const ownerRecord = await this.db.owner.findUnique({ where: { id: property.ownerId } });
      const ownerUserId = ownerRecord?.userId || property.ownerId;

      thread = await this.db.chatThread.create({
        data: {
          pgId,
          tenantId,
          ownerId: ownerUserId,
        },
        include: { pg: true, tenant: true, owner: true },
      });
    }

    return thread;
  }

  async getUserThreads(userId: string) {
    return this.db.chatThread.findMany({
      where: {
        OR: [{ tenantId: userId }, { ownerId: userId }],
      },
      include: {
        pg: true,
        tenant: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getThreadMessages(threadId: string, userId: string) {
    const thread = await this.db.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error("Chat thread not found");

    if (thread.tenantId !== userId && thread.ownerId !== userId) {
      throw new Error("Unauthorized to access this thread");
    }

    return this.db.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
  }

  async sendMessage(senderId: string, threadId: string, content: string) {
    const thread = await this.db.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error("Chat thread not found");

    const message = await this.db.message.create({
      data: {
        threadId,
        senderId,
        content,
      },
    });

    await this.db.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessage: content,
        updatedAt: new Date(),
      },
    });

    const recipientId = thread.tenantId === senderId ? thread.ownerId : thread.tenantId;

    // Real-time broadcast via Socket.IO
    SocketServer.emitToUser(recipientId, "chat:message", {
      threadId,
      message,
    });

    return message;
  }
}
