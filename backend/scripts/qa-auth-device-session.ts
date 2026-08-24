import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const PORT = 5005;
let server: http.Server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

interface ITestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: ITestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ suite: 'Authentication & Session Security', name, passed: true, durationMs });
    console.log(`\x1b[32m[PASS]\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    results.push({ suite: 'Authentication & Session Security', name, passed: false, durationMs, error });
    console.error(`\x1b[31m[FAIL]\x1b[0m ${name} (${durationMs}ms)\n       Error: ${error}`);
  }
}

async function apiRequest(path: string, options: RequestInit = {}): Promise<{ status: number; body: any; headers: Headers }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, headers: res.headers };
}

export async function runAuthDeviceSessionSuite(): Promise<{ total: number; passed: number; failed: number; results: ITestResult[] }> {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_RATE_LIMIT = 'true';

  console.log('\n================================================================');
  console.log('🔑 MODULE 3: AUTHENTICATION, OAUTH, DEVICES, SESSIONS & OTP');
  console.log('================================================================\n');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const testEmail = `qa_auth_cycle_${Date.now()}@roombae.com`;
  const testUsername = `qa_usr_${Date.now().toString().slice(-6)}`;
  let testUserId = '';
  let testAccessToken = '';

  try {
    // 1. Password Policy & Registration Validation
    await test('3.1 User Registration & Password Strength Policy', async () => {
      // Weak password attempt (no uppercase, no special char)
      const weakRes = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          username: testUsername,
          phone: `+9188${Date.now().toString().slice(-8)}`,
          password: 'weak',
          firstName: 'QA',
          lastName: 'Tester',
          role: Role.RESIDENT,
        }),
      });
      if (weakRes.status === 200 || weakRes.status === 201) {
        throw new Error('Weak password was unexpectedly accepted');
      }

      // Strong valid registration
      const regRes = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          username: testUsername,
          phone: `+9188${Date.now().toString().slice(-8)}`,
          password: 'StrongPassword@#2026',
          firstName: 'QA',
          lastName: 'Tester',
          role: Role.RESIDENT,
          visitorId: 'vis_primary_device_test_01',
          deviceLabel: 'Primary Test Machine',
        }),
      });

      if (regRes.status !== 201 && regRes.status !== 200) {
        throw new Error(`Valid registration failed: ${JSON.stringify(regRes.body)}`);
      }

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (!user) throw new Error('Registered user not found in database');
      testUserId = user.id;

      // Duplicate email attempt must fail with 409 Conflict
      const dupRes = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          username: `diff_${testUsername}`,
          phone: `+9189${Date.now().toString().slice(-8)}`,
          password: 'StrongPassword@#2026',
          firstName: 'QA',
          lastName: 'Tester',
          role: Role.RESIDENT,
        }),
      });
      if (dupRes.status !== 409) {
        throw new Error(`Expected 409 for duplicate email, got ${dupRes.status}`);
      }
    });

    // 2. Primary Device Authorization Rule
    await test('3.2 Device Fingerprinting & Primary Device Ownership Rules', async () => {
      // Login with primary device
      const loginRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: testEmail,
          password: 'StrongPassword@#2026',
          visitorId: 'vis_primary_device_test_01',
        }),
      });
      if (loginRes.status !== 200) throw new Error(`Primary device login failed: ${JSON.stringify(loginRes.body)}`);

      if (loginRes.body.data?.require2FA) {
        const verify2FaRes = await apiRequest('/auth/verify-2fa', {
          method: 'POST',
          body: JSON.stringify({
            twoFactorToken: loginRes.body.data.twoFactorToken,
            otp: '654123',
            visitorId: 'vis_primary_device_test_01',
          }),
        });
        if (verify2FaRes.status !== 200) {
          throw new Error(`2FA verification failed: ${JSON.stringify(verify2FaRes.body)}`);
        }
        testAccessToken = verify2FaRes.body.data.accessToken;
      } else {
        testAccessToken = loginRes.body.data.accessToken;
      }

      // Verify device was recorded as primary
      const primaryDev = await prisma.device.findFirst({
        where: { userId: testUserId, visitorId: 'vis_primary_device_test_01' },
      });
      if (!primaryDev?.isPrimary) {
        throw new Error('First device was not designated as PRIMARY');
      }

      // Login with second device
      const secLogin = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: testEmail,
          password: 'StrongPassword@#2026',
          visitorId: 'vis_secondary_device_test_02',
          deviceLabel: 'Secondary Device',
        }),
      });
      if (secLogin.status !== 200) throw new Error('Secondary device login failed');

      const secondaryDev = await prisma.device.findFirst({
        where: { userId: testUserId, visitorId: 'vis_secondary_device_test_02' },
      });
      if (secondaryDev?.isPrimary) {
        throw new Error('Secondary device was unexpectedly granted PRIMARY status');
      }
    });

    // 3. Universal Session Revocation (Logout All)
    await test('3.3 Universal Session Revocation (Logout All Invalidates All Tokens Instantly)', async () => {
      const userBefore = await prisma.user.findUnique({ where: { id: testUserId } });
      const initialVersion = userBefore?.tokenVersion || 0;

      // Call logout-all
      const logoutAllRes = await apiRequest('/auth/logout-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testAccessToken}` },
      });
      if (logoutAllRes.status !== 200) {
        throw new Error(`Logout all failed: ${JSON.stringify(logoutAllRes.body)}`);
      }

      // Verify token version incremented
      const userAfter = await prisma.user.findUnique({ where: { id: testUserId } });
      if ((userAfter?.tokenVersion || 0) <= initialVersion) {
        throw new Error('Token version was not incremented during logout-all');
      }

      // Old token must now be rejected with 401 Unauthorized
      const protectedRes = await apiRequest('/bookings/resident', {
        headers: { Authorization: `Bearer ${testAccessToken}` },
      });
      if (protectedRes.status !== 401) {
        throw new Error(`Revoked token was still accepted! Status: ${protectedRes.status}`);
      }
    });

    // 4. OTP Protocol & Secure Fallback
    await test('3.4 OTP Protocol Verification & Controlled Fallback (654123)', async () => {
      // Create a test OTP in database
      const codeHash = await bcrypt.hash('998877', 10);
      await prisma.oTP.create({
        data: {
          identifier: testEmail,
          userId: testUserId,
          type: 'EMAIL_VERIFICATION',
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          maxAttempts: 5,
        },
      });

      // Verification with incorrect code must fail
      const wrongOtpRes = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, otp: '111111' }),
      });
      if (wrongOtpRes.status === 200) {
        throw new Error('Wrong OTP was unexpectedly accepted');
      }

      // Verification with controlled fallback 654123 must succeed
      const fallbackOtpRes = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, otp: '654123' }),
      });
      if (fallbackOtpRes.status !== 200) {
        throw new Error(`Fallback OTP 654123 failed: ${JSON.stringify(fallbackOtpRes.body)}`);
      }

      // Verify emailVerified status updated on user
      const verifiedUser = await prisma.user.findUnique({ where: { id: testUserId } });
      if (!verifiedUser?.emailVerified) {
        throw new Error('User emailVerified was not set to true after successful OTP verification');
      }
    });

  } finally {
    if (testUserId) {
      await prisma.device.deleteMany({ where: { userId: testUserId } });
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.oTP.deleteMany({ where: { userId: testUserId } });
      await prisma.userProfile.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (require.main === module) {
  runAuthDeviceSessionSuite()
    .then(({ passed, failed }) => {
      console.log(`\nModule 3 Completed: ${passed} passed, ${failed} failed.\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Module 3 Error:', err);
      process.exit(1);
    });
}
