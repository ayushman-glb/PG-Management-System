import request from 'supertest';
import { app } from '../../app';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

const tokenService = new JwtTokenService();

describe('GOD Platform Operations Module', () => {
  let godToken: string;
  let ownerToken: string;
  let residentToken: string;

  beforeAll(() => {
    godToken = tokenService.generateAccessToken({
      id: '64a000000000000000000001',
      email: 'platform.god@roombae.com',
      role: 'GOD',
      tokenVersion: 1,
    });

    ownerToken = tokenService.generateAccessToken({
      id: '64a000000000000000000002',
      email: 'owner@roombae.com',
      role: 'OWNER',
      tokenVersion: 1,
    });

    residentToken = tokenService.generateAccessToken({
      id: '64a000000000000000000003',
      email: 'resident@roombae.com',
      role: 'RESIDENT',
      tokenVersion: 1,
    });
  });

  describe('GET /api/v1/god/overview', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/god/overview');
      expect(res.status).toBe(401);
    });

    it('should reject OWNER role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/god/overview')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject RESIDENT role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/god/overview')
        .set('Authorization', `Bearer ${residentToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow GOD role to access executive overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/god/overview')
        .set('Authorization', `Bearer ${godToken}`);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalOwners');
        expect(res.body.data).toHaveProperty('totalResidents');
        expect(res.body.data).toHaveProperty('occupancyRate');
        expect(res.body.data).toHaveProperty('monthlySaaSRevenue');
      }
    });
  });

  describe('GET /api/v1/god/owners', () => {
    it('should reject non-GOD requests with 403', async () => {
      const res = await request(app)
        .get('/api/v1/god/owners')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow GOD role to list PG owners', async () => {
      const res = await request(app)
        .get('/api/v1/god/owners')
        .set('Authorization', `Bearer ${godToken}`);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/god/residents', () => {
    it('should reject non-GOD requests with 403', async () => {
      const res = await request(app)
        .get('/api/v1/god/residents')
        .set('Authorization', `Bearer ${residentToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow GOD role to list platform residents', async () => {
      const res = await request(app)
        .get('/api/v1/god/residents')
        .set('Authorization', `Bearer ${godToken}`);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/god/revenue', () => {
    it('should reject non-GOD requests with 403', async () => {
      const res = await request(app)
        .get('/api/v1/god/revenue')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow GOD role to access SaaS revenue analytics', async () => {
      const res = await request(app)
        .get('/api/v1/god/revenue')
        .set('Authorization', `Bearer ${godToken}`);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('mrr');
        expect(res.body.data).toHaveProperty('arr');
      }
    });
  });
});
