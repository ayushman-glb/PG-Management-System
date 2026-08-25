import { PrismaClient, Role, VerificationStatus, PassStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../core/errors/CustomErrors';

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

    await this.db.user.update({
      where: { id: userId },
      data: { isProfileComplete: true },
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
        residentAgreements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        documents: {
          where: { isCurrent: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return residents.map((r) => {
      const activeAlloc = r.roomAllocations[0];
      const agreement = r.residentAgreements[0];
      const latestInvoice = r.invoices[0];
      const fullName = r.profile
        ? `${r.profile.firstName} ${r.profile.lastName}`.trim()
        : r.username || r.email.split('@')[0];

      const kycDocs = r.documents || [];
      const hasVerifiedDoc = kycDocs.some((d) => d.status === VerificationStatus.VERIFIED);
      const hasPendingDoc = kycDocs.some((d) => d.status === VerificationStatus.PENDING || d.status === VerificationStatus.UNDER_REVIEW);
      const kycStatus = hasVerifiedDoc ? 'Verified' : hasPendingDoc ? 'Under Review' : 'Pending';

      return {
        id: r.id,
        name: fullName,
        email: r.email,
        phone: r.phone || 'N/A',
        avatar: fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarUrl: r.avatarUrl || null,
        status: r.isActive ? 'Active' : 'Inactive',
        profession: r.profile?.occupation || 'Professional',
        occupation: r.profile?.occupation || 'Professional',
        company: r.profile?.companyOrCollege || 'N/A',
        kyc: kycStatus,
        kycStatus,
        property: activeAlloc?.pg?.name || 'Unassigned',
        propertyName: activeAlloc?.pg?.name || 'Unassigned',
        pg: activeAlloc?.pg?.name || 'Unassigned',
        room: activeAlloc?.room?.roomNumber || 'N/A',
        roomNumber: activeAlloc?.room?.roomNumber || 'N/A',
        bed: activeAlloc?.bed?.bedNumber || 'N/A',
        bedNumber: activeAlloc?.bed?.bedNumber || 'N/A',
        rent: activeAlloc?.rent ?? agreement?.rentAmount ?? 0,
        rentAmount: activeAlloc?.rent ?? agreement?.rentAmount ?? 0,
        depositAmount: activeAlloc?.deposit ?? agreement?.depositAmount ?? 0,
        checkInDate: activeAlloc?.checkInDate || r.createdAt,
        joined: activeAlloc?.checkInDate ? new Date(activeAlloc.checkInDate).toISOString().split('T')[0] : new Date(r.createdAt).toISOString().split('T')[0],
        agreementStatus: agreement?.status || 'No Agreement',
        paymentStatus: latestInvoice?.status || 'Paid',
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
                mealPlans: true,
              },
            },
            floor: true,
            room: {
              include: {
                beds: true,
              },
            },
            bed: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        paymentsMade: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        residentAgreements: {
          include: {
            pg: { include: { location: true } },
            owner: { select: { id: true, username: true, email: true, phone: true, profile: true } },
            signatures: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        complaintsCreated: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        documents: {
          where: { isCurrent: true },
          orderBy: { createdAt: 'desc' },
        },
        visitorPasses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        gatePasses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Resident not found');
    }

    const activeAlloc = user.roomAllocations[0];
    const activePg = activeAlloc?.pg;
    const activeRoom = activeAlloc?.room;
    const activeBed = activeAlloc?.bed;

    // Find roommate in the same room (if any)
    let roommate: any = null;
    if (activeRoom && activeBed) {
      const otherAlloc = await this.db.roomAllocation.findFirst({
        where: {
          roomId: activeRoom.id,
          isActive: true,
          residentId: { not: residentId },
        },
        include: {
          resident: { include: { profile: true } },
          bed: true,
        },
      });

      if (otherAlloc && otherAlloc.resident) {
        const rProfile = otherAlloc.resident.profile;
        roommate = {
          id: otherAlloc.resident.id,
          name: rProfile ? `${rProfile.firstName} ${rProfile.lastName}`.trim() : otherAlloc.resident.username,
          phone: otherAlloc.resident.phone || '—',
          occupation: rProfile?.occupation || 'Professional',
          bedNumber: otherAlloc.bed?.bedNumber || '—',
        };
      }
    }

    const fullName = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user.username || user.email.split('@')[0];

    const currentMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());

    const activeAgreement = user.residentAgreements[0] || null;
    const rentAmount = activeAlloc?.rent ?? activeAgreement?.rentAmount ?? 0;
    const depositAmount = activeAlloc?.deposit ?? activeAgreement?.depositAmount ?? 0;

    const invoices = user.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      month: `${inv.billingMonth}/${inv.billingYear}`,
      baseAmount: inv.subtotal,
      gstAmount: inv.gstAmount,
      totalAmount: inv.totalAmount,
      balanceDue: inv.balanceDue,
      status: inv.status,
      dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
      createdAt: inv.createdAt,
    }));

    return {
      resident: {
        id: user.id,
        name: fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isProfileComplete: user.isProfileComplete,
        profile: user.profile,
      },
      profile: {
        id: user.id,
        name: fullName,
        email: user.email,
        phone: user.phone,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        propertyName: activePg?.name || 'Unassigned',
        roomNumber: activeRoom?.roomNumber || 'N/A',
        bedNumber: activeBed?.bedNumber || 'N/A',
        residentCode: user.id.slice(-6).toUpperCase(),
        gender: user.profile?.gender || '—',
        bloodGroup: user.profile?.bloodGroup || '—',
        occupation: user.profile?.occupation || '—',
        permanentAddress: user.currentAddress || user.profile?.companyOrCollege || '—',
        emergencyContactName: user.profile?.emergencyContactName || '—',
        emergencyContactPhone: user.profile?.emergencyContactPhone || '—',
      },
      allocation: activeAlloc || null,
      property: activePg || null,
      pg: activePg || null,
      room: activeRoom || null,
      bed: activeBed || null,
      floor: activeAlloc?.floor?.floorName || `${activeAlloc?.floor?.floorNumber || 1}st`,
      moveInDate: activeAlloc?.checkInDate ? new Date(activeAlloc.checkInDate).toISOString().split('T')[0] : '—',
      rentAmount,
      depositAmount,
      currentMonth,
      dueDate: '5th of every month',
      wifiName: activeAlloc?.floor?.wifiSsid || 'RoomBae-HighSpeed-WiFi',
      wifiPassword: activeAlloc?.floor?.wifiPassword || 'roombae@2026',
      roommate,
      mealPlan: activePg?.mealPlans?.[0] || null,
      invoices,
      payments: invoices, // Compatible alias for UI billing table
      agreements: user.residentAgreements,
      agreement: activeAgreement,
      complaints: user.complaintsCreated.map((c) => ({
        id: c.id,
        ticketCode: `TICK-${c.id.slice(-4).toUpperCase()}`,
        category: c.category,
        title: c.title,
        description: c.description,
        priority: c.priority,
        status: c.status,
        createdAt: new Date(c.createdAt).toISOString().split('T')[0],
      })),
      recentComplaints: user.complaintsCreated,
      documents: user.documents,
      visitorPasses: user.visitorPasses,
      gatePasses: user.gatePasses,
    };
  }

  async updateResidentStatus(residentId: string, status: string, reason?: string) {
    const user = await this.db.user.findUnique({ where: { id: residentId } });
    if (!user) throw new NotFoundError('Resident not found');

    const isActive = status === 'ACTIVE' || status === 'Active';
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
        residentAgreements: {
          include: {
            signatures: true,
          },
        },
        invoices: true,
        documents: {
          where: { isCurrent: true },
        },
      },
    });
    if (!user) throw new NotFoundError('Resident not found');
    return user;
  }

  async createVisitorPass(residentId: string, data: { visitorName: string; visitorMobile: string; relation?: string; visitDate?: string; timeSlot?: string }) {
    if (!data.visitorName || !data.visitorMobile) {
      throw new BadRequestError('visitorName and visitorMobile are required.');
    }

    const alloc = await this.db.roomAllocation.findFirst({
      where: { residentId, isActive: true },
    });

    if (!alloc) {
      throw new BadRequestError('Resident has no active PG allocation.');
    }

    const passCode = `VP-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.db.visitorPass.create({
      data: {
        residentId,
        pgId: alloc.pgId,
        passCode,
        visitorName: data.visitorName,
        visitorMobile: data.visitorMobile,
        relation: data.relation || 'Friend',
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
        timeSlot: data.timeSlot || '16:00 - 18:00',
        status: PassStatus.APPROVED,
      },
    });
  }

  async createGatePass(residentId: string, data: { passType?: string; destination: string; departureTime?: string; returnTime?: string; reason?: string }) {
    if (!data.destination) {
      throw new BadRequestError('Destination is required for gate pass.');
    }

    const alloc = await this.db.roomAllocation.findFirst({
      where: { residentId, isActive: true },
    });

    if (!alloc) {
      throw new BadRequestError('Resident has no active PG allocation.');
    }

    const passCode = `GP-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.db.gatePass.create({
      data: {
        residentId,
        pgId: alloc.pgId,
        passCode,
        passType: data.passType || 'DAY_OUTING',
        destination: data.destination,
        departureTime: data.departureTime || '18:00',
        returnTime: data.returnTime || '21:00',
        reason: data.reason || 'Personal outing',
        status: PassStatus.APPROVED,
      },
    });
  }
}
