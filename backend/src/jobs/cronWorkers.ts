import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { ComplaintStatus, ComplaintPriority, InvoiceStatus } from '@prisma/client';
import { BillingService } from '../modules/billing/billing.service';

export class CronWorkerService {
  private static isInitialized = false;
  private static billingService = new BillingService();

  public static init() {
    if (CronWorkerService.isInitialized) return;
    CronWorkerService.isInitialized = true;

    logger.info('⏰ Registering background cron workers...');

    // 1. Monthly Rent Invoice Generation (runs midnight 1st of every month)
    cron.schedule('0 0 1 * *', async () => {
      logger.info('🔄 [Cron Worker] Running Monthly Rent Invoice Generator...');
      await CronWorkerService.generateMonthlyRentInvoices();
    });

    // 2. Daily Late Fee & Penalty Calculation (runs daily at 2:00 AM)
    cron.schedule('0 2 * * *', async () => {
      logger.info('🔄 [Cron Worker] Running Daily Late Fee Calculation...');
      await CronWorkerService.applyLateFees();
    });

    // 3. Hourly Complaint Escalator (runs every hour)
    cron.schedule('0 * * * *', async () => {
      logger.info('🔄 [Cron Worker] Running Hourly Complaint SLA Escalator...');
      await CronWorkerService.escalateOverdueComplaints();
    });

    logger.info('✅ Background cron workers initialized successfully.');
  }

  public static async generateMonthlyRentInvoices() {
    try {
      const activeAllocations = await prisma.roomAllocation.findMany({
        where: { isActive: true },
      });

      let generatedCount = 0;
      for (const alloc of activeAllocations) {
        try {
          await CronWorkerService.billingService.generateMonthlyInvoice(alloc.residentId, alloc.pgId);
          generatedCount++;
        } catch (resErr: any) {
          logger.error(`❌ [Monthly Invoice Cron] Failed for resident ${alloc.residentId}: ${resErr.message}`);
        }
      }

      logger.info(`✅ [Monthly Invoice Cron] Generated/checked ${generatedCount} rent invoices.`);
    } catch (err: any) {
      logger.error(`❌ [Monthly Invoice Cron Error]: ${err.message}`);
    }
  }

  public static async applyLateFees() {
    try {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } },
      });

      let updatedCount = 0;
      for (const inv of unpaidInvoices) {
        try {
          await CronWorkerService.billingService.calculateAndApplyFine(inv.id);
          updatedCount++;
        } catch (err: any) {
          logger.error(`❌ [Late Fee Cron] Failed for invoice ${inv.id}: ${err.message}`);
        }
      }

      logger.info(`✅ [Late Fee Cron] Checked ${updatedCount} unpaid invoices for late fee application.`);
    } catch (err: any) {
      logger.error(`❌ [Late Fee Cron Error]: ${err.message}`);
    }
  }

  public static async escalateOverdueComplaints() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleComplaints = await prisma.complaint.findMany({
        where: {
          status: ComplaintStatus.OPEN,
          createdAt: { lt: twentyFourHoursAgo },
        },
      });

      let escalatedCount = 0;
      for (const comp of staleComplaints) {
        await prisma.complaint.update({
          where: { id: comp.id },
          data: {
            priority: ComplaintPriority.HIGH,
            status: ComplaintStatus.IN_PROGRESS,
          },
        });
        escalatedCount++;
      }

      logger.info(`✅ [SLA Escalation Cron] Auto-escalated ${escalatedCount} stale complaints.`);
    } catch (err: any) {
      logger.error(`❌ [SLA Escalation Cron Error]: ${err.message}`);
    }
  }
}
