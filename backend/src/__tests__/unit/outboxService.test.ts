import { OutboxService } from '../../services/outbox/OutboxService';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    outboxEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('OutboxService Transactional Outbox Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create an outbox event with PENDING status', async () => {
    ((prisma as any).outboxEvent.create as jest.Mock).mockResolvedValue({
      id: 'outbox_1',
      eventType: 'SEND_INVOICE_EMAIL',
      payload: { invoiceId: 'inv_123', email: 'resident@test.com' },
      status: 'PENDING',
    });

    const event = await OutboxService.createEvent('SEND_INVOICE_EMAIL', {
      invoiceId: 'inv_123',
      email: 'resident@test.com',
    });

    expect(event.id).toBe('outbox_1');
    expect((prisma as any).outboxEvent.create).toHaveBeenCalledWith({
      data: {
        eventType: 'SEND_INVOICE_EMAIL',
        payload: { invoiceId: 'inv_123', email: 'resident@test.com' },
        status: 'PENDING',
        attempts: 0,
      },
    });
  });

  test('should process pending outbox events', async () => {
    ((prisma as any).outboxEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'outbox_1',
        eventType: 'SEND_OTP_SMS',
        payload: { phone: '+919876543210', otp: '123456' },
        status: 'PENDING',
        attempts: 0,
      },
    ]);
    ((prisma as any).outboxEvent.update as jest.Mock).mockResolvedValue({ id: 'outbox_1' });

    const processedCount = await OutboxService.processPendingEvents();

    expect(processedCount).toBe(1);
    expect((prisma as any).outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox_1' },
      data: { status: 'PROCESSED' },
    });
  });
});
