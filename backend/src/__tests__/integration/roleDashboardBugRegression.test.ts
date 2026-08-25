import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { app } from '../../app';
import { env } from '../../config/env';

const mockAdminId = '64a000000000000000000050';
const mockOwnerId = '64a000000000000000000051';
const mockResidentId = '64a000000000000000000052';

const mockDbUsers: Record<string, any> = {
  [mockAdminId]: { id: mockAdminId, email: 'admin@roombae.com', role: Role.ADMIN, tokenVersion: 1, isActive: true, isSuspended: false, profile: { firstName: 'Admin', lastName: 'User' } },
  [mockOwnerId]: { id: mockOwnerId, email: 'owner@roombae.com', role: Role.PG_OWNER, tokenVersion: 1, isActive: true, isSuspended: false, profile: { firstName: 'Owner', lastName: 'User' } },
  [mockResidentId]: { id: mockResidentId, email: 'resident@roombae.com', role: Role.RESIDENT, tokenVersion: 1, isActive: true, isSuspended: false, profile: { firstName: 'Resident', lastName: 'User' } },
};

jest.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    pG: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    bed: {
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
    },
    $connect: jest.fn(),
  },
}));

describe('Role/UI Bug Regression Suite (PG_OWNER vs RESIDENT vs ADMIN Separation)', () => {
  let adminToken: string;
  let ownerToken: string;
  let residentToken: string;

  beforeAll(() => {
    adminToken = jwt.sign({ id: mockAdminId, email: 'admin@roombae.com', role: Role.ADMIN, tokenVersion: 1 }, env.JWT_SECRET, { expiresIn: '1h' });
    ownerToken = jwt.sign({ id: mockOwnerId, email: 'owner@roombae.com', role: Role.PG_OWNER, tokenVersion: 1 }, env.JWT_SECRET, { expiresIn: '1h' });
    residentToken = jwt.sign({ id: mockResidentId, email: 'resident@roombae.com', role: Role.RESIDENT, tokenVersion: 1 }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    (global as any).prismaSingleton = prisma;
    (prisma.user.findUnique as jest.Mock).mockImplementation((args: any) => {
      const user = mockDbUsers[args?.where?.id];
      return Promise.resolve(user || null);
    });
    (prisma.user.findFirst as jest.Mock).mockImplementation((args: any) => {
      const user = mockDbUsers[args?.where?.id];
      return Promise.resolve(user || null);
    });
    (prisma.user.count as jest.Mock).mockResolvedValue(10);
    (prisma.pG.count as jest.Mock).mockResolvedValue(2);
    (prisma.pG.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.bed.count as jest.Mock).mockResolvedValue(20);
    (prisma.booking.count as jest.Mock).mockResolvedValue(5);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 50000 } });
  });

  describe('PG Owner Role Authentication & Payload', () => {
    it('1. GET /api/v1/auth/me returns strictly PG_OWNER role', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(Role.PG_OWNER);
    });

    it('2. PG_OWNER cannot access ADMIN operations (/api/v1/admin/stats -> 403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });

    it('3. PG_OWNER can access owner dashboard overview', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect([200, 404, 500]).toContain(res.status);
      expect(res.status).not.toBe(403);
    });
  });

  describe('Resident Role Authentication & Portal Payload', () => {
    it('1. GET /api/v1/auth/me returns strictly RESIDENT role', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(Role.RESIDENT);
    });

    it('2. RESIDENT cannot access ADMIN operations (/api/v1/admin/stats -> 403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });

    it('3. RESIDENT accesses /api/v1/residents/portal/me without 403', async () => {
      const res = await request(app)
        .get('/api/v1/residents/portal/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect([200, 404, 500]).toContain(res.status);
      expect(res.status).not.toBe(403);
    });
  });

  describe('Admin Role Platform Operations', () => {
    it('1. GET /api/v1/auth/me returns strictly ADMIN role', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(Role.ADMIN);
    });

    it('2. ADMIN can access admin stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(res.status);
      expect(res.status).not.toBe(403);
    });
  });
});
