import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, AuthProvider } from '@prisma/client';

const PORT = 5002;
let server: http.Server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

interface ITestResult {
  step: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: ITestResult[] = [];

async function runStep(
  step: string,
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ step, name, passed: true, durationMs });
    console.log(`\x1b[32m[PASS]\x1b[0m ${step}: ${name} (${durationMs}ms)`);
  } catch (error: any) {
    const durationMs = Date.now() - start;
    const details = error?.message || String(error);
    results.push({ step, name, passed: false, durationMs, details });
    console.error(`\x1b[31m[FAIL]\x1b[0m ${step}: ${name} (${durationMs}ms)\n       Error: ${details}`);
  }
}

function makeMockGoogleToken(payload: {
  sub: string;
  email: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
}): string {
  const serialized = JSON.stringify(payload);
  return `mock-test-google-token-${Buffer.from(serialized).toString('base64url')}`;
}

async function request(path: string, options: RequestInit = {}): Promise<{ status: number; body: any; headers: Headers }> {
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

async function main() {
  process.env.SKIP_RATE_LIMIT = 'true';
  process.env.NODE_ENV = 'test';

  console.log('\n================================================================');
  console.log('🚀 ROOMBAE — GOOGLE OAUTH 2.0 & IDENTITY E2E VERIFICATION SUITE');
  console.log('================================================================\n');

  // Start standalone server
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test API Server running on port ${PORT}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now().toString().slice(-6);
  const residentGoogleEmail = `resident.google.${uniqueId}@gmail.com`;
  const residentGoogleSub = `g_sub_resident_${uniqueId}`;

  const ownerGoogleEmail = `owner.google.${uniqueId}@gmail.com`;
  const ownerGoogleSub = `g_sub_owner_${uniqueId}`;

  const existingLocalEmail = `local.user.${uniqueId}@roombae.com`;
  const existingLocalPassword = 'LocalPassword@2026!';
  const existingLocalGoogleSub = `g_sub_local_link_${uniqueId}`;

  let residentAccessToken = '';
  let residentUserId = '';

  try {
    // 01: OAuth Initiation Route
    await runStep('01/14', 'Google OAuth Initiation URL Generation (GET /auth/google?role=RESIDENT)', async () => {
      const { status, body } = await request('/auth/google?role=RESIDENT&format=json');
      if (status !== 200 || !body.data?.authUrl || !body.data.authUrl.includes('accounts.google.com')) {
        throw new Error(`Expected authUrl with Google consent URL, got status ${status}: ${JSON.stringify(body)}`);
      }
    });

    // 02: Admin Registration Exclusion
    await runStep('02/14', 'Admin Exclusion from Google OAuth (POST /auth/google/verify with ADMIN role)', async () => {
      const mockToken = makeMockGoogleToken({
        sub: `admin_sub_${uniqueId}`,
        email: `fakeadmin.${uniqueId}@gmail.com`,
      });
      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'ADMIN' }),
      });
      if (status !== 403) {
        throw new Error(`Expected 403 Forbidden for Admin role, got ${status}: ${JSON.stringify(body)}`);
      }
    });

    // 03: New Resident Registration via Google Token
    await runStep('03/14', 'New Resident Google Registration -> Preliminary Account (POST /auth/google/verify)', async () => {
      const mockToken = makeMockGoogleToken({
        sub: residentGoogleSub,
        email: residentGoogleEmail,
        name: 'Aarav Sharma',
        picture: 'https://images.unsplash.com/photo-mock-avatar',
      });
      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'RESIDENT', visitorId: 'vis_device_1' }),
      });
      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Google registration failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (body.data.isProfileComplete !== false) {
        throw new Error(`Expected isProfileComplete to be false for preliminary Google account`);
      }
      if (body.data.user.role !== Role.RESIDENT) {
        throw new Error(`Expected role RESIDENT, got ${body.data.user.role}`);
      }

      residentAccessToken = body.data.accessToken;
      residentUserId = body.data.user.id;

      // Verify database record
      const identity = await prisma.authIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: AuthProvider.GOOGLE,
            providerSubject: residentGoogleSub,
          },
        },
      });
      if (!identity || identity.providerEmail !== residentGoogleEmail) {
        throw new Error('AuthIdentity record missing or mismatched in MongoDB.');
      }
    });

    // 04: Profile Completion with Phone and Legal Acceptance
    await runStep('04/14', 'Complete Profile Onboarding (POST /auth/complete-profile)', async () => {
      const uniquePhone = `+9198${Date.now().toString().slice(-8)}`;
      const { status, body } = await request('/auth/complete-profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${residentAccessToken}` },
        body: JSON.stringify({
          phone: uniquePhone,
          currentAddress: 'Indiranagar 100ft Road, Bengaluru, 560038',
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'MALE',
          occupation: 'Software Engineer',
          companyOrCollege: 'Google Bengaluru',
          acceptedTermsVersion: 'v1.0',
          acceptedPrivacyVersion: 'v1.0',
        }),
      });

      if (status !== 200 || !body.data?.isProfileComplete) {
        throw new Error(`Complete profile failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (!body.data.phoneVerified) {
        throw new Error(`Expected phoneVerified to be true upon profile completion`);
      }
    });

    // 05: Existing Resident Google Sign-In
    await runStep('05/14', 'Existing Resident Google Sign-In (POST /auth/google/verify)', async () => {
      const mockToken = makeMockGoogleToken({
        sub: residentGoogleSub,
        email: residentGoogleEmail,
        name: 'Aarav Sharma',
      });
      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'RESIDENT', visitorId: 'vis_device_1' }),
      });
      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Existing Google login failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (body.data.isProfileComplete !== true) {
        throw new Error(`Expected isProfileComplete to be true for completed account`);
      }
    });

    // 06: Role Mismatch Prevention (Resident cannot sign in as PG_OWNER)
    await runStep('06/14', 'Role Mismatch Guard: Resident denied PG_OWNER login (POST /auth/google/verify)', async () => {
      const mockToken = makeMockGoogleToken({
        sub: residentGoogleSub,
        email: residentGoogleEmail,
      });
      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'PG_OWNER' }),
      });
      if (status !== 400 || !body.message?.includes('registered with the RESIDENT role')) {
        throw new Error(`Expected 400 Role Mismatch error, got status ${status}: ${JSON.stringify(body)}`);
      }
    });

    // 07: New PG Owner Registration via Google Token
    await runStep('07/14', 'New PG Owner Google Registration (POST /auth/google/verify with PG_OWNER)', async () => {
      const mockToken = makeMockGoogleToken({
        sub: ownerGoogleSub,
        email: ownerGoogleEmail,
        name: 'Vikram PG Owner',
      });
      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'PG_OWNER', visitorId: 'vis_owner_1' }),
      });
      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`PG Owner Google registration failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (body.data.user.role !== Role.PG_OWNER) {
        throw new Error(`Expected role PG_OWNER, got ${body.data.user.role}`);
      }
    });

    // 08: Setting Password for Google-created Account
    await runStep('08/14', 'Create Password for Google User (POST /auth/create-password)', async () => {
      const { status, body } = await request('/auth/create-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${residentAccessToken}` },
        body: JSON.stringify({ password: 'NewSecurePassword@2026!' }),
      });
      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Create password failed with status ${status}: ${JSON.stringify(body)}`);
      }

      residentAccessToken = body.data.accessToken;

      // Verify user can now also log in via standard email/password
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: residentGoogleEmail, password: 'NewSecurePassword@2026!' }),
      });
      if (loginRes.status !== 200 || !loginRes.body.data?.accessToken) {
        throw new Error(`Standard password login failed after setting password: ${JSON.stringify(loginRes.body)}`);
      }
    });

    // 09: Querying Linked Authentication Methods
    await runStep('09/14', 'Query Linked Auth Methods (GET /auth/auth-methods)', async () => {
      const { status, body } = await request('/auth/auth-methods', {
        method: 'GET',
        headers: { Authorization: `Bearer ${residentAccessToken}` },
      });
      if (status !== 200 || !body.data?.isGoogleLinked || !body.data?.hasPassword) {
        throw new Error(`Expected isGoogleLinked and hasPassword to be true, got: ${JSON.stringify(body)}`);
      }
    });

    // 10: Existing Password Account + Google Email Collision Prevention
    await runStep('10/14', 'Account Linking Guard on Email Collision (POST /auth/google/verify)', async () => {
      // Create local user first
      const regRes = await request('/auth/register/resident', {
        method: 'POST',
        body: JSON.stringify({
          email: existingLocalEmail,
          phone: `+9188${Date.now().toString().slice(-8)}`,
          username: `local_user_${uniqueId}`,
          password: existingLocalPassword,
          firstName: 'Local',
          lastName: 'User',
        }),
      });
      if (regRes.status !== 201) {
        throw new Error(`Failed to create local test user: ${JSON.stringify(regRes.body)}`);
      }

      // Disable 2FA on local test user so login directly provides access token in Step 11
      await prisma.user.update({
        where: { email: existingLocalEmail },
        data: { twoFactorEnabled: false },
      });

      // Attempt Google auth with same email but new Google sub
      const mockToken = makeMockGoogleToken({
        sub: existingLocalGoogleSub,
        email: existingLocalEmail,
        name: 'Local User Google',
      });
      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'RESIDENT' }),
      });

      if (status !== 200 || !body.data?.requireAccountLinking) {
        throw new Error(`Expected requireAccountLinking: true to prevent automatic takeover, got: ${JSON.stringify(body)}`);
      }
    });

    // 11: Explicit Account Linking with Password Authentication
    await runStep('11/14', 'Explicit Google Account Linking (POST /auth/google/link)', async () => {
      // Log in as local user
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: existingLocalEmail, password: existingLocalPassword }),
      });
      const localToken = loginRes.body.data?.accessToken;
      if (!localToken) {
        throw new Error(`Local login failed: ${JSON.stringify(loginRes.body)}`);
      }

      const mockToken = makeMockGoogleToken({
        sub: existingLocalGoogleSub,
        email: existingLocalEmail,
      });

      const { status, body } = await request('/auth/google/link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localToken}` },
        body: JSON.stringify({ idToken: mockToken, password: existingLocalPassword }),
      });

      if (status !== 200) {
        throw new Error(`Account linking failed with status ${status}: ${JSON.stringify(body)}`);
      }

      // Verify Google login now works for this user
      const googleLoginRes = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'RESIDENT' }),
      });
      if (googleLoginRes.status !== 200 || !googleLoginRes.body.data?.accessToken) {
        throw new Error(`Google login failed after linking: ${JSON.stringify(googleLoginRes.body)}`);
      }
    });

    // 12: Safe Google Unlinking
    await runStep('12/14', 'Safe Google Unlinking (POST /auth/google/unlink)', async () => {
      const { status, body } = await request('/auth/google/unlink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${residentAccessToken}` },
        body: JSON.stringify({ password: 'NewSecurePassword@2026!' }),
      });
      if (status !== 200) {
        throw new Error(`Unlink Google failed with status ${status}: ${JSON.stringify(body)}`);
      }

      // Verify AuthMethods now shows unlinked
      const methodsRes = await request('/auth/auth-methods', {
        method: 'GET',
        headers: { Authorization: `Bearer ${residentAccessToken}` },
      });
      if (methodsRes.body.data?.isGoogleLinked !== false) {
        throw new Error(`Expected isGoogleLinked to be false after unlinking`);
      }
    });

    // 13: Suspended Account Rejection
    await runStep('13/14', 'Suspended Account Security Guard (POST /auth/google/verify)', async () => {
      // Re-link Google for test user and suspend account
      await prisma.authIdentity.create({
        data: {
          userId: residentUserId,
          provider: AuthProvider.GOOGLE,
          providerSubject: residentGoogleSub,
          providerEmail: residentGoogleEmail,
        },
      });
      await prisma.user.update({
        where: { id: residentUserId },
        data: { isSuspended: true },
      });

      const mockToken = makeMockGoogleToken({
        sub: residentGoogleSub,
        email: residentGoogleEmail,
      });

      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: mockToken, role: 'RESIDENT' }),
      });

      if (status !== 403) {
        throw new Error(`Expected 403 Forbidden for suspended user, got ${status}: ${JSON.stringify(body)}`);
      }

      // Cleanup suspension for database consistency
      await prisma.user.update({
        where: { id: residentUserId },
        data: { isSuspended: false },
      });
    });

    // 14: Non-Primary Device Tracking & Security
    await runStep('14/14', 'Non-Primary Device Registration & Tracking', async () => {
      const mockToken = makeMockGoogleToken({
        sub: residentGoogleSub,
        email: residentGoogleEmail,
      });

      const { status, body } = await request('/auth/google/verify', {
        method: 'POST',
        body: JSON.stringify({
          idToken: mockToken,
          role: 'RESIDENT',
          visitorId: 'vis_secondary_device_99',
          deviceLabel: 'Secondary Chrome Laptop',
        }),
      });

      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Secondary device login failed: ${JSON.stringify(body)}`);
      }

      const devices = await prisma.device.findMany({ where: { userId: residentUserId } });
      const secondary = devices.find((d) => d.visitorId === 'vis_secondary_device_99');
      if (!secondary || secondary.isPrimary !== false) {
        throw new Error(`Expected secondary device to have isPrimary: false`);
      }
    });

  } finally {
    // Teardown server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('📊 GOOGLE OAUTH 2.0 E2E TEST EXECUTION SUMMARY');
  console.log('================================================================');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`Total Scenarios : ${results.length}`);
  console.log(`Passed          : \x1b[32m${passedCount}\x1b[0m`);
  console.log(`Failed          : ${failedCount > 0 ? `\x1b[31m${failedCount}\x1b[0m` : '0'}`);
  console.log(`Total Time      : ${totalDuration}ms`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
