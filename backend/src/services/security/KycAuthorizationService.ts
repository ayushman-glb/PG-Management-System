import { prisma } from '../../config/prisma';

export class KycAuthorizationService {
  public static async isOwnerKycApproved(userId: string): Promise<boolean> {
    try {
      if ((prisma as any).owner?.findUnique) {
        const owner = await (prisma as any).owner.findUnique({
          where: { userId },
          include: { kyc: true },
        });

        return owner?.kyc?.verificationStatus === 'VERIFIED';
      }

      if ((prisma as any).document?.findFirst) {
        const doc = await (prisma as any).document.findFirst({
          where: { userId, status: 'VERIFIED' },
        });
        return Boolean(doc);
      }

      return true;
    } catch {
      return false;
    }
  }
}

export default KycAuthorizationService;
