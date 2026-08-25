import { PrismaClient, Role, PGStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../core/errors/CustomErrors';

export class OwnerService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async submitOnboarding(ownerId: string, input: any) {
    const { personal, kyc, property, location } = input;

    // Update user profile if provided
    if (personal || kyc) {
      const nameParts = (personal?.name || '').trim().split(' ');
      const firstName = personal?.firstName || nameParts[0] || 'Owner';
      const lastName = personal?.lastName || nameParts.slice(1).join(' ') || 'User';

      await this.db.userProfile.upsert({
        where: { userId: ownerId },
        update: {
          firstName,
          lastName,
          companyOrCollege: personal?.companyName || undefined,
          idProofType: kyc?.documentType || undefined,
          idProofNumber: kyc?.documentNumber || undefined,
          idProofUrl: kyc?.documentUrl || undefined,
        },
        create: {
          userId: ownerId,
          firstName,
          lastName,
          companyOrCollege: personal?.companyName || undefined,
          idProofType: kyc?.documentType || undefined,
          idProofNumber: kyc?.documentNumber || undefined,
          idProofUrl: kyc?.documentUrl || undefined,
        },
      });
    }

    // Create or update PG Property if property info provided
    let createdPg: any = null;
    if (property?.name) {
      createdPg = await this.db.pG.create({
        data: {
          ownerId,
          name: property.name,
          description: property.description || 'Modern PG Accommodation',
          genderType: property.genderType || 'CO_LIVING',
          rules: property.rules || [],
          noticePeriodDays: property.noticePeriodDays || 30,
          basePrice: Number(property.basePrice || 0),
          depositMonths: Number(property.depositMonths || 1),
          contactPhone: property.contactPhone || undefined,
          contactEmail: property.contactEmail || undefined,
          status: PGStatus.PENDING_ADMIN_VERIFICATION,
        },
      });

      if (location?.address) {
        await this.db.pGLocation.create({
          data: {
            pgId: createdPg.id,
            address: location.address,
            locality: location.locality || 'Locality',
            city: location.city || 'Bangalore',
            state: location.state || 'Karnataka',
            pincode: location.pincode || '560001',
            latitude: Number(location.latitude || 12.9716),
            longitude: Number(location.longitude || 77.5946),
          },
        });
      }
    }

    return {
      success: true,
      ownerId,
      pg: createdPg,
      message: 'Owner onboarding submitted successfully for verification.',
    };
  }

  async getOnboardingStatus(ownerId: string) {
    const owner = await this.db.user.findUnique({
      where: { id: ownerId },
      include: {
        profile: true,
        ownedPGs: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!owner) throw new NotFoundError('Owner not found');

    const hasKyc = Boolean(owner.profile?.idProofNumber || owner.profile?.idProofUrl);
    const hasProperty = owner.ownedPGs.length > 0;
    const propertyStatus = owner.ownedPGs[0]?.status || 'NOT_CREATED';

    return {
      ownerId,
      isVerified: owner.emailVerified && hasKyc,
      kycStatus: hasKyc ? 'SUBMITTED' : 'PENDING',
      propertyStatus,
      propertiesCount: owner.ownedPGs.length,
      properties: owner.ownedPGs,
    };
  }

  async getPendingVerifications() {
    const pendingPGs = await this.db.pG.findMany({
      where: { status: PGStatus.PENDING_ADMIN_VERIFICATION },
      include: {
        owner: { include: { profile: true } },
        location: true,
      },
    });

    return pendingPGs.map((pg) => ({
      pgId: pg.id,
      pgName: pg.name,
      ownerId: pg.ownerId,
      ownerName: pg.owner.profile ? `${pg.owner.profile.firstName} ${pg.owner.profile.lastName}` : pg.owner.email,
      ownerEmail: pg.owner.email,
      ownerPhone: pg.owner.phone,
      city: pg.location?.city || 'N/A',
      status: pg.status,
      submittedAt: pg.createdAt,
    }));
  }
}
