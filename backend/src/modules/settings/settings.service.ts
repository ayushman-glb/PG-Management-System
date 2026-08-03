import { PrismaClient } from '@prisma/client';

export class SettingsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAdminVerificationQueue() {
    return this.prisma.owner.findMany({
      include: {
        kyc: true,
        business: true,
        subscription: true,
        pgs: { include: { propertyDocuments: true } }
      }
    });
  }

  async approvePgProperty(pgId: string) {
    return this.prisma.pG.update({
      where: { id: pgId },
      data: { draftStatus: 'APPROVED', status: 'ACTIVE' }
    });
  }

  async softDeleteAccount(userId: string, reason?: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User record not found.');

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'PUBLIC', email: `deleted_${Date.now()}@roombae.com`, accountStatus: 'DEACTIVATED' }
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETED_SOFT',
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'RoomBae Client',
        details: `Account deletion executed. Reason: ${reason || 'User requested checkout'}`
      }
    });

    return true;
  }
}
