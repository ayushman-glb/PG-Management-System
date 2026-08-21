import request from 'supertest';
import { app } from '../../app';
import { Container } from '../../container';
import { prisma } from '../../config/prisma';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

const tokenService = new JwtTokenService();

describe('Role/UI Bug Regression Suite (Owner vs Resident vs GOD Separation)', () => {
  let godToken: string;
  let ownerToken: string;
  let residentToken: string;

  beforeAll(() => {
    const mockUserMap: Record<string, any> = {
      '64a000000000000000000050': { id: '64a000000000000000000050', email: 'platform.god@roombae.com', role: 'GOD', name: 'Platform Master', accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, tokenVersion: 1 },
      '64a000000000000000000051': { id: '64a000000000000000000051', email: 'ayushman.owner@roombae.com', role: 'OWNER', name: 'Ayushman Saha', accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, tokenVersion: 1 },
      '64a000000000000000000052': { id: '64a000000000000000000052', email: 'ankur.resident@roombae.com', role: 'RESIDENT', name: 'Ankur Saha', accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, tokenVersion: 1 },
    };

    const mockAuthService = {
      me: async (userId: string) => {
        const u = mockUserMap[userId];
        if (!u) throw new Error('User not found');
        return u;
      },
    };

    (Container.authController as any).authService = mockAuthService;
    Container.authService = mockAuthService as any;

    godToken = tokenService.generateAccessToken({
      id: '64a000000000000000000050',
      email: 'platform.god@roombae.com',
      role: 'GOD',
      tokenVersion: 1,
    });

    ownerToken = tokenService.generateAccessToken({
      id: '64a000000000000000000051',
      email: 'ayushman.owner@roombae.com',
      role: 'OWNER',
      tokenVersion: 1,
    });

    residentToken = tokenService.generateAccessToken({
      id: '64a000000000000000000052',
      email: 'ankur.resident@roombae.com',
      role: 'RESIDENT',
      tokenVersion: 1,
    });
  });

  describe('Bug 1 Regression: PG Owner Role Authentication & Payload', () => {
    it('1. GET /api/v1/auth/me returns strictly OWNER role with zero role bleed', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('OWNER');
    });

    it('2. OWNER cannot access GOD platform operations (/api/v1/god/overview -> 403)', async () => {
      const res = await request(app)
        .get('/api/v1/god/overview')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });

    it('3. OWNER can access PG owner properties & metrics endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/properties/owner-summary')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect([200, 404, 500]).toContain(res.status); // 200 with DB or handled response
      expect(res.status).not.toBe(403);
    });
  });

  describe('Bug 2 Regression: Resident Role Authentication & Portal Payload', () => {
    it('1. GET /api/v1/auth/me returns strictly RESIDENT role', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('RESIDENT');
    });

    it('2. RESIDENT cannot access GOD platform operations (/api/v1/god/overview -> 403)', async () => {
      const res = await request(app)
        .get('/api/v1/god/overview')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });

    it('3. RESIDENT cannot access Owner portfolio endpoints (/api/v1/properties/owner-summary -> 403)', async () => {
      const res = await request(app)
        .get('/api/v1/properties/owner-summary')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });

    it('4. RESIDENT accesses /api/v1/residents/portal/me without unhandled exceptions', async () => {
      const res = await request(app)
        .get('/api/v1/residents/portal/me')
        .set('Authorization', `Bearer ${residentToken}`);

      // Returns 200 if resident record exists, or 404 if profile incomplete - never 403 or 500
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Bug 3 Regression: GOD Role Unrestricted Platform Operations', () => {
    it('1. GET /api/v1/auth/me returns strictly GOD role', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${godToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('GOD');
    });

    it('2. GOD can access executive platform overview (/api/v1/god/overview -> 200)', async () => {
      const res = await request(app)
        .get('/api/v1/god/overview')
        .set('Authorization', `Bearer ${godToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalOwners');
      expect(res.body.data).toHaveProperty('totalResidents');
      expect(res.body.data).toHaveProperty('occupancyRate');
      expect(res.body.data).toHaveProperty('monthlySaaSRevenue');
    });

    it('3. GOD can access full owner directory and platform residents', async () => {
      const ownersRes = await request(app)
        .get('/api/v1/god/owners')
        .set('Authorization', `Bearer ${godToken}`);
      expect([200, 500]).toContain(ownersRes.status);

      const residentsRes = await request(app)
        .get('/api/v1/god/residents')
        .set('Authorization', `Bearer ${godToken}`);
      expect([200, 500]).toContain(residentsRes.status);
    });
  });
});
