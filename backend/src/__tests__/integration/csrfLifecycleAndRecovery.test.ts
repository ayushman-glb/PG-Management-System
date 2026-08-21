import request from 'supertest';
import { app } from '../../app';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

const tokenService = new JwtTokenService();

describe('CSRF Full Lifecycle, Auto-Recovery & Double-Submit Protection', () => {
  let validToken: string;

  beforeAll(() => {
    validToken = tokenService.generateAccessToken({
      id: '64a000000000000000000020',
      email: 'csrf.user@roombae.com',
      role: 'OWNER',
      tokenVersion: 1,
    });
  });

  it('1. should reject state-mutating POST request missing x-csrf-token with 403 CSRF_INVALID/MISSING', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Cookie', 'csrf-token=dummy_csrf_token_value')
      .set('Origin', 'https://ayushman-glb.github.io')
      .send({
        name: 'CSRF Tester',
        email: 'csrf.tester@roombae.com',
        password: 'Password123!',
        role: 'RESIDENT',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('2. should obtain fresh Double-Submit CSRF cookie and token from GET /api/v1/auth/csrf-token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/csrf-token')
      .set('Origin', 'https://ayushman-glb.github.io');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('csrfToken');
    expect(typeof res.body.data.csrfToken).toBe('string');
  });

  it('3. should allow state-mutating request when valid x-csrf-token and cookie are attached', async () => {
    // 1. Get CSRF token
    const csrfRes = await request(app)
      .get('/api/v1/auth/csrf-token')
      .set('Origin', 'https://ayushman-glb.github.io');

    const csrfToken = csrfRes.body.data.csrfToken;
    const cookies = csrfRes.headers['set-cookie'] || [];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : (cookies || '');

    // 2. Perform mutating request with CSRF token and cookie
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookieHeader)
      .set('Origin', 'https://ayushman-glb.github.io')
      .send({
        name: 'CSRF Valid',
        email: 'csrf.valid@roombae.com',
        password: 'Password123!',
        role: 'RESIDENT',
      });

    // Request passes CSRF filter (400/409/201 but never 403)
    expect(res.status).not.toBe(403);
  });

  it('4. should reject tampered / forged CSRF token with 403', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('x-csrf-token', 'forged_tampered_csrf_token_payload')
      .set('Origin', 'https://ayushman-glb.github.io')
      .send({
        name: 'CSRF Attacker',
      });

    expect(res.status).toBe(403);
  });
});
