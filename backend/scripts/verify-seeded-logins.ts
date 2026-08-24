import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, BedStatus } from '@prisma/client';

const PORT = 5003;
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
  console.log('🧪 ROOMBAE REAL LOGIN, AUTHORIZATION & DATA INTEGRITY TEST SUITE');
  console.log('================================================================\n');

  // Start in-process API server
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Verification Server running on port ${PORT}\n`);
      resolve();
    });
  });

  let ankurToken = '';
  let ayushmanToken = '';
  let adminToken = '';

  try {
    // 01: Ankur Saha (Resident) Login
    await runStep('01/10', 'Resident Login (ankursaha985@gmail.com / Ankur@#123)', async () => {
      const { status, body } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'ankursaha985@gmail.com',
          password: 'Ankur@#123',
          visitorId: 'vis_ankur_test_session',
        }),
      });

      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Login failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (body.data.user.role !== Role.RESIDENT) {
        throw new Error(`Expected role RESIDENT, got ${body.data.user.role}`);
      }
      if (!body.data.user.isProfileComplete) {
        throw new Error('Expected profile to be complete');
      }

      ankurToken = body.data.accessToken;
    });

    // 02: Ankur Saha Username Login
    await runStep('02/10', 'Resident Login via Username (ankur547 / Ankur@#123)', async () => {
      const { status, body } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'ankur547',
          password: 'Ankur@#123',
        }),
      });

      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Username login failed with status ${status}: ${JSON.stringify(body)}`);
      }
    });

    // 03: Ankur Saha Resident Data Access
    await runStep('03/10', 'Resident Data Access (Bookings, Invoices, Complaints, Profile)', async () => {
      const bookingsRes = await request('/bookings/resident', {
        headers: { Authorization: `Bearer ${ankurToken}` },
      });
      if (bookingsRes.status !== 200 || !bookingsRes.body.data?.length) {
        throw new Error(`Expected active booking for Ankur, got status ${bookingsRes.status}: ${JSON.stringify(bookingsRes.body)}`);
      }

      const invoicesRes = await request('/billing/resident', {
        headers: { Authorization: `Bearer ${ankurToken}` },
      });
      const invoiceList = invoicesRes.body.data?.invoices || invoicesRes.body.data;
      if (invoicesRes.status !== 200 || !invoiceList?.length) {
        throw new Error(`Expected invoices for Ankur, got status ${invoicesRes.status}: ${JSON.stringify(invoicesRes.body)}`);
      }

      const complaintsRes = await request('/complaints', {
        headers: { Authorization: `Bearer ${ankurToken}` },
      });
      if (complaintsRes.status !== 200 || !complaintsRes.body.data?.length) {
        throw new Error(`Failed to fetch complaints for Ankur, got status ${complaintsRes.status}`);
      }
    });

    // 04: Ankur Saha Role Boundary (Forbidden Endpoints)
    await runStep('04/10', 'Resident RBAC Isolation (Denied access to Owner/Admin endpoints)', async () => {
      const ownerRes = await request('/properties/my', {
        headers: { Authorization: `Bearer ${ankurToken}` },
      });
      if (ownerRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for /properties/my, got ${ownerRes.status}`);
      }

      const adminRes = await request('/admin/users', {
        headers: { Authorization: `Bearer ${ankurToken}` },
      });
      if (adminRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for /admin/users, got ${adminRes.status}`);
      }
    });

    // 05: Ayushman Saha (PG Owner) Login
    await runStep('05/10', 'PG Owner Login (33200122040@tib.edu.in / Ayush@#123)', async () => {
      const { status, body } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '33200122040@tib.edu.in',
          password: 'Ayush@#123',
          visitorId: 'vis_owner_test_session',
        }),
      });

      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`PG Owner login failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (body.data.user.role !== Role.PG_OWNER) {
        throw new Error(`Expected role PG_OWNER, got ${body.data.user.role}`);
      }

      ayushmanToken = body.data.accessToken;
    });

    // 06: Ayushman Saha Owner Data Access
    await runStep('06/10', 'PG Owner Data Access (Properties, Rooms, Beds, Subscriptions)', async () => {
      const propsRes = await request('/properties/my', {
        headers: { Authorization: `Bearer ${ayushmanToken}` },
      });
      if (propsRes.status !== 200 || propsRes.body.data?.length !== 3) {
        throw new Error(`Expected 3 PGs for Ayushman, got ${propsRes.body.data?.length} (status: ${propsRes.status})`);
      }

      const subRes = await request('/subscriptions/current', {
        headers: { Authorization: `Bearer ${ayushmanToken}` },
      });
      if (subRes.status !== 200 || subRes.body.data?.plan?.tier !== 'PROFESSIONAL') {
        throw new Error(`Expected Professional subscription for Ayushman, got: ${JSON.stringify(subRes.body)}`);
      }
    });

    // 07: Ayushman Saha Role Boundary
    await runStep('07/10', 'PG Owner RBAC Isolation (Denied access to Admin Console)', async () => {
      const adminRes = await request('/admin/users', {
        headers: { Authorization: `Bearer ${ayushmanToken}` },
      });
      if (adminRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for /admin/users, got ${adminRes.status}`);
      }
    });

    // 08: Platform Administrator Login
    await runStep('08/10', 'Admin Login (god@3456 / GOD@34$%65)', async () => {
      const { status, body } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'god@3456',
          password: 'GOD@34$%65',
        }),
      });

      if (status !== 200 || !body.data?.accessToken) {
        throw new Error(`Admin login failed with status ${status}: ${JSON.stringify(body)}`);
      }
      if (body.data.user.role !== Role.ADMIN) {
        throw new Error(`Expected role ADMIN, got ${body.data.user.role}`);
      }

      adminToken = body.data.accessToken;
    });

    // 09: Admin Console Operations
    await runStep('09/10', 'Admin Console Data Access (User Directory, PG Queue, Audit Logs)', async () => {
      const usersRes = await request('/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (usersRes.status !== 200 || !usersRes.body.data?.length) {
        throw new Error(`Failed to query admin users directory: ${JSON.stringify(usersRes.body)}`);
      }

      const auditRes = await request('/admin/audit-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (auditRes.status !== 200) {
        throw new Error(`Failed to query admin audit logs: ${JSON.stringify(auditRes.body)}`);
      }
    });

    // 10: Database Integrity & Mathematical Consistency
    await runStep('10/10', 'Database Integrity & Mathematical Consistency Audit', async () => {
      const totalBeds = await prisma.bed.count();
      const occupiedBeds = await prisma.bed.count({ where: { status: BedStatus.OCCUPIED } });
      const availableBeds = await prisma.bed.count({ where: { status: BedStatus.AVAILABLE } });
      const maintenanceBeds = await prisma.bed.count({ where: { status: BedStatus.MAINTENANCE } });

      if (totalBeds !== occupiedBeds + availableBeds + maintenanceBeds) {
        throw new Error(`Bed status mismatch: Total (${totalBeds}) != Occupied (${occupiedBeds}) + Available (${availableBeds}) + Maint (${maintenanceBeds})`);
      }

      const totalAllocations = await prisma.roomAllocation.count({ where: { isActive: true } });
      if (totalAllocations !== occupiedBeds) {
        throw new Error(`Occupancy mismatch: Active Allocations (${totalAllocations}) != Occupied Beds (${occupiedBeds})`);
      }

      const rooms = await prisma.room.findMany();
      for (const r of rooms) {
        if (!r.pgId) throw new Error(`Room ${r.id} is missing pgId`);
      }

      const beds = await prisma.bed.findMany();
      for (const b of beds) {
        if (!b.roomId || !b.pgId) throw new Error(`Bed ${b.id} is missing roomId or pgId`);
      }
    });

  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('📊 VERIFICATION SUMMARY REPORT');
  console.log('================================================================');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`Total Steps : ${results.length}`);
  console.log(`Passed      : \x1b[32m${passedCount}\x1b[0m`);
  console.log(`Failed      : ${failedCount > 0 ? `\x1b[31m${failedCount}\x1b[0m` : '0'}`);
  console.log(`Total Time  : ${totalDuration}ms`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
