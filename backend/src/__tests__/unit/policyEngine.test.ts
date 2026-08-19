import { PolicyEngine } from '../../services/security/PolicyEngine';
import { KycAuthorizationService } from '../../services/security/KycAuthorizationService';

jest.mock('../../services/security/KycAuthorizationService');

describe('PolicyEngine Centralized Authorization Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canCreateProperty', () => {
    test('should allow SUPER_ADMIN or ADMIN directly without KYC check', async () => {
      const adminResult = await PolicyEngine.canCreateProperty({ id: 'usr_admin', role: 'ADMIN' });
      expect(adminResult.allowed).toBe(true);

      const superAdminResult = await PolicyEngine.canCreateProperty({ id: 'usr_super', role: 'SUPER_ADMIN' });
      expect(superAdminResult.allowed).toBe(true);
    });

    test('should deny non-owner roles (e.g. RESIDENT) from creating properties', async () => {
      const residentResult = await PolicyEngine.canCreateProperty({ id: 'usr_res', role: 'RESIDENT' });
      expect(residentResult.allowed).toBe(false);
      expect(residentResult.code).toBe('FORBIDDEN_ROLE');
    });

    test('should allow OWNER if KYC is VERIFIED', async () => {
      (KycAuthorizationService.evaluateOwnerKycStatus as jest.Mock).mockResolvedValue({
        isApproved: true,
        status: 'VERIFIED',
      });

      const result = await PolicyEngine.canCreateProperty({ id: 'usr_owner_verified', role: 'OWNER' });
      expect(result.allowed).toBe(true);
    });

    test('should deny OWNER if KYC is PENDING or REJECTED', async () => {
      (KycAuthorizationService.evaluateOwnerKycStatus as jest.Mock).mockResolvedValue({
        isApproved: false,
        status: 'PENDING',
        denialReason: 'Owner KYC verification is pending review',
      });

      const result = await PolicyEngine.canCreateProperty({ id: 'usr_owner_pending', role: 'OWNER' });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('KYC_REQUIRED');
    });
  });

  describe('canEditProperty', () => {
    test('should allow owner who owns the property', async () => {
      const result = await PolicyEngine.canEditProperty({ id: 'owner_123', role: 'OWNER' }, 'owner_123');
      expect(result.allowed).toBe(true);
    });

    test('should deny cross-owner property modification', async () => {
      const result = await PolicyEngine.canEditProperty({ id: 'owner_123', role: 'OWNER' }, 'owner_456');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('CROSS_PROPERTY_FORBIDDEN');
    });
  });

  describe('canApproveKyc', () => {
    test('should allow ADMIN and SUPER_ADMIN', () => {
      expect(PolicyEngine.canApproveKyc({ id: 'usr_admin', role: 'ADMIN' }).allowed).toBe(true);
      expect(PolicyEngine.canApproveKyc({ id: 'usr_super', role: 'SUPER_ADMIN' }).allowed).toBe(true);
    });

    test('should deny OWNER and RESIDENT', () => {
      expect(PolicyEngine.canApproveKyc({ id: 'usr_owner', role: 'OWNER' }).allowed).toBe(false);
      expect(PolicyEngine.canApproveKyc({ id: 'usr_res', role: 'RESIDENT' }).allowed).toBe(false);
    });
  });

  describe('canViewInvoice', () => {
    test('should allow resident to view their own invoice', () => {
      const result = PolicyEngine.canViewInvoice(
        { id: 'usr_resident_1', role: 'RESIDENT', residentId: 'res_1' },
        'owner_1',
        'usr_resident_1'
      );
      expect(result.allowed).toBe(true);
    });

    test('should deny resident from viewing other resident invoices', () => {
      const result = PolicyEngine.canViewInvoice(
        { id: 'usr_resident_1', role: 'RESIDENT', residentId: 'res_1' },
        'owner_1',
        'usr_resident_2'
      );
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('FORBIDDEN');
    });
  });
});
