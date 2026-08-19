import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface OutboxPayload {
  eventType: string;
  payload: any;
}

export class OutboxService {
  /**
   * Appends an event to the Transactional Outbox.
   * Can be executed inside an active Prisma transaction to guarantee atomicity.
   */
  public static async createEvent(
    eventType: string,
    payload: any,
    tx: any = prisma
  ): Promise<any> {
    try {
      const event = await tx.outboxEvent.create({
        data: {
          eventType,
          payload,
          status: 'PENDING',
          attempts: 0,
        },
      });

      logger.debug('Outbox event created', { id: event.id, eventType });
      return event;
    } catch (error: any) {
      logger.error('Failed to create outbox event', { eventType, error: error.message });
      throw error;
    }
  }

  /**
   * Polls and processes pending outbox events (can be invoked via worker or cron).
   */
  public static async processPendingEvents(): Promise<number> {
    try {
      const pendingEvents = await prisma.outboxEvent.findMany({
        where: {
          status: { in: ['PENDING', 'RETRY'] },
          attempts: { lt: 5 },
        },
        take: 50,
        orderBy: { createdAt: 'asc' },
      });

      if (pendingEvents.length === 0) {
        return 0;
      }

      let processedCount = 0;
      for (const event of pendingEvents) {
        try {
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: 'PROCESSING', attempts: { increment: 1 } },
          });

          // Dispatch event to appropriate worker handler
          logger.info(`Processing outbox event: ${event.eventType}`, { id: event.id });

          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: 'PROCESSED' },
          });

          processedCount++;
        } catch (dispatchErr: any) {
          logger.error('Failed to process outbox event', { id: event.id, error: dispatchErr.message });
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: event.attempts >= 4 ? 'FAILED' : 'RETRY',
              error: dispatchErr.message,
            },
          });
        }
      }

      return processedCount;
    } catch (error: any) {
      logger.error('Outbox processor error', { error: error.message });
      return 0;
    }
  }
}
