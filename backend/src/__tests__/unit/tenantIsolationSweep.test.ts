import { PrismaAgreementRepository } from '../../repositories/PrismaAgreementRepository';
import { PrismaComplaintRepository } from '../../repositories/PrismaComplaintRepository';
import { PrismaBillingRepository } from '../../repositories/PrismaBillingRepository';
import { ResidentManagementRepository } from '../../repositories/ResidentManagementRepository';

describe('Phase 1 Multi-Tenancy Boundary Enforcement Unit Tests', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      agreement: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'agr_owner1') {
            return Promise.resolve({ id: 'agr_owner1', pgId: 'pg_owner1_id', status: 'PENDING' });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({ id: 'agr_owner1', status: 'SIGNED_BY_RESIDENT' }),
      },
      complaint: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'cmp_owner1') {
            return Promise.resolve({ id: 'cmp_owner1', pgId: 'pg_owner1_id', status: 'OPEN' });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({ id: 'cmp_owner1', status: 'RESOLVED' }),
      },
      payment: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'pay_owner1') {
            return Promise.resolve({ id: 'pay_owner1', pgId: 'pg_owner1_id', status: 'PENDING' });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({ id: 'pay_owner1', status: 'PAID' }),
      },
      resident: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'res_owner1') {
            return Promise.resolve({ id: 'res_owner1', pgId: 'pg_owner1_id', status: 'ACTIVE' });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn(),
      },
      residentStatusHistory: {
        create: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };
  });

  describe('Agreement Tenant Scoping', () => {
    test('findById blocks cross-tenant agreement access when pgId mismatches', async () => {
      const repo = new PrismaAgreementRepository(mockPrisma);
      await expect(repo.findById('agr_owner1', 'pg_owner2_id')).rejects.toThrow(
        'Unauthorized: Agreement does not belong to specified PG tenant'
      );
    });

    test('updateStatus blocks cross-tenant agreement modifications when pgId mismatches', async () => {
      const repo = new PrismaAgreementRepository(mockPrisma);
      await expect(repo.updateStatus('agr_owner1', 'COMPLETED', 'pg_owner2_id')).rejects.toThrow(
        'Unauthorized: Agreement does not belong to specified PG tenant'
      );
    });

    test('updateStatus succeeds when pgId matches tenant owner', async () => {
      const repo = new PrismaAgreementRepository(mockPrisma);
      const updated = await repo.updateStatus('agr_owner1', 'SIGNED_BY_RESIDENT', 'pg_owner1_id');
      expect(updated.status).toBe('SIGNED_BY_RESIDENT');
    });
  });

  describe('Complaint Tenant Scoping', () => {
    test('findById blocks cross-tenant complaint access when propertyId mismatches', async () => {
      const repo = new PrismaComplaintRepository(mockPrisma);
      const res = await repo.findById('cmp_owner1', 'pg_owner2_id');
      expect(res).toBeNull();
    });

    test('updateStatus blocks cross-tenant complaint status modification when propertyId mismatches', async () => {
      const repo = new PrismaComplaintRepository(mockPrisma);
      await expect(repo.updateStatus('cmp_owner1', 'RESOLVED' as any, 'pg_owner2_id')).rejects.toThrow(
        'Unauthorized: Complaint does not belong to specified PG tenant'
      );
    });
  });

  describe('Billing Tenant Scoping', () => {
    test('findPaymentById blocks cross-tenant payment access when propertyId mismatches', async () => {
      const repo = new PrismaBillingRepository(mockPrisma);
      const res = await repo.findPaymentById('pay_owner1', 'pg_owner2_id');
      expect(res).toBeNull();
    });

    test('updatePaymentStatus blocks cross-tenant payment updates when propertyId mismatches', async () => {
      const repo = new PrismaBillingRepository(mockPrisma);
      await expect(repo.updatePaymentStatus('pay_owner1', 'PAID' as any, undefined, 'pg_owner2_id')).rejects.toThrow(
        'Unauthorized: Payment does not belong to specified PG tenant'
      );
    });
  });

  describe('Resident Status Tenant Scoping', () => {
    test('updateResidentStatus blocks cross-tenant status updates when pgId mismatches', async () => {
      const repo = new ResidentManagementRepository(mockPrisma);
      await expect(
        repo.updateResidentStatus({
          residentId: 'res_owner1',
          status: 'CHECKED_OUT' as any,
          updatedBy: 'usr_admin',
          pgId: 'pg_owner2_id',
        })
      ).rejects.toThrow('Unauthorized: Resident does not belong to specified PG tenant');
    });
  });
});
