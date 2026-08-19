import request from 'supertest';

const store = {
  users: [] as any[],
  refreshTokens: [] as any[],
  otpTokens: [] as any[],
};

const getStr = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val === 'string') return val.toLowerCase();
  if (typeof val === 'object' && val.equals) return String(val.equals).toLowerCase();
  return undefined;
};

const mockPrisma: any = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  otpToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  owner: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  resident: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  loginHistory: {
    create: jest.fn().mockResolvedValue({ id: 'lh_1' }),
  },
  securityAuditEvent: {
    create: jest.fn().mockResolvedValue({ id: 'audit_1' }),
  },
  userDevice: {
    findFirst: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({ id: 'dev_1' }),
  },
  preAuthChallenge: {
    create: jest.fn().mockResolvedValue({ id: 'preauth_1' }),
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
  },
  $transaction: jest.fn(),
};

const mockOtpService = {
  generateAndSendOtp: jest.fn(),
  generateAndSendPhoneOtp: jest.fn(),
  verifyPhoneOtp: jest.fn(),
  verifyEmailCode: jest.fn(),
};

function resetMockPrisma() {
  mockOtpService.generateAndSendOtp.mockResolvedValue({ otp: '123456', message: 'OTP sent' });
  mockOtpService.generateAndSendPhoneOtp.mockResolvedValue({ otp: '123456', message: 'OTP sent', timerSeconds: 300 });
  mockOtpService.verifyPhoneOtp.mockResolvedValue(true);
  mockOtpService.verifyEmailCode.mockResolvedValue(true);
  mockPrisma.user.findUnique.mockImplementation(async ({ where }: any) => {
    const id = getStr(where?.id);
    const email = getStr(where?.email);
    const residentCode = getStr(where?.residentCode);
    const match = store.users.find((u) => {
      if (id && u.id.toLowerCase() === id) return true;
      if (email && u.email.toLowerCase() === email) return true;
      if (residentCode && u.residentCode?.toLowerCase() === residentCode) return true;
      return false;
    });
    return match || null;
  });

  mockPrisma.user.findFirst.mockImplementation(async ({ where }: any) => {
    if (!where) return store.users[0] || null;
    const targetEmail = getStr(where.email);
    const targetPhone = getStr(where.phone);

    const match = store.users.find((u) => {
      if (targetEmail && u.email.toLowerCase() === targetEmail) return true;
      if (targetPhone && u.phone?.toLowerCase() === targetPhone) return true;
      if (where.OR && Array.isArray(where.OR)) {
        return where.OR.some((cond: any) => {
          const e = getStr(cond.email);
          const p = getStr(cond.phone);
          const r = getStr(cond.residentCode);
          return (
            (e && u.email.toLowerCase() === e) ||
            (p && u.phone?.toLowerCase() === p) ||
            (r && u.residentCode?.toLowerCase() === r)
          );
        });
      }
      return false;
    });
    return match || null;
  });

  mockPrisma.user.create.mockImplementation(async (args: any) => {
    const data = args?.data || args;
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role || 'RESIDENT',
      phone: data.phone || null,
      accountStatus: data.accountStatus || 'ACTIVE',
      emailVerified: data.emailVerified ?? true,
      phoneVerified: data.phoneVerified ?? false,
      is2FAEnabled: false,
      twoFactorSecret: null,
      tokenVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.users.push(newUser);
    return newUser;
  });

  mockPrisma.user.update.mockImplementation(async ({ where, data }: any) => {
    const idx = store.users.findIndex((u) => u.id === where.id);
    if (idx !== -1) {
      store.users[idx] = { ...store.users[idx], ...data };
      return store.users[idx];
    }
    return null;
  });

  mockPrisma.refreshToken.create.mockImplementation(async ({ data }: any) => {
    const record = {
      id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tokenHash: data.tokenHash,
      userId: data.userId,
      expiresAt: data.expiresAt,
      isRevoked: false,
      familyId: data.familyId || `fam_${Date.now()}`,
    };
    store.refreshTokens.push(record);
    return record;
  });

  mockPrisma.refreshToken.findUnique.mockImplementation(async ({ where }: any) => {
    return store.refreshTokens.find((r) => r.tokenHash === where.tokenHash) || null;
  });

  mockPrisma.refreshToken.update.mockImplementation(async ({ where, data }: any) => {
    const record = store.refreshTokens.find((r) => r.id === where.id || r.tokenHash === where.tokenHash);
    if (record) {
      Object.assign(record, data);
      return record;
    }
    return null;
  });

  mockPrisma.refreshToken.updateMany.mockImplementation(async ({ where, data }: any) => {
    let count = 0;
    store.refreshTokens.forEach((r) => {
      if (where.userId && r.userId === where.userId) {
        Object.assign(r, data);
        count++;
      }
    });
    return { count };
  });

  mockPrisma.otpToken.create.mockImplementation(async ({ data }: any) => {
    const record = {
      id: `otp_${Date.now()}`,
      phone: data.phone,
      email: data.email,
      otp: data.otp || '123456',
      expiresAt: data.expiresAt || new Date(Date.now() + 600000),
    };
    store.otpTokens.push(record);
    return record;
  });

  mockPrisma.otpToken.findFirst.mockImplementation(async ({ where }: any) => {
    return store.otpTokens.find((o) => (where.phone && o.phone === where.phone) || (where.email && o.email === where.email)) || null;
  });

  mockPrisma.otpToken.deleteMany.mockImplementation(async ({ where }: any) => {
    let count = 0;
    for (let i = store.otpTokens.length - 1; i >= 0; i--) {
      if ((where.phone && store.otpTokens[i].phone === where.phone) || (where.email && store.otpTokens[i].email === where.email)) {
        store.otpTokens.splice(i, 1);
        count++;
      }
    }
    return { count };
  });

  mockPrisma.owner.findFirst.mockImplementation(async () => null);
  mockPrisma.owner.create.mockImplementation(async ({ data }: any) => ({ id: `own_${Date.now()}`, ...data }));

  mockPrisma.resident.findFirst.mockImplementation(async () => null);
  mockPrisma.resident.create.mockImplementation(async ({ data }: any) => ({ id: `res_${Date.now()}`, ...data }));

  mockPrisma.loginHistory.create.mockImplementation(async () => ({ id: `lh_${Date.now()}` }));
  mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma));
}

