import { PrismaClient, Role, BedStatus, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../core/errors/CustomErrors';

export class ResidentService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async onboard(userId: string, kycData: any) {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      occupation,
      companyOrCollege,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      bloodGroup,
      idProofType,
      idProofNumber,
      idProofUrl,
    } = kycData;

    const profile = await this.db.userProfile.upsert({
      where: { userId },
      update: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        occupation: occupation || undefined,
        companyOrCollege: companyOrCollege || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        emergencyContactRelation: emergencyContactRelation || undefined,
        bloodGroup: bloodGroup || undefined,
        idProofType: idProofType || undefined,
        idProofNumber: idProofNumber || undefined,
        idProofUrl: idProofUrl || undefined,
      },
      create: {
        userId,
        firstName: firstName || 'Resident',
        lastName: lastName || 'User',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        occupation: occupation || undefined,
        companyOrCollege: companyOrCollege || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        emergencyContactRelation: emergencyContactRelation || undefined,
        bloodGroup: bloodGroup || undefined,
        idProofType: idProofType || undefined,
        idProofNumber: idProofNumber || undefined,
        idProofUrl: idProofUrl || undefined,
      },
    });

    return profile;
  }

  async getDirectory(params: { propertyId?: string; search?: string; status?: string } = {}) {
    const where: any = { role: Role.RESIDENT };

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
        { profile: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const residents = await this.db.user.findMany({
      where,
      include: {
        profile: true,
        roomAllocations: {
          where: { isActive: true },
          include: {
            pg: true,
            room: true,
            bed: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return residents.map((r) => {
      const activeAlloc = r.roomAllocations[0];
      return {
        id: r.id,
        name: r.profile ? `${r.profile.firstName} ${r.profile.lastName}` : r.email.split('@')[0],
        email: r.email,
        phone: r.phone,
        status: r.isActive ? 'ACTIVE' : 'INACTIVE',
        propertyName: activeAlloc?.pg?.name || 'Unassigned',
        roomNumber: activeAlloc?.room?.roomNumber || 'N/A',
        bedNumber: activeAlloc?.bed?.bedNumber || 'N/A',
        checkInDate: activeAlloc?.checkInDate || r.createdAt,
      };
    });
  }

  async getPortalMe(residentId: string) {
    const user = await this.db.user.findUnique({
      where: { id: residentId },
      include: {
        profile: true,
        roomAllocations: {
          where: { isActive: true },
          include: {
            pg: {
              include: {
                location: true,
                amenities: { include: { amenity: true } },
              },
            },
            room: true,
            bed: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        residentAgreements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        complaintsCreated: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Resident not found');
    }

    const activeAlloc = user.roomAllocations[0];

    return {
      resident: {
        id: user.id,
        name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email.split('@')[0],
        email: user.email,
        phone: user.phone,
        profile: user.profile,
      },
      allocation: activeAlloc || null,
      property: activeAlloc?.pg || null,
      room: activeAlloc?.room || null,
      bed: activeAlloc?.bed || null,
      invoices: user.invoices || [],
      agreement: user.residentAgreements[0] || null,
      recentComplaints: user.complaintsCreated || [],
    };
  }

  async updateResidentStatus(residentId: string, status: string, reason?: string) {
    const user = await this.db.user.findUnique({ where: { id: residentId } });
    if (!user) throw new NotFoundError('Resident not found');

    const isActive = status === 'ACTIVE';
    await this.db.user.update({
      where: { id: residentId },
      data: { isActive },
    });

    return { success: true, residentId, status, reason };
  }

  async getStatusHistory(residentId: string) {
    const bookings = await this.db.booking.findMany({
      where: { residentId },
      include: { statusHistory: true },
    });
    return bookings.flatMap((b) => b.statusHistory);
  }

  async getResidents() {
    return this.getDirectory();
  }

  async getResidentById(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roomAllocations: {
          include: {
            pg: true,
            room: true,
            bed: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundError('Resident not found');
    return user;
  }

  async createVisitorPass(residentId: string, data: any) {
    return {
      id: `pass_${Date.now()}`,
      residentId,
      ...data,
      status: 'APPROVED',
      passCode: Math.floor(100000 + Math.random() * 900000).toString(),
      createdAt: new Date().toISOString(),
    };
  }

  async createGatePass(residentId: string, data: any) {
    return {
      id: `gate_${Date.now()}`,
      residentId,
      ...data,
      status: 'APPROVED',
      passCode: Math.floor(100000 + Math.random() * 900000).toString(),
      createdAt: new Date().toISOString(),
    };
  }
}
