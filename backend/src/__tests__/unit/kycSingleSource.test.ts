import { KycAuthorizationService } from '../../services/security/KycAuthorizationService';
import { prisma } from '../../config/prisma';
import { OwnerKYCStatus } from '@prisma/client';

jest.mock('../../config/prisma', () => ({
  prisma: {
    owner: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb(prisma);
      }
      return cb;
    }),
    ownerKYC: {
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

describe('Security Remediation Issue 2: Single KYC Source of Truth', () => {
  const userId = 'usr_owner_kyc_test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return true ONLY when OwnerKYC.verificationStatus is strictly VERIFIED', async () => {
    (prisma.owner.findUnique as jest.Mock).mockResolvedValue({
      id: 'owner_123',
      userId,
      kyc: {
        id: 'kyc_123',
        verificationStatus: OwnerKYCStatus.VERIFIED,
      },
    });

    const isApproved = await KycAuthorizationService.isOwnerKycApproved(userId);
    expect(isApproved).toBe(true);
  });

  test('should return false when OwnerKYC.verificationStatus is PENDING or REJECTED', async () => {
    (prisma.owner.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'owner_123',
      userId,
      kyc: {
        id: 'kyc_123',
        verificationStatus: OwnerKYCStatus.PENDING,
      },
    });

    const isPending = await KycAuthorizationService.isOwnerKycApproved(userId);
    expect(isPending).toBe(false);

    (prisma.owner.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'owner_123',
      userId,
      kyc: {
        id: 'kyc_123',
        verificationStatus: OwnerKYCStatus.REJECTED,
      },
    });

    const isRejected = await KycAuthorizationService.isOwnerKycApproved(userId);
    expect(isRejected).toBe(false);
  });

  test('should fail closed (return false) if Owner or OwnerKYC record is missing', async () => {
    (prisma.owner.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const isMissingOwner = await KycAuthorizationService.isOwnerKycApproved(userId);
    expect(isMissingOwner).toBe(false);

    (prisma.owner.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'owner_123',
      userId,
      kyc: null,
    });

    const isMissingKYC = await KycAuthorizationService.isOwnerKycApproved(userId);
    expect(isMissingKYC).toBe(false);
  });

  test('should fail closed (return false) if database throws an unexpected error', async () => {
    (prisma.owner.findUnique as jest.Mock).mockRejectedValue(new Error('DB Connection Timeout'));

    const isSafe = await KycAuthorizationService.isOwnerKycApproved(userId);
    expect(isSafe).toBe(false);
  });
});
