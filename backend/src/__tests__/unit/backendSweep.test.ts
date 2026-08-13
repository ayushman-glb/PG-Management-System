import { CronWorkerService } from '../../jobs/cronWorkers';
import { prisma } from '../../config/prisma';
import { TicketStatus, Priority, PaymentStatus, ResidentStatus } from '@prisma/client';

jest.mock('../../config/prisma', () => ({
  prisma: {
    resident: {
      findMany: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    complaint: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Phase 2 Backend Core Services & Messaging Layer Defect Sweep Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CronWorkerService Invoice & Late Fee Fixes', () => {
    test('generateMonthlyRentInvoices handles individual resident error without stopping batch', async () => {
      (prisma.resident.findMany as jest.Mock).mockResolvedValue([
        { id: 'usr_fail_1', pgId: 'pg_1', status: ResidentStatus.ACTIVE },
        { id: 'usr_success_2', pgId: 'pg_1', status: ResidentStatus.ACTIVE },
      ]);

      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.payment.create as jest.Mock)
        .mockRejectedValueOnce(new Error('P2002 Duplicate Key Error'))
        .mockResolvedValueOnce({ id: 'pay_success_2' });

      await CronWorkerService.generateMonthlyRentInvoices();

      // Should attempt creation for both residents despite the 1st one throwing
      expect(prisma.payment.create).toHaveBeenCalledTimes(2);
    });

    test('applyLateFees caps maximum late fee at ₹1,000 and skips capped invoices', async () => {
      const now = new Date();
      const pastDueDate = new Date(now.getTime() - 86400000); // 1 day ago

      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { id: 'pay_1', lateFee: 0, totalAmount: 10000, status: PaymentStatus.PENDING, dueDate: pastDueDate, createdAt: new Date(now.getTime() - 172800000) },
        { id: 'pay_2', lateFee: 1000, totalAmount: 11000, status: PaymentStatus.PENDING, dueDate: pastDueDate, createdAt: new Date(now.getTime() - 172800000) }, // Already capped
      ]);

      (prisma.payment.update as jest.Mock).mockResolvedValue({ id: 'pay_1' });

      await CronWorkerService.applyLateFees();

      // Should only update pay_1 (pay_2 is already capped at 1000)
      expect(prisma.payment.update).toHaveBeenCalledTimes(1);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay_1' },
        data: {
          lateFee: 250,
          totalAmount: 10250,
        },
      });
    });

    test('escalateOverdueComplaints auto-escalates stale OPEN complaints to HIGH IN_PROGRESS', async () => {
      (prisma.complaint.findMany as jest.Mock).mockResolvedValue([
        { id: 'comp_1', status: TicketStatus.OPEN, priority: Priority.MEDIUM, createdAt: new Date(Date.now() - 100000000) },
      ]);
      (prisma.complaint.update as jest.Mock).mockResolvedValue({ id: 'comp_1' });

      await CronWorkerService.escalateOverdueComplaints();

      expect(prisma.complaint.update).toHaveBeenCalledWith({
        where: { id: 'comp_1' },
        data: {
          priority: Priority.HIGH,
          status: TicketStatus.IN_PROGRESS,
        },
      });
    });
  });
});
