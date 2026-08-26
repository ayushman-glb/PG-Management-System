import { prisma } from '../config/prisma';
import { ComplaintStatus, PaymentStatus, PassStatus, InvoiceStatus } from '@prisma/client';
import { logger } from '../utils/logger';

export class CronWorkerService {
  public static init(): void {
    logger.info('⏰ [CronWorkerService] Background cron workers initialized.');
  }

  public static async generateMonthlyRentInvoices() {
    try {
      const activeResidents = await (prisma as any).resident.findMany({
        where: { status: 'ACTIVE' },
        include: { user: true, bed: { include: { room: true } }, pg: true },
      });

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const dueDate = new Date(currentYear, currentMonth, 5); // 5th of current month

      let generatedCount = 0;

      for (const resident of activeResidents) {
        try {
          const existingInvoice = await (prisma as any).payment.findFirst({
            where: {
              payerId: resident.userId,
              pgId: resident.pgId,
              createdAt: {
                gte: new Date(currentYear, currentMonth, 1),
                lt: new Date(currentYear, currentMonth + 1, 1),
              },
            },
          });

          if (!existingInvoice) {
            const rentAmount = resident.bed?.room?.price || 10000;
            const invoiceNumber = `INV-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${resident.id.slice(-6)}`;

            await (prisma as any).payment.create({
              data: {
                payerId: resident.userId,
                pgId: resident.pgId,
                amount: rentAmount,
                totalAmount: rentAmount,
                lateFee: 0,
                status: PaymentStatus.INITIATED,
                invoiceNumber,
                dueDate,
              },
            });
            generatedCount++;
          }
        } catch (resErr: any) {
          logger.error(`❌ [Cron Monthly Invoices] Error generating invoice for resident ${resident.id}: ${resErr.message}`);
        }
      }

      logger.info(`✅ [Cron Monthly Invoices] Successfully generated ${generatedCount} rent invoices.`);
    } catch (err: any) {
      logger.error(`❌ [Cron Monthly Invoices Fatal Error]: ${err.message}`);
    }
  }

  public static async applyLateFees() {
    try {
      const now = new Date();
      const overduePayments = await (prisma as any).payment.findMany({
        where: {
          status: { in: [PaymentStatus.INITIATED, PaymentStatus.PENDING_VERIFICATION] },
          dueDate: { lt: now },
        },
      });

      let updatedCount = 0;

      for (const payment of overduePayments) {
        try {
          const daysOverdue = Math.floor((now.getTime() - new Date(payment.dueDate || payment.createdAt).getTime()) / (1000 * 60 * 60 * 24));

          if (daysOverdue > 0) {
            const currentLateFee = payment.lateFee || 0;
            const maxLateFee = 1000;

            if (currentLateFee < maxLateFee) {
              const calculatedLateFee = Math.min(maxLateFee, 250 * Math.ceil(daysOverdue / 5));
              const lateFeeDiff = calculatedLateFee - currentLateFee;

              if (lateFeeDiff > 0) {
                const baseAmount = payment.totalAmount !== undefined && payment.totalAmount > 0
                  ? (payment.totalAmount - (payment.lateFee || 0))
                  : (payment.amount || 0);
                await (prisma as any).payment.update({
                  where: { id: payment.id },
                  data: {
                    lateFee: calculatedLateFee,
                    totalAmount: baseAmount + calculatedLateFee,
                  },
                });
                updatedCount++;
              }
            }
          }
        } catch (payErr: any) {
          logger.error(`❌ [Cron Late Fees] Error updating payment ${payment.id}: ${payErr.message}`);
        }
      }

      logger.info(`✅ [Cron Late Fees] Applied late fees to ${updatedCount} overdue invoices.`);
    } catch (err: any) {
      logger.error(`❌ [Cron Late Fees Fatal Error]: ${err.message}`);
    }
  }

  public static async escalateOverdueComplaints() {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const overdueComplaints = await (prisma as any).complaint.findMany({
        where: {
          status: ComplaintStatus.OPEN,
          createdAt: { lt: fortyEightHoursAgo },
        },
      });

      let escalatedCount = 0;

      for (const complaint of overdueComplaints) {
        await (prisma as any).complaint.update({
          where: { id: complaint.id },
          data: {
            priority: 'HIGH',
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

  public static async expireStalePasses() {
    try {
      const now = new Date();
      let visitorCount = 0;
      let gateCount = 0;

      if ((prisma as any).visitorPass?.updateMany) {
        const expiredVisitors = await (prisma as any).visitorPass.updateMany({
          where: {
            expiresAt: { lt: now },
            status: { in: [PassStatus.APPROVED, PassStatus.PENDING] },
          },
          data: { status: PassStatus.EXPIRED },
        });
        visitorCount = expiredVisitors?.count || 0;
      }

      if ((prisma as any).gatePass?.updateMany) {
        const expiredGate = await (prisma as any).gatePass.updateMany({
          where: {
            expiresAt: { lt: now },
            status: { in: [PassStatus.APPROVED, PassStatus.PENDING] },
          },
          data: { status: PassStatus.EXPIRED },
        });
        gateCount = expiredGate?.count || 0;
      }

      logger.info(`✅ [Pass Expiration Cron] Expired ${visitorCount} visitor passes and ${gateCount} gate passes.`);
    } catch (err: any) {
      logger.error(`❌ [Pass Expiration Cron Error]: ${err.message}`);
    }
  }

  public static async processAccountDeletions() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pendingDeletions = await prisma.user.findMany({
        where: {
          deletionRequested: true,
          deletionRequestedAt: { lt: thirtyDaysAgo },
          isActive: false,
        },
        include: {
          invoices: { where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } } },
          roomAllocations: { where: { isActive: true } },
        },
      });

      let anonymizedCount = 0;
      for (const user of pendingDeletions) {
        if (user.invoices.length === 0 && user.roomAllocations.length === 0) {
          const anonId = user.id.slice(-6);
          const ops: any[] = [];
          if ((prisma as any).userProfile?.updateMany) {
            ops.push(
              (prisma as any).userProfile.updateMany({
                where: { userId: user.id },
                data: {
                  firstName: 'Former',
                  lastName: `Resident_${anonId}`,
                  avatarUrl: null,
                  emergencyContact: null,
                },
              })
            );
          }
          ops.push(
            prisma.user.update({
              where: { id: user.id },
              data: {
                email: `anonymized_${user.id}@deleted.roombae.com`,
                phone: `+910000${anonId}`,
                username: `user_${anonId}`,
                isSuspended: true,
                deletionRequested: false,
              },
            })
          );
          await prisma.$transaction(ops);
          anonymizedCount++;
        }
      }

      logger.info(`✅ [Account Deletion Cron] Anonymized ${anonymizedCount} eligible accounts.`);
    } catch (err: any) {
      logger.error(`❌ [Account Deletion Cron Error]: ${err.message}`);
    }
  }
}
