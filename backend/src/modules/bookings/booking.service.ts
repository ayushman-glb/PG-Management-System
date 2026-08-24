import { PrismaClient, Booking, BookingStatus, RoomType, BedStatus, RoomChangeStatus, AgreementStatus, InvoiceStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../../core/errors/CustomErrors';

export interface IApplyBookingDTO {
  residentId: string;
  pgId: string;
  roomId?: string;
  bedId?: string;
  roomType: RoomType;
  preferredMoveInDate: string;
  expectedStayMonths?: number;
}

export class BookingService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  // 16-state valid transition graph
  private validTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.APPLIED]: [BookingStatus.WAITING, BookingStatus.ACCEPTED, BookingStatus.REJECTED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
    [BookingStatus.WAITING]: [BookingStatus.ACCEPTED, BookingStatus.REJECTED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
    [BookingStatus.ACCEPTED]: [BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
    [BookingStatus.PAYMENT_PENDING]: [BookingStatus.PAYMENT_VERIFIED, BookingStatus.PAYMENT_FAILED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
    [BookingStatus.PAYMENT_VERIFIED]: [BookingStatus.ONBOARDING, BookingStatus.ROOM_ALLOCATION_PENDING, BookingStatus.ROOM_ALLOCATED, BookingStatus.CONFIRMED, BookingStatus.PAYMENT_REFUNDED],
    [BookingStatus.ONBOARDING]: [BookingStatus.ROOM_ALLOCATION_PENDING, BookingStatus.ROOM_ALLOCATED, BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.ROOM_ALLOCATION_PENDING]: [BookingStatus.ROOM_ALLOCATED, BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.ROOM_ALLOCATED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.NO_SHOW, BookingStatus.CANCELLED],
    [BookingStatus.REJECTED]: [],
    [BookingStatus.CANCELLED]: [BookingStatus.PAYMENT_REFUNDED],
    [BookingStatus.EXPIRED]: [],
    [BookingStatus.PAYMENT_FAILED]: [BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
    [BookingStatus.PAYMENT_REFUNDED]: [],
    [BookingStatus.NO_SHOW]: [],
    [BookingStatus.COMPLETED]: [],
  };

  async applyBooking(data: IApplyBookingDTO): Promise<Booking> {
    const pg = await this.db.pG.findUnique({
      where: { id: data.pgId },
      include: { rooms: { include: { beds: true } } },
    });

    if (!pg) throw new NotFoundError('PG property not found.');

    let rentAmount = pg.basePrice || 10000;
    let depositAmount = (pg.basePrice || 10000) * (pg.depositMonths || 1);

    if (data.roomId) {
      const room = pg.rooms.find((r) => r.id === data.roomId);
      if (room) {
        rentAmount = room.baseRent;
        depositAmount = room.depositAmount;
      }
    }

    if (data.bedId) {
      const bed = await this.db.bed.findUnique({ where: { id: data.bedId } });
      if (!bed || bed.status !== BedStatus.AVAILABLE) {
        throw new ConflictError('Selected bed is no longer available.');
      }
      rentAmount = bed.baseRent;
      depositAmount = bed.depositAmount;
    }

    const booking = await this.db.booking.create({
      data: {
        residentId: data.residentId,
        pgId: data.pgId,
        roomId: data.roomId,
        bedId: data.bedId,
        roomType: data.roomType,
        preferredMoveInDate: new Date(data.preferredMoveInDate),
        expectedStayMonths: data.expectedStayMonths || 6,
        status: BookingStatus.APPLIED,
        rentAmount,
        depositAmount,
      },
      include: {
        pg: { select: { name: true, location: true } },
        room: true,
        bed: true,
      },
    });

    await this.db.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: BookingStatus.APPLIED,
        toStatus: BookingStatus.APPLIED,
        changedById: data.residentId,
        reason: 'Initial booking application submitted by resident.',
      },
    });

    return booking;
  }

  async getOwnerKanban(ownerId: string, pgId?: string): Promise<Record<string, Booking[]>> {
    const where: any = {
      pg: { ownerId },
    };
    if (pgId) where.pgId = pgId;

    const bookings = await this.db.booking.findMany({
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
        pg: { select: { id: true, name: true, location: true } },
        room: true,
        bed: true,
        payments: true,
        roomAllocations: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const kanban: Record<string, Booking[]> = {
      APPLIED: [],
      WAITING: [],
      ACCEPTED: [],
      PAYMENT_PENDING: [],
      PAYMENT_VERIFIED: [],
      ONBOARDING: [],
      ROOM_ALLOCATION: [],
      CONFIRMED: [],
    };

    for (const b of bookings) {
      if (b.status === BookingStatus.APPLIED) kanban.APPLIED.push(b);
      else if (b.status === BookingStatus.WAITING) kanban.WAITING.push(b);
      else if (b.status === BookingStatus.ACCEPTED) kanban.ACCEPTED.push(b);
      else if (b.status === BookingStatus.PAYMENT_PENDING) kanban.PAYMENT_PENDING.push(b);
      else if (b.status === BookingStatus.PAYMENT_VERIFIED) kanban.PAYMENT_VERIFIED.push(b);
      else if (b.status === BookingStatus.ONBOARDING) kanban.ONBOARDING.push(b);
      else if (b.status === BookingStatus.ROOM_ALLOCATION_PENDING || b.status === BookingStatus.ROOM_ALLOCATED) kanban.ROOM_ALLOCATION.push(b);
      else if (b.status === BookingStatus.CONFIRMED) kanban.CONFIRMED.push(b);
    }

    return kanban;
  }

  async updateBookingStatus(bookingId: string, actorId: string, actorRole: Role, toStatus: BookingStatus, reason?: string): Promise<Booking> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { pg: true },
    });

    if (!booking) throw new NotFoundError('Booking record not found.');

    // Authorization
    if (actorRole === Role.PG_OWNER && booking.pg.ownerId !== actorId) {
      throw new ForbiddenError('You do not own the property associated with this booking.');
    }
    if (actorRole === Role.RESIDENT && booking.residentId !== actorId && toStatus !== BookingStatus.CANCELLED) {
      throw new ForbiddenError('You are not authorized to update this booking.');
    }

    // State machine check
    const allowed = this.validTransitions[booking.status];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestError(`Invalid state transition from ${booking.status} to ${toStatus}.`);
    }

    const updated = await this.db.booking.update({
      where: { id: bookingId },
      data: {
        status: toStatus,
        rejectionReason: toStatus === BookingStatus.REJECTED ? reason : booking.rejectionReason,
        cancellationReason: toStatus === BookingStatus.CANCELLED ? reason : booking.cancellationReason,
      },
      include: { resident: true, pg: true, room: true, bed: true },
    });

    await this.db.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus,
        changedById: actorId,
        reason: reason || `Status transitioned to ${toStatus}`,
      },
    });

    return updated;
  }

  async allocateRoomAndBed(bookingId: string, ownerId: string, floorId: string, roomId: string, bedId: string): Promise<any> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { pg: true },
    });

    if (!booking) throw new NotFoundError('Booking not found.');
    if (booking.pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this PG.');

    // Transaction safe allocation
    const result = await this.db.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({
        where: { id: bedId },
        include: { room: true },
      });

      if (!bed) throw new NotFoundError('Selected bed not found.');
      if (bed.status !== BedStatus.AVAILABLE) {
        throw new ConflictError(`Bed ${bed.bedNumber} is currently ${bed.status} and cannot be allocated.`);
      }
      if (bed.roomId !== roomId) {
        throw new BadRequestError('Bed does not belong to the specified room.');
      }
      if (bed.pgId !== booking.pgId) {
        throw new BadRequestError('Bed does not belong to this PG property.');
      }

      // 1. Mark bed occupied
      await tx.bed.update({
        where: { id: bedId },
        data: {
          status: BedStatus.OCCUPIED,
          currentResidentId: booking.residentId,
        },
      });

      // 2. Deactivate any prior active allocations for this resident and free prior beds
      const priorAllocations = await tx.roomAllocation.findMany({
        where: { residentId: booking.residentId, isActive: true },
      });
      for (const prior of priorAllocations) {
        if (prior.bedId && prior.bedId !== bedId) {
          await tx.bed.update({
            where: { id: prior.bedId },
            data: { status: BedStatus.AVAILABLE, currentResidentId: null },
          });
        }
      }
      await tx.roomAllocation.updateMany({
        where: { residentId: booking.residentId, isActive: true },
        data: { isActive: false, checkOutDate: new Date() },
      });

      // 3. Create room allocation record
      const allocation = await tx.roomAllocation.create({
        data: {
          bookingId: booking.id,
          residentId: booking.residentId,
          pgId: booking.pgId,
          floorId,
          roomId,
          bedId,
          rent: bed.baseRent,
          deposit: bed.depositAmount,
          checkInDate: booking.preferredMoveInDate,
          isActive: true,
          allocatedById: ownerId,
        },
      });

      // 4. Transition booking to CONFIRMED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          roomId,
          bedId,
          status: BookingStatus.CONFIRMED,
        },
      });

      // 5. Generate Lease Agreement
      const agreementEndDate = new Date(booking.preferredMoveInDate);
      agreementEndDate.setMonth(agreementEndDate.getMonth() + (booking.expectedStayMonths || 11));

      const agreement = await tx.agreement.create({
        data: {
          bookingId: booking.id,
          residentId: booking.residentId,
          ownerId,
          pgId: booking.pgId,
          allocationId: allocation.id,
          agreementNumber: `RB-AGR-${Date.now().toString().slice(-6)}`,
          status: AgreementStatus.PENDING_SIGNATURE,
          rentAmount: bed.baseRent,
          depositAmount: bed.depositAmount,
          lockInPeriodMonths: 3,
          noticePeriodDays: booking.pg.noticePeriodDays || 30,
          startDate: booking.preferredMoveInDate,
          endDate: agreementEndDate,
        },
      });

      // 6. Setup Rent Schedule
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      nextBilling.setDate(1);

      await tx.rentSchedule.create({
        data: {
          residentId: booking.residentId,
          pgId: booking.pgId,
          roomId,
          bedId,
          monthlyRent: bed.baseRent,
          billingDayOfMonth: 1,
          dueDayOfMonth: 5,
          graceDays: 5,
          lateFinePerDay: 50,
          maxFineAmount: 1000,
          isActive: true,
          nextBillingDate: nextBilling,
        },
      });

      return {
        booking: updatedBooking,
        allocation,
        agreement,
      };
    });

    return result;
  }

  async getResidentBookings(residentId: string): Promise<any[]> {
    return await this.db.booking.findMany({
      where: { residentId },
      include: {
        pg: {
          include: {
            location: true,
            images: true,
            owner: { select: { id: true, username: true, phone: true, email: true } },
          },
        },
        room: true,
        bed: true,
        agreements: true,
        roomAllocations: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestRoomChange(residentId: string, currentAllocationId: string, requestedRoomType: RoomType, reason: string): Promise<any> {
    const allocation = await this.db.roomAllocation.findUnique({
      where: { id: currentAllocationId },
      include: { bed: true },
    });

    if (!allocation || allocation.residentId !== residentId || !allocation.isActive) {
      throw new BadRequestError('Active room allocation not found for this resident.');
    }

    return await this.db.roomChangeRequest.create({
      data: {
        residentId,
        currentAllocationId,
        currentBedId: allocation.bedId,
        requestedPgId: allocation.pgId,
        requestedRoomType,
        reason,
        status: RoomChangeStatus.REQUESTED,
      },
    });
  }
}
