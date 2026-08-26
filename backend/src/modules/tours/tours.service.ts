import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors/CustomErrors';
import { TourStatus, TourType } from '@prisma/client';

export interface CreateTourInput {
  propertyId: string;
  requestedSlot: string;
  tourType?: TourType;
  notes?: string;
}

export class TourService {
  async requestTour(userId: string, data: CreateTourInput) {
    const pgId = data.propertyId;
    if (!pgId) throw new BadRequestError('Property ID is required.');
    if (!data.requestedSlot) throw new BadRequestError('Requested slot time is required.');

    const slotDate = new Date(data.requestedSlot);
    if (isNaN(slotDate.getTime())) {
      throw new BadRequestError('Invalid requested slot datetime format.');
    }

    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
      include: { owner: true },
    });
    if (!pg) throw new NotFoundError('Property not found.');

    const tour = await prisma.tourBooking.create({
      data: {
        userId,
        pgId,
        requestedSlot: slotDate,
        tourType: data.tourType || TourType.PHYSICAL,
        notes: data.notes,
        status: TourStatus.REQUESTED,
      },
      include: {
        pg: {
          include: {
            location: true,
            images: { take: 1 },
          },
        },
      },
    });

    return tour;
  }

  async getTours(userId: string, role: string) {
    if (role === 'PG_OWNER') {
      const ownedPGs = await prisma.pG.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const pgIds = ownedPGs.map((p) => p.id);

      return prisma.tourBooking.findMany({
        where: { pgId: { in: pgIds } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: true,
            },
          },
          pg: {
            include: {
              location: true,
              images: { take: 1 },
            },
          },
        },
        orderBy: { requestedSlot: 'desc' },
      });
    }

    // Default for Applicant / Resident
    return prisma.tourBooking.findMany({
      where: { userId },
      include: {
        pg: {
          include: {
            location: true,
            images: { take: 1 },
          },
        },
      },
      orderBy: { requestedSlot: 'desc' },
    });
  }

  async updateTourStatus(tourId: string, userId: string, role: string, data: { status: TourStatus; ownerNotes?: string; requestedSlot?: string }) {
    const tour = await prisma.tourBooking.findUnique({
      where: { id: tourId },
      include: { pg: true },
    });
    if (!tour) throw new NotFoundError('Tour booking not found.');

    // Authorization check
    if (role === 'PG_OWNER' && tour.pg.ownerId !== userId) {
      throw new ForbiddenError('You are not authorized to manage tours for this property.');
    } else if (role !== 'PG_OWNER' && role !== 'ADMIN' && tour.userId !== userId) {
      throw new ForbiddenError('You are not authorized to modify this tour.');
    }

    // State machine validation
    if (tour.status === TourStatus.COMPLETED && data.status !== TourStatus.COMPLETED) {
      throw new BadRequestError('Completed tours cannot be modified.');
    }
    if (tour.status === TourStatus.CANCELLED && data.status !== TourStatus.CANCELLED) {
      throw new BadRequestError('Cancelled tours cannot be reopened.');
    }

    const updated = await prisma.tourBooking.update({
      where: { id: tourId },
      data: {
        status: data.status,
        ownerNotes: data.ownerNotes !== undefined ? data.ownerNotes : tour.ownerNotes,
        requestedSlot: data.requestedSlot ? new Date(data.requestedSlot) : tour.requestedSlot,
      },
      include: {
        pg: {
          include: { location: true },
        },
      },
    });

    return updated;
  }
}
