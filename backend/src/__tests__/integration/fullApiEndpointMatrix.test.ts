import request from 'supertest';
import { app } from '../../app';
import { createSignedCsrfToken } from '../../middleware/csrfMiddleware';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

const tokenService = new JwtTokenService();
const GITHUB_PAGES_ORIGIN = 'https://ayushman-glb.github.io';

describe('Full RoomBae API Endpoint & Security Verification Suite', () => {
  let validCsrfToken: string;
  let mockAccessToken: string;

  beforeAll(() => {
    validCsrfToken = createSignedCsrfToken();
    mockAccessToken = tokenService.generateAccessToken({
      id: 'usr_test_verification_001',
      email: 'verified_user@roombae.com',
      role: 'ADMIN',
      tokenVersion: 0,
    });
  });

  // ── 1. Pipeline & Health Self-Diagnostics ───────────────────────────────────────
  describe('Pipeline Health & Infrastructure Endpoints', () => {
    test('GET /live -> returns 200 ALIVE status', async () => {
      const res = await request(app).get('/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ALIVE');
    });

    test('GET / -> returns 200 App Info envelope', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.version).toBeDefined();
    });

    test('GET /api/v1/health/pipeline-test -> returns 200 with correlation ID and IP', async () => {
      const res = await request(app)
        .get('/api/v1/health/pipeline-test')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('x-correlation-id', 'test-corr-12345');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('HEALTHY');
      expect(res.body.data.correlationId).toBe('test-corr-12345');
    });

    test('GET /api/v1/unmatched-nonexistent-route -> returns standardized 404 JSON envelope (never Express HTML)', async () => {
      const res = await request(app).get('/api/v1/unmatched-nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  // ── 2. CORS & Preflight Verification ────────────────────────────────────────────
  describe('CORS Cross-Origin Handshake & Preflight', () => {
    test('OPTIONS /api/v1/auth/login with GitHub Pages origin -> 204 No Content with CORS headers', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, x-csrf-token, Authorization');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(GITHUB_PAGES_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    test('OPTIONS with unauthorized origin -> returns 204 without Allow-Origin (never 500 crash)', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://unauthorized-attacker.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).not.toBe(500);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // ── 3. CSRF Protection & Bootstrap ─────────────────────────────────────────────
  describe('CSRF Token Bootstrap & Double-Submit Enforcement', () => {
    test('GET /api/v1/auth/csrf-token -> returns 200 with Set-Cookie and JSON payload', async () => {
      const res = await request(app)
        .get('/api/v1/auth/csrf-token')
        .set('Origin', GITHUB_PAGES_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.csrfToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('POST /api/v1/auth/login with cookie but missing CSRF header -> rejected with 403 CSRF_MISSING envelope', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('Cookie', [`csrf-token=${validCsrfToken}`])
        .send({ identifier: 'test@roombae.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_MISSING');
    });

    test('POST /api/v1/auth/login with mismatched CSRF cookie & header -> rejected with 403 CSRF_INVALID', async () => {
      const otherSignedToken = createSignedCsrfToken();
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('Cookie', [`csrf-token=${validCsrfToken}`])
        .set('x-csrf-token', otherSignedToken)
        .send({ identifier: 'test@roombae.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_INVALID');
    });

    test('POST /api/v1/auth/refresh-token with cookie but missing CSRF header -> rejected with 403 CSRF_MISSING', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('Cookie', [`csrf-token=${validCsrfToken}`])
        .send({ refreshToken: 'dummy_refresh' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_MISSING');
    });
  });

  // ── 4. Error Handling & Payload Validation ──────────────────────────────────────
  describe('Global Error Formatter & JSON Parsing Validation', () => {
    test('POST with malformed JSON body -> returns 400 INVALID_JSON standard envelope', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('Content-Type', 'application/json')
        .set('Cookie', [`csrf-token=${validCsrfToken}`])
        .set('x-csrf-token', validCsrfToken)
        .send('{"malformed_json: broken');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });

    test('POST with invalid schema body -> returns 400 VALIDATION_ERROR envelope with error list', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', GITHUB_PAGES_ORIGIN)
        .set('Cookie', [`csrf-token=${validCsrfToken}`])
        .set('x-csrf-token', validCsrfToken)
        .send({}); // Missing identifier & password

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('GET protected route with invalid JWT signature -> returns 401 INVALID_TOKEN envelope', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  // ── 5. Standard Module Endpoints Verification Matrix ────────────────────────────
  describe('Core API Modules Endpoint Envelope Checks', () => {
    test('GET /api/v1/properties/search -> returns 200 success envelope', async () => {
      const res = await request(app).get('/api/v1/properties/search');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data?.properties || res.body.data)).toBe(true);
    });

    test('GET /api/v1/search -> returns 200 success envelope', async () => {
      const res = await request(app).get('/api/v1/search?query=test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/v1/dashboard/overview -> returns 200 or 401 clean envelope', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      // Must be a clean JSON envelope, never raw 500 HTML
      expect([200, 401, 403]).toContain(res.status);
      expect(typeof res.body.success).toBe('boolean');
    });

    test('GET /api/v1/dashboard/revenue -> returns clean JSON envelope', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/revenue')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect([200, 401, 403]).toContain(res.status);
      expect(typeof res.body.success).toBe('boolean');
    });

    test('GET /api/v1/dashboard/occupancy -> returns clean JSON envelope', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/occupancy')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect([200, 401, 403]).toContain(res.status);
      expect(typeof res.body.success).toBe('boolean');
    });

    test('GET /api/v1/settings/audit-logs -> returns clean JSON envelope', async () => {
      const res = await request(app)
        .get('/api/v1/settings/audit-logs')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect([200, 401, 403]).toContain(res.status);
      expect(typeof res.body.success).toBe('boolean');
    });

    test('GET /api/v1/notifications -> returns clean JSON envelope', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect([200, 401, 403]).toContain(res.status);
      expect(typeof res.body.success).toBe('boolean');
    });
  });
});
