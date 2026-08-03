import { PrismaClient, FineType, FineCalculationType, FineStatus } from '@prisma/client';
import { IFineEngineService, CreateFineRulePayload, IssueFinePayload } from './IFineEngineService';

export class FineEngineService implements IFineEngineService {
  constructor(private readonly prisma: PrismaClient) {}

  async createFineRule(payload: CreateFineRulePayload): Promise<any> {
    return this.prisma.fineRule.create({
      data: {
        pgId: payload.pgId,
        fineType: payload.fineType as FineType,
        calculationType: payload.calculationType as FineCalculationType,
        amount: payload.amount,
        percentage: payload.percentage,
        perDayRate: payload.perDayRate,
        maxFineAmount: payload.maxFineAmount,
        gracePeriodDays: payload.gracePeriodDays ?? 3
      }
    });
  }

  async getFineRulesByPG(pgId: string): Promise<any> {
    return this.prisma.fineRule.findMany({
      where: { pgId, isActive: true }
    });
  }

  async calculateLateRentFine(residentId: string, rentDueDate: Date, rentAmount: number): Promise<number> {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: { pg: { include: { fineRules: true } } }
    });

    if (!resident || !resident.pg) return 0;

    const lateRule = resident.pg.fineRules.find(r => r.fineType === 'LATE_RENT' && r.isActive);
    if (!lateRule) return 0;

    const now = new Date();
    const diffMs = now.getTime() - new Date(rentDueDate).getTime();
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysOverdue <= lateRule.gracePeriodDays) {
      return 0;
    }

    const billableDays = daysOverdue - lateRule.gracePeriodDays;
    let fine = 0;

    if (lateRule.calculationType === 'FLAT') {
      fine = lateRule.amount;
    } else if (lateRule.calculationType === 'PERCENTAGE') {
      fine = (rentAmount * (lateRule.percentage || 5)) / 100;
    } else if (lateRule.calculationType === 'PER_DAY') {
      fine = billableDays * (lateRule.perDayRate || 100);
    }

    if (lateRule.maxFineAmount && fine > lateRule.maxFineAmount) {
      fine = lateRule.maxFineAmount;
    }

    return fine;
  }

  async issueFine(payload: IssueFinePayload): Promise<any> {
    return this.prisma.fine.create({
      data: {
        residentId: payload.residentId,
        ruleId: payload.ruleId,
        fineType: payload.fineType as FineType,
        amount: payload.amount,
        reason: payload.reason,
        dueDate: new Date(payload.dueDate),
        status: FineStatus.UNPAID
      }
    });
  }

  async waiveFine(fineId: string, ownerId: string): Promise<any> {
    return this.prisma.fine.update({
      where: { id: fineId },
      data: {
        status: FineStatus.WAIVED,
        waivedBy: ownerId,
        waivedAt: new Date()
      }
    });
  }

  async getFinesByResident(residentId: string): Promise<any> {
    return this.prisma.fine.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
