import { PrismaClient, RoomAllocation, AgreementStatus, BedStatus, RefundStatus, RefundReason, InvoiceStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export class MoveInService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async getTenantDashboardSummary(residentId: string): Promise<any> {
    const user = await this.db.user.findUnique({
      where: { id: residentId },
      include: { profile: true },
    });

    const activeAllocation = await this.db.roomAllocation.findFirst({
      where: { residentId, isActive: true },
      include: {
        pg: {
          include: {
            location: true,
            owner: {
              select: { id: true, email: true, phone: true, username: true, profile: true },
            },
          },
        },
        room: true,
        bed: true,
        floor: true,
      },
    });

    const latestBooking = await this.db.booking.findFirst({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
      include: {
        pg: {
          include: {
            location: true,
            owner: { select: { id: true, email: true, phone: true, username: true, profile: true } },
          },
        },
        room: true,
        bed: true,
      },
    });

    const agreement = await this.db.agreement.findFirst({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
    });

    const kycDoc = await this.db.document.findFirst({
      where: { userId: residentId },
      orderBy: { createdAt: 'desc' },
    });

    const unpaidInvoices = await this.db.invoice.findMany({
      where: {
        residentId,
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID] },
      },
      include: { items: true },
      orderBy: { dueDate: 'asc' },
    });

    const targetPG = activeAllocation?.pg || latestBooking?.pg;

    return {
      resident: {
        id: residentId,
        name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.username || 'Resident',
        email: user?.email,
        phone: user?.phone,
        pgId: targetPG?.id,
        pgName: targetPG?.name,
        roomNumber: activeAllocation?.room?.roomNumber || latestBooking?.room?.roomNumber || 'TBD',
        bedNumber: activeAllocation?.bed?.bedNumber || latestBooking?.bed?.bedNumber || 'TBD',
        monthlyRent: activeAllocation?.rent || latestBooking?.rentAmount || targetPG?.basePrice || 8500,
        securityDeposit: activeAllocation?.deposit || latestBooking?.depositAmount || targetPG?.basePrice || 8500,
      },
      allocation: activeAllocation,
      booking: latestBooking,
      agreement: {
        id: agreement?.id,
        agreementNumber: agreement?.agreementNumber,
        status: agreement?.status || AgreementStatus.DRAFT,
        pdfUrl: agreement?.agreementPdfUrl,
      },
      kyc: {
        status: kycDoc?.status || (user?.isProfileComplete ? VerificationStatus.VERIFIED : VerificationStatus.PENDING),
        documentType: kycDoc?.documentType,
        fileUrl: kycDoc?.fileUrl,
      },
      invoices: unpaidInvoices,
      totalPendingDues: unpaidInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
      propertyContacts: {
        ownerName: targetPG?.owner?.username || 'Property Manager',
        ownerPhone: targetPG?.owner?.phone || targetPG?.contactPhone || '+91 98765 43210',
        ownerEmail: targetPG?.owner?.email || targetPG?.contactEmail || 'support@roombae.com',
        gateClosingTime: targetPG?.gateClosingTime || '10:30 PM',
        rules: targetPG?.rules || [
          'Visitors allowed between 9:00 AM and 8:00 PM with valid gate pass',
          'Quiet hours observed after 10:30 PM',
          'Maintain cleanliness in common areas',
        ],
      },
    };
  }

  async getMoveInInfo(propertyId: string): Promise<any> {
    const pg = await this.db.pG.findUnique({
      where: { id: propertyId },
      include: {
        location: true,
        images: { take: 3 },
        owner: { select: { id: true, username: true, phone: true, email: true } },
      },
    });

    if (!pg) throw new NotFoundError('Property not found.');

    return {
      propertyId: pg.id,
      name: pg.name,
      address: pg.location ? `${pg.location.address}, ${pg.location.locality}, ${pg.location.city}` : '',
      city: pg.location?.city || '',
      gateClosingTime: pg.gateClosingTime || '10:30 PM',
      noticePeriodDays: pg.noticePeriodDays || 30,
      rules: pg.rules || [],
      contactPhone: pg.contactPhone || pg.owner?.phone,
      contactEmail: pg.contactEmail || pg.owner?.email,
      moveInChecklist: [
        { id: '1', title: 'Submit Government ID Proof (Aadhaar/Passport)', completed: true },
        { id: '2', title: 'Pay First Month Rent & Security Deposit', completed: true },
        { id: '3', title: 'Sign Digital Rental Agreement', completed: true },
        { id: '4', title: 'Collect Room Keys & Access Pass from Gate Desk', completed: false },
        { id: '5', title: 'Verify Inventory & Room Fixtures', completed: false },
      ],
    };
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

    return await this.db.$transaction(async (tx) => {
      await tx.bed.update({
        where: { id: allocation.bedId },
        data: {
          status: BedStatus.AVAILABLE,
          currentResidentId: null,
        },
      });

      await tx.roomAllocation.update({
        where: { id: allocation.id },
        data: {
          isActive: false,
          checkOutDate: new Date(),
        },
      });

      await tx.agreement.updateMany({
        where: { allocationId: allocation.id },
        data: { status: AgreementStatus.TERMINATED },
      });

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
            notes: deductionReason || `Settled checkout with deposit deduction of ₹${deductions}`,
          },
        });
      }

      return {
        success: true,
        message: 'Resident checkout processed and bed released successfully.',
        netRefundAmount,
      };
    });
  }

  async getMoveOutRequests(ownerId: string, pgId?: string): Promise<any[]> {
    const where: any = { isActive: true };
    if (pgId) {
      where.pgId = pgId;
    } else {
      const pgs = await this.db.pG.findMany({
        where: { ownerId },
        select: { id: true },
      });
      where.pgId = { in: pgs.map((p) => p.id) };
    }

    const allocations = await this.db.roomAllocation.findMany({
      where,
      include: {
        resident: {
          select: {
            id: true,
            email: true,
            phone: true,
            username: true,
            profile: true,
          },
        },
        pg: true,
        room: true,
        bed: true,
      },
    });

    return allocations.map((a) => ({
      allocationId: a.id,
      bookingId: a.bookingId,
      residentId: a.residentId,
      residentName: a.resident.profile ? `${a.resident.profile.firstName} ${a.resident.profile.lastName}` : a.resident.username,
      residentPhone: a.resident.phone,
      pgName: a.pg.name,
      roomNumber: a.room.roomNumber,
      bedNumber: a.bed.bedNumber,
      depositAmount: a.deposit,
      checkInDate: a.checkInDate,
      requestedMoveOutDate: new Date(),
    }));
  }
}

// Alias for backward-compatibility
export const MoveOutService = MoveInService;
