import { CascadeUpdateService } from '../../services/data/CascadeUpdateService';
import { DataIntegrityService } from '../../services/data/DataIntegrityService';
import { DashboardRepository } from '../../repositories/DashboardRepository';
import { DashboardService } from '../../services/DashboardService';
import { Role } from '@prisma/client';

describe('Data Integrity, Cascade Update Engine & Repository Architecture', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      owner: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(5),
      },
      resident: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(20),
      },
      pG: {
        count: jest.fn().mockResolvedValue(3),
      },
      bed: {
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(50),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      room: {
        count: jest.fn().mockResolvedValue(25),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      building: {
        count: jest.fn().mockResolvedValue(2),
      },
      payment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 150000, baseAmount: 10000 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      complaint: {
        groupBy: jest.fn().mockResolvedValue([{ status: 'OPEN', _count: { _all: 2 } }]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      maintenance: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { cost: 5000 } }),
      },
      visitor: {
        count: jest.fn().mockResolvedValue(12),
      },
      notification: {
        count: jest.fn().mockResolvedValue(4),
      },
      activityLog: {
        create: jest.fn().mockResolvedValue({ id: 'log_1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    (global as any).prismaSingleton = mockPrisma;
  });

  afterEach(() => {
    delete (global as any).prismaSingleton;
  });

  describe('CascadeUpdateService', () => {
    it('atomically cascades user changes to linked Owner and Resident profiles', async () => {
      const service = new CascadeUpdateService(mockPrisma);
      const userId = 'usr_cascade_1';

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        name: 'New Full Name',
        email: 'newemail@roombae.com',
        phone: '+919999999999',
        avatarUrl: 'https://cdn.roombae.com/avatar.jpg',
        role: Role.RESIDENT,
      });

      mockPrisma.owner.findFirst.mockResolvedValue({ id: 'own_1', userId });
      mockPrisma.owner.update.mockResolvedValue({ id: 'own_1' });

      mockPrisma.resident.findFirst.mockResolvedValue({ id: 'res_1', userId });
      mockPrisma.resident.update.mockResolvedValue({ id: 'res_1' });

      const result = await service.updateUserData(userId, {
        name: 'New Full Name',
        email: 'newemail@roombae.com',
        phone: '+919999999999',
        avatarUrl: 'https://cdn.roombae.com/avatar.jpg',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            name: 'New Full Name',
            email: 'newemail@roombae.com',
            phone: '+919999999999',
            avatarUrl: 'https://cdn.roombae.com/avatar.jpg',
          }),
        })
      );
      expect(mockPrisma.owner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'own_1' },
          data: expect.objectContaining({
            name: 'New Full Name',
            photo: 'https://cdn.roombae.com/avatar.jpg',
          }),
        })
      );
      expect(mockPrisma.resident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res_1' },
          data: expect.objectContaining({
            name: 'New Full Name',
            profilePicture: 'https://cdn.roombae.com/avatar.jpg',
          }),
        })
      );
      expect(result.ownerUpdated).toBe(true);
      expect(result.residentUpdated).toBe(true);
    });
  });

  describe('DataIntegrityService', () => {
    it('detects and auto-repairs missing Resident profiles for RESIDENT users', async () => {
      const service = new DataIntegrityService(mockPrisma);

      mockPrisma.user.findMany.mockImplementation(({ where }: any) => {
        if (where?.role === Role.RESIDENT) {
          return Promise.resolve([
            { id: 'usr_res_missing', name: 'John Doe', email: 'john@example.com', phone: '+919876543210', role: Role.RESIDENT },
          ]);
        }
        if (where?.role === Role.OWNER) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      mockPrisma.resident.findFirst.mockResolvedValue(null);
      mockPrisma.resident.create.mockResolvedValue({ id: 'res_created' });
      mockPrisma.owner.findMany.mockResolvedValue([]);
      mockPrisma.resident.findMany.mockResolvedValue([]);
      mockPrisma.bed.findMany.mockResolvedValue([]);

      const report = await service.runAudit(true); // autoRepair = true

      expect(report.categories.missingResidentProfiles).toBe(1);
      expect(report.totalIssuesRepaired).toBe(1);
      expect(mockPrisma.resident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'usr_res_missing',
            name: 'John Doe',
            email: 'john@example.com',
          }),
        })
      );
    });

    it('detects and auto-repairs bed occupancy status mismatch', async () => {
      const service = new DataIntegrityService(mockPrisma);

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.owner.findMany.mockResolvedValue([]);
      mockPrisma.resident.findMany.mockResolvedValue([]);
      mockPrisma.bed.findMany.mockResolvedValue([
        { id: 'bed_101', bedNumber: 'A1', isOccupied: true, status: 'OCCUPIED' },
      ]);
      // No resident currently assigned
      mockPrisma.resident.findFirst.mockResolvedValue(null);
      mockPrisma.bed.update.mockResolvedValue({ id: 'bed_101', isOccupied: false });

      const report = await service.runAudit(true);

      expect(report.categories.bedOccupancyMismatches).toBe(1);
      expect(mockPrisma.bed.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bed_101' },
          data: expect.objectContaining({
            isOccupied: false,
            status: 'AVAILABLE',
          }),
        })
      );
    });
  });

  describe('Dashboard Repository & Service Layering', () => {
    it('aggregates metrics cleanly through DashboardRepository and DashboardService', async () => {
      const repo = new DashboardRepository(mockPrisma);
      const service = new DashboardService(repo);

      const metrics = await service.getOverview();

      expect(metrics.totalPGs).toBe(3);
      expect(metrics.totalOwners).toBe(5);
      expect(metrics.totalResidents).toBe(20);
      expect(metrics.totalRevenue).toBe(150000);
      expect(metrics.complaints.open).toBe(2);
    });
  });
});
