import { PrismaClient, RoomAllocation, AgreementStatus, BedStatus, RefundStatus, RefundReason, InvoiceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export class MoveOutService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async requestMoveOut(residentId: string, allocationOrBookingId: string, requestedDate: string, reason: string): Promise<any> {
    let allocation = await this.db.roomAllocation.findFirst({
      where: {
        OR: [
          { id: allocationOrBookingId },
          { bookingId: allocationOrBookingId },
          { residentId, isActive: true },
        ],
      },
      include: { pg: true, bed: true, room: true },
    });

    if (!allocation || allocation.residentId !== residentId) {
      throw new BadRequestError('Active room allocation not found.');
    }

    // Check unpaid invoices
    const unpaidInvoices = await this.db.invoice.findMany({
      where: {
        residentId,
        pgId: allocation.pgId,
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID] },
      },
    });

    const pendingDues = unpaidInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

    return {
      allocationId: allocation.id,
      residentId,
      pgName: allocation.pg.name,
      roomNumber: allocation.room.roomNumber,
      bedNumber: allocation.bed.bedNumber,
      depositAmount: allocation.deposit,
      pendingDues,
      requestedMoveOutDate: requestedDate ? new Date(requestedDate) : new Date(),
      reason: reason || 'End of stay',
      status: 'MOVE_OUT_REQUESTED',
    };
  }

  async settleAndReleaseCheckout(ownerId: string, allocationOrBookingId: string, deductions: number = 0, deductionReason?: string): Promise<any> {
    let allocation = await this.db.roomAllocation.findFirst({
      where: {
        OR: [
          { id: allocationOrBookingId },
          { bookingId: allocationOrBookingId },
        ],
      },
      include: { pg: true, bed: true, booking: true },
    });

    if (!allocation) throw new NotFoundError('Allocation record not found.');
    if (allocation.pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this PG.');

    // Transaction-safe settlement
    return await this.db.$transaction(async (tx) => {
      // 1. Release Bed
      await tx.bed.update({
        where: { id: allocation.bedId },
        data: {
          status: BedStatus.AVAILABLE,
          currentResidentId: null,
        },
      });

      // 2. Mark Allocation inactive
      await tx.roomAllocation.update({
        where: { id: allocation.id },
        data: {
          isActive: false,
          checkOutDate: new Date(),
        },
      });

      // 3. Close Agreement
      await tx.agreement.updateMany({
        where: { allocationId: allocation.id },
        data: { status: AgreementStatus.TERMINATED },
      });

      // 4. Calculate Deposit Refund
      const netRefundAmount = Math.max(0, allocation.deposit - deductions);

      if (netRefundAmount > 0) {
        await tx.refund.create({
          data: {
            bookingId: allocation.bookingId,
            residentId: allocation.residentId,
            pgId: allocation.pgId,
            amount: netRefundAmount,
            reason: RefundReason.MOVE_OUT_DEPOSIT,
            status: RefundStatus.APPROVED,
            approvedById: ownerId,
            notes: deductionReason ? `Deductions: ₹${deductions} (${deductionReason})` : 'Full deposit settled upon move-out.',
          },
        });
      }

      // 5. Deactivate rent schedule
      await tx.rentSchedule.updateMany({
        where: { residentId: allocation.residentId, pgId: allocation.pgId },
        data: { isActive: false },
      });

      return {
        success: true,
        message: 'Move-out checkout settled successfully. Bed released and agreement closed.',
        deposit: allocation.deposit,
        deductions,
        netRefundAmount,
      };
    });
  }

  async getMoveOutRequests(pgId?: string) {
    const where: any = { isActive: false };
    if (pgId) where.pgId = pgId;

    const allocations = await this.db.roomAllocation.findMany({
      where,
      include: { resident: { include: { profile: true } }, room: true, bed: true, pg: true },
      orderBy: { checkOutDate: 'desc' },
      take: 50,
    });

    return allocations.map((a) => ({
      allocationId: a.id,
      bookingId: a.bookingId,
      residentId: a.residentId,
      residentName: a.resident.profile ? `${a.resident.profile.firstName} ${a.resident.profile.lastName}` : a.resident.email,
      pgName: a.pg.name,
      roomNumber: a.room.roomNumber,
      bedNumber: a.bed.bedNumber,
      deposit: a.deposit,
      checkOutDate: a.checkOutDate,
    }));
  }
}