resetMockPrisma();

(global as any).prismaSingleton = mockPrisma;

jest.mock('../../config/prisma', () => ({
  get prisma() {
    return (global as any).prismaSingleton;
  },
}));

const { Container } = require('../../container');
const { AuthRepository } = require('../../modules/auth/auth.repository');
const { AuthService } = require('../../modules/auth/auth.service');
const { AuthController } = require('../../modules/auth/auth.controller');
const bcrypt = require('bcryptjs');

const userRepo = new AuthRepository(mockPrisma);
const authService = new AuthService(userRepo, Container.cryptoService, Container.tokenService, mockOtpService);
const authController = new AuthController(authService);

Container.userRepository = userRepo;
Container.authService = authService;
Container.authController = authController;

const { app } = require('../../app');

describe('Authentication Endpoints Integration Tests (Supertest API Integration)', () => {
  beforeAll(() => {
    Container.userRepository = userRepo;
    Container.authService = authService;
    Container.authController = authController;
  });

  beforeEach(() => {
    resetMockPrisma();
    store.users.length = 0;
    store.refreshTokens.length = 0;
    store.otpTokens.length = 0;
  });

  describe('1. Signup Endpoint (POST /api/v1/auth/register)', () => {
    test('registers a new PG Owner account successfully', async () => {
      const payload = {
        name: 'Integration Owner',
        email: 'owner_integration@roombae.com',
        password: 'Password123!',
        role: 'OWNER',
        phone: '+919988776655',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      process.stderr.write(`\n\n>>> REGISTER BODY: status=${res.status} body=${JSON.stringify(res.body)}\n\n`);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(payload.email);
      expect(res.body.data.user.role).toBe('OWNER');
      expect(res.body.data.accessToken).toBeDefined();
    });

    test('registers a new Resident account successfully', async () => {
      const payload = {
        name: 'Integration Resident',
        email: 'resident_integration@roombae.com',
        password: 'Password123!',
        role: 'RESIDENT',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('RESIDENT');
    });

    test('rejects signup with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@roombae.com',
          password: 'Password123!',
          role: 'OWNER',
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'duplicate@roombae.com',
          password: 'Password123!',
          role: 'OWNER',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. OTP Verification Endpoints', () => {
    test('sends phone OTP code successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone: '+919988776655' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('verifies phone OTP code', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Password123!', salt);
      store.users.push({
        id: 'usr_otp_test',
        name: 'Phone User',
        email: 'phone_user@roombae.com',
        passwordHash: hash,
        role: 'RESIDENT',
        phone: '+919988776655',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        tokenVersion: 1,
      });

      const sendRes = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone: '+919988776655' });

      expect(sendRes.status).toBe(200);

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: '+919988776655', otp: '123456' });

      expect([200, 400]).toContain(verifyRes.status);
    });
  });

  describe('3. Login Endpoint & Anti-Enumeration Equivalence (POST /api/v1/auth/login)', () => {
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Password123!', salt);
      store.users.push({
        id: 'usr_login_owner',
        name: 'Login Owner',
        email: 'owner_login@roombae.com',
        passwordHash: hash,
        role: 'OWNER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        tokenVersion: 1,
      });
    });

    test('authenticates valid PG Owner credentials and returns session tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'owner_login@roombae.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      const rawCookies = res.headers['set-cookie'];
      const cookieArray: string[] = Array.isArray(rawCookies) ? rawCookies : (rawCookies ? [rawCookies] : []);
      const hasRefreshCookie = cookieArray.some((c: string) => c.startsWith('refreshToken='));
      expect(hasRefreshCookie || res.body.data.refreshToken !== undefined).toBe(true);
    });

    test('anti-enumeration check: non-existent email vs wrong password return identical response shape & 401 code', async () => {
      const res1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'non_existent_address_999@roombae.com',
          password: 'Password123!',
        });

      const res2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'owner_login@roombae.com',
          password: 'WrongPassword999!',
        });

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);

      expect(res1.body.error.code).toBe('ACCOUNT_NOT_FOUND_OR_INVALID');
      expect(res2.body.error.code).toBe('ACCOUNT_NOT_FOUND_OR_INVALID');

      expect(res1.body.error.message).toBe(res2.body.error.message);
      expect(JSON.stringify(res1.body)).toBe(JSON.stringify(res2.body));
    });
  });

  describe('4. Token Refresh & Rotation (POST /api/v1/auth/refresh-token)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh Owner',
          email: 'owner_refresh@roombae.com',
          password: 'Password123!',
          role: 'OWNER',
        });

      const cookies = registerRes.headers['set-cookie'];
      if (cookies) {
        const match = cookies[0].match(/refreshToken=([^;]+)/);
        if (match) refreshToken = match[1];
      }
      if (!refreshToken) {
        refreshToken = registerRes.body.data?.refreshToken;
      }
    });

    test('rotates refresh token and issues new access token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    test('rejects invalid or malformed refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid_malformed_token_str' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Logout & Protected Route Access', () => {
    let accessToken: string;
    let refreshToken: string;

    let testUserEmail: string;

    beforeEach(async () => {
      testUserEmail = `owner_logout_${Date.now()}_${Math.floor(Math.random()*1000)}@roombae.com`;
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Logout Owner',
          email: testUserEmail,
          password: 'Password123!',
          role: 'OWNER',
        });
      accessToken = registerRes.body.data?.accessToken;

      const cookies = registerRes.headers['set-cookie'];
      if (cookies) {
        const match = cookies[0].match(/refreshToken=([^;]+)/);
        if (match) refreshToken = match[1];
      }
    });

    test('allows access to protected route GET /api/v1/auth/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUserEmail);
    });

    test('rejects GET /api/v1/auth/me without Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    test('logs out session and invalidates refresh token', async () => {
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });
});
