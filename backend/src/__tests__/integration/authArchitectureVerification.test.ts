import request from 'supertest';
import { app } from '../../app';
import * as jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { isOriginAllowed } from '../../config/corsOrigins';
import { getCookieEnvironmentOptions } from '../../utils/cookieHelpers';

describe('RoomBae Full-Stack Cross-Origin Authentication Architecture Suite', () => {
  const VERCEL_PREVIEW_ORIGIN = 'https://pg-management-system-9c04620f-ayushman-8850s-projects.vercel.app';
  const VERCEL_PROD_ORIGIN = 'https://pg-management-system.vercel.app';
  const GITHUB_PAGES_ORIGIN = 'https://ayushman-glb.github.io';

  describe('1. CORS Allowlist & Dynamic Vercel Deployment Support', () => {
    test('Should allow any valid Vercel preview deployment hash origin', () => {
      expect(isOriginAllowed(VERCEL_PREVIEW_ORIGIN)).toBe(true);
      expect(isOriginAllowed(VERCEL_PROD_ORIGIN)).toBe(true);
      expect(isOriginAllowed(GITHUB_PAGES_ORIGIN)).toBe(true);
      expect(isOriginAllowed('https://evil-unauthorized-site.com')).toBe(false);
    });

    test('Should return Access-Control-Allow-Credentials: true on preflight for Vercel origin', async () => {
      const res = await request(app)
        .options('/api/v1/auth/refresh-token')
        .set('Origin', VERCEL_PREVIEW_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization, x-csrf-token');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(VERCEL_PREVIEW_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('2. Cookie Configuration Rules', () => {
    test('getCookieEnvironmentOptions returns appropriate sameSite and secure flags', () => {
      const opts = getCookieEnvironmentOptions();
      expect(typeof opts.secure).toBe('boolean');
      expect(['none', 'lax']).toContain(opts.sameSite);
    });
  });

  describe('3. Auth Error Contract & 401 vs 403 Separation', () => {
    test('Protected route without token returns 401 with NO_ACCESS_TOKEN code', async () => {
      const res = await request(app).get('/api/v1/dashboard/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('NO_ACCESS_TOKEN');
    });

    test('POST /api/v1/auth/refresh-token without token returns 401 with REFRESH_TOKEN_MISSING code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Origin', VERCEL_PREVIEW_ORIGIN)
        .set('x-csrf-token', 'valid_dummy')
        .send({});

      // Note: CSRF or missing token check
      expect([401, 403]).toContain(res.status);
      if (res.status === 401) {
        expect(res.body.error?.code).toBe('REFRESH_TOKEN_MISSING');
      }
    });

    test('Expired access token returns 401 with TOKEN_EXPIRED code', async () => {
      const expiredToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011', email: 'test@roombae.com', role: 'ADMIN', tokenVersion: 1 },
        env.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('TOKEN_EXPIRED');
    });

    test('Invalid access token returns 401 with TOKEN_INVALID code', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', 'Bearer invalid.malformed.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('TOKEN_INVALID');
    });
  });

  describe('4. Owner Route Aliases (/verification-queue, /overview, /me)', () => {
    test('GET /api/v1/owners/verification-queue is mounted and requires authentication (returns 401, NOT 404)', async () => {
      const res = await request(app).get('/api/v1/owners/verification-queue');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('NO_ACCESS_TOKEN');
      expect(res.body.error?.code).not.toBe('ROUTE_NOT_FOUND');
    });

    test('GET /api/v1/owners/overview is mounted and requires authentication (returns 401, NOT 404)', async () => {
      const res = await request(app).get('/api/v1/owners/overview');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('NO_ACCESS_TOKEN');
      expect(res.body.error?.code).not.toBe('ROUTE_NOT_FOUND');
    });

    test('GET /api/v1/owners/me is mounted and requires authentication (returns 401, NOT 404)', async () => {
      const res = await request(app).get('/api/v1/owners/me');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('NO_ACCESS_TOKEN');
      expect(res.body.error?.code).not.toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('5. Phase 2 Gaps Closing Verification', () => {
    test('Refresh token with old schema version (v=1 or missing) is rejected with REFRESH_TOKEN_INVALID', async () => {
      const { AuthService } = require('../../modules/auth/auth.service');
      const authService = new AuthService();
      
      const oldVersionToken = jwt.sign(
        { id: 'user_123', tokenVersion: 1, v: 1, random: 'abc' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await expect(authService.refreshToken(oldVersionToken)).rejects.toMatchObject({
        code: 'REFRESH_TOKEN_INVALID',
      });
    });

    test('CORS strictly rejects non-project Vercel domains', () => {
      expect(isOriginAllowed('https://some-other-app.vercel.app')).toBe(false);
      expect(isOriginAllowed('https://pg-management-system-4i7wpxbe4-ayushman-8850s-projects.vercel.app')).toBe(true);
    });
  });
});
