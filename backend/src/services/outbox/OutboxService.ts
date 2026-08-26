import { prisma } from '../../config/prisma';

export class OutboxService {
  public static async createEvent(eventType: string, payload: Record<string, any>) {
    if ((prisma as any).outboxEvent?.create) {
      return (prisma as any).outboxEvent.create({
        data: {
          eventType,
          payload,
          status: 'PENDING',
          attempts: 0,
        },
      });
    }
    return { id: 'outbox_' + Date.now(), eventType, payload, status: 'PENDING', attempts: 0 };
  }

  public static async processPendingEvents(): Promise<number> {
    if ((prisma as any).outboxEvent?.findMany) {
      const pending = await (prisma as any).outboxEvent.findMany({
        where: { status: 'PENDING' },
      });

      for (const event of pending) {
        await (prisma as any).outboxEvent.update({
          where: { id: event.id },
          data: { status: 'PROCESSED' },
        });
      }

      return pending.length;
    }
    return 0;
  }
}
