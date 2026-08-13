import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { TicketStatus, Priority, PaymentStatus, ResidentStatus } from '@prisma/client';

export class CronWorkerService {
  private static isInitialized = false;

  public static init() {
    if (CronWorkerService.isInitialized) return;
    CronWorkerService.isInitialized = true;

    logger.info('⏰ Registering background cron workers...');

    // 1. Monthly Rent Invoice Generation Worker (runs midnight 1st of month)
    cron.schedule('0 0 1 * *', async () => {
      logger.info('🔄 [Cron Worker] Running Monthly Rent Invoice Generator...');
      await CronWorkerService.generateMonthlyRentInvoices();
    });

    // 2. Daily Late Fee & Penalty Calculation Worker (runs daily at 2:00 AM)
    cron.schedule('0 2 * * *', async () => {
      logger.info('🔄 [Cron Worker] Running Daily Late Fee Calculation...');
      await CronWorkerService.applyLateFees();
    });

    // 3. Hourly Complaint SLA Escalation Worker (runs every hour at minute 0)
    cron.schedule('0 * * * *', async () => {
      logger.info('🔄 [Cron Worker] Running Hourly Complaint SLA Escalator...');
      await CronWorkerService.escalateOverdueComplaints();
    });

    logger.info('✅ Background cron workers initialized successfully.');
  }

  public static async generateMonthlyRentInvoices() {
    try {
      const activeResidents = await prisma.resident.findMany({
        where: { status: ResidentStatus.ACTIVE }
      });

      let generatedCount = 0;
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

      for (const res of activeResidents) {
        if (!res.pgId) continue;

        try {
          const existingInvoice = await prisma.payment.findFirst({
            where: {
              residentId: res.id,
              invoiceNumber: { contains: currentMonth }
            }
          });

          if (!existingInvoice) {
            const rentAmount = 12000; // Standard monthly rent base
            const uniqueSuffix = res.id.slice(-6).toUpperCase();
            const invoiceNumber = `INV-${currentMonth}-${uniqueSuffix}`;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 5);

            await prisma.payment.create({
              data: {
                invoiceNumber,
                residentId: res.id,
                pgId: res.pgId,
                baseAmount: rentAmount,
                cgstAmount: parseFloat((rentAmount * 0.09).toFixed(2)),
                sgstAmount: parseFloat((rentAmount * 0.09).toFixed(2)),
                igstAmount: 0,
                totalAmount: parseFloat((rentAmount * 1.18).toFixed(2)),
                paymentMethod: "SCHEDULED_AUTOMATED",
                status: PaymentStatus.PENDING,
                dueDate,
              }
            });
            generatedCount++;
          }
        } catch (resErr: any) {
          logger.error(`❌ [Monthly Invoice Cron] Failed for resident ${res.id}: ${resErr.message}`);
        }
      }

      logger.info(`✅ [Monthly Invoice Cron] Generated ${generatedCount} rent invoices for active residents.`);
    } catch (err: any) {
      logger.error(`❌ [Monthly Invoice Cron Error]: ${err.message}`);
    }
  }

  public static async applyLateFees() {
    try {
      const now = new Date();
      const overduePayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          dueDate: { lt: now }
        }
      });

      let updatedCount = 0;
      const LATE_FEE_FLAT = 250;
      const MAX_LATE_FEE = 1000; // Cap penalty at ₹1,000 max

      for (const pay of overduePayments) {
        try {
          // Check if late fee was already updated today (idempotency check)
          const lastUpdatedDate = pay.createdAt ? new Date(pay.createdAt).toDateString() : '';
          const todayDate = now.toDateString();

          if (pay.lateFee >= MAX_LATE_FEE || lastUpdatedDate === todayDate) {
            continue;
          }

          const newLateFee = Math.min(pay.lateFee + LATE_FEE_FLAT, MAX_LATE_FEE);
          const feeDifference = newLateFee - pay.lateFee;

          if (feeDifference > 0) {
            await prisma.payment.update({
              where: { id: pay.id },
              data: {
                lateFee: newLateFee,
                totalAmount: pay.totalAmount + feeDifference
              }
            });
            updatedCount++;
          }
        } catch (payErr: any) {
          logger.error(`❌ [Late Fee Cron] Failed for payment ${pay.id}: ${payErr.message}`);
        }
      }

      logger.info(`✅ [Late Fee Cron] Applied late fee penalties to ${updatedCount} overdue invoices.`);
    } catch (err: any) {
      logger.error(`❌ [Late Fee Cron Error]: ${err.message}`);
    }
  }

  public static async escalateOverdueComplaints() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleComplaints = await prisma.complaint.findMany({
        where: {
          status: TicketStatus.OPEN,
          createdAt: { lt: twentyFourHoursAgo }
        }
      });

      let escalatedCount = 0;
      for (const comp of staleComplaints) {
        await prisma.complaint.update({
          where: { id: comp.id },
          data: {
            priority: Priority.HIGH,
            status: TicketStatus.IN_PROGRESS
          }
        });
        escalatedCount++;
      }

      logger.info(`✅ [SLA Escalation Cron] Auto-escalated ${escalatedCount} stale complaints.`);
    } catch (err: any) {
      logger.error(`❌ [SLA Escalation Cron Error]: ${err.message}`);
    }
  }
}
