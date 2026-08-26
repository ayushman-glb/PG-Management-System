import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors/CustomErrors';
import { ApplicationStatus, RoomType, BookingStatus } from '@prisma/client';

export interface CreateApplicationInput {
  propertyId: string;
  pgId?: string;
  roomType: RoomType;
  preferredMoveInDate: string;
  expectedStayMonths?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  kycData?: any;
  documents?: any;
}

export class ApplicationService {
  async createApplication(applicantId: string, data: CreateApplicationInput) {
    const pgId = data.propertyId || data.pgId;
    if (!pgId) throw new BadRequestError('Property ID is required.');
    if (!data.roomType) throw new BadRequestError('Room type is required.');
    if (!data.preferredMoveInDate) throw new BadRequestError('Preferred move-in date is required.');

    const moveInDate = new Date(data.preferredMoveInDate);
    if (isNaN(moveInDate.getTime())) {
      throw new BadRequestError('Invalid move-in date format.');
    }

    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
    });
    if (!pg) throw new NotFoundError('Property not found.');

    const monthlyRent = data.monthlyRent || pg.basePrice || 8500;
    const securityDeposit = data.securityDeposit || pg.basePrice * pg.depositMonths || 8500;

    const application = await prisma.application.create({
      data: {
        applicantId,
        pgId,
        roomType: data.roomType,
        preferredMoveInDate: moveInDate,
        expectedStayMonths: data.expectedStayMonths ? Number(data.expectedStayMonths) : 6,
        monthlyRent,
        securityDeposit,
        status: ApplicationStatus.SUBMITTED,
        kycData: data.kycData || {},
        documents: data.documents || {},
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

    return application;
  }

  async getApplications(userId: string, role: string) {
    if (role === 'PG_OWNER') {
      const ownedPGs = await prisma.pG.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const pgIds = ownedPGs.map((p) => p.id);

      return prisma.application.findMany({
        where: { pgId: { in: pgIds } },
        include: {
          applicant: {
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
        orderBy: { createdAt: 'desc' },
      });
    }

    // Default for Applicant / Resident
    return prisma.application.findMany({
      where: { applicantId: userId },
      include: {
        pg: {
          include: {
            location: true,
            images: { take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApplicationById(id: string, userId: string, role: string) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
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
            images: { take: 3 },
          },
        },
      },
    });

    if (!application) throw new NotFoundError('Rental application not found.');

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      if (role === 'PG_OWNER' && application.pg.ownerId !== userId) {
        throw new ForbiddenError('Unauthorized to view this application.');
      } else if (role !== 'PG_OWNER' && application.applicantId !== userId) {
        throw new ForbiddenError('Unauthorized to view this application.');
      }
    }

    return application;
  }

  async updateApplicationStatus(
    id: string,
    userId: string,
    role: string,
    data: { status: ApplicationStatus; rejectionReason?: string }
  ) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { pg: true },
    });
    if (!application) throw new NotFoundError('Rental application not found.');

    if (role === 'PG_OWNER' && application.pg.ownerId !== userId) {
      throw new ForbiddenError('Unauthorized to update this application.');
    } else if (role !== 'PG_OWNER' && role !== 'ADMIN' && application.applicantId !== userId) {
      throw new ForbiddenError('Unauthorized to update this application.');
    }

    if (data.status === ApplicationStatus.REJECTED && !data.rejectionReason) {
      throw new BadRequestError('A rejection reason is mandatory when rejecting an application.');
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: data.status,
        rejectionReason: data.rejectionReason || application.rejectionReason,
      },
    });

    // If approved, create or transition corresponding Booking record
    if (data.status === ApplicationStatus.APPROVED || data.status === ApplicationStatus.PAYMENT_PENDING) {
      const existingBooking = await prisma.booking.findFirst({
        where: {
          residentId: application.applicantId,
          pgId: application.pgId,
        },
      });

      if (!existingBooking) {
        await prisma.booking.create({
          data: {
            residentId: application.applicantId,
            pgId: application.pgId,
            roomType: application.roomType,
            preferredMoveInDate: application.preferredMoveInDate,
            expectedStayMonths: application.expectedStayMonths,
            rentAmount: application.monthlyRent,
            depositAmount: application.securityDeposit,
            status: BookingStatus.PAYMENT_PENDING,
          },
        });
      }
    }

    return updated;
  }

  async uploadDocument(id: string, userId: string, docData: any) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundError('Application not found.');
    if (application.applicantId !== userId) throw new ForbiddenError('Unauthorized.');

    const currentDocs = (application.documents as Record<string, any>) || {};
    const updatedDocs = { ...currentDocs, [docData.documentType || 'ID_PROOF']: docData };

    return prisma.application.update({
      where: { id },
      data: { documents: updatedDocs },
    });
  }

  async signLease(id: string, userId: string, signData: any) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundError('Application not found.');
    if (application.applicantId !== userId) throw new ForbiddenError('Unauthorized.');

    return prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.CONFIRMED,
        documents: {
          ...((application.documents as any) || {}),
          leaseSignature: {
            signedAt: new Date().toISOString(),
            ...signData,
          },
        },
      },
    });
  }
}
