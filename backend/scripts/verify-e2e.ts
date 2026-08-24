import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

async function runEndToEndVerification() {
  console.log('🚀 Starting RoomBae End-to-End API Automated Verification...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api/v1';

  const testResults: { index: number; name: string; status: 'PASS' | 'FAIL' | 'ERROR'; error?: string }[] = [];

  async function testEndpoint(name: string, fn: () => Promise<boolean>) {
    const idx = testResults.length + 1;
    try {
      const ok = await fn();
      if (ok) {
        testResults.push({ index: idx, name, status: 'PASS' });
      } else {
        testResults.push({ index: idx, name, status: 'FAIL' });
      }
    } catch (err: any) {
      testResults.push({ index: idx, name, status: 'ERROR', error: err.message });
    }
  }

  // 1. Health Check
  await testEndpoint('Health Probe (GET /api/v1/health)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data: any = await res.json();
    return res.status === 200 && (data.status === 'HEALTHY' || data.status === 'UP');
  });

  // 2. Root Service Discovery Catalog
  await testEndpoint('API Discovery Catalog (GET /api/v1)', async () => {
    const res = await fetch(`${baseUrl}`);
    const data: any = await res.json();
    return res.status === 200 && data.name === 'RoomBae REST API v1' && !!data.endpoints;
  });

  // 3. Admin Authentication
  let adminToken = '';
  await testEndpoint('Admin Sign-In (POST /api/v1/auth/sign-in)', async () => {
    const res = await fetch(`${baseUrl}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@roombae.com',
        password: 'RoomBae@2026!',
      }),
    });
    const data: any = await res.json();
    const token = data.data?.accessToken;
    if (res.status === 200 && token) {
      adminToken = token;
      return true;
    }
    return false;
  });

  // 4. Owner Authentication
  let ownerToken = '';
  await testEndpoint('PG Owner Sign-In (POST /api/v1/auth/sign-in)', async () => {
    const res = await fetch(`${baseUrl}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'owner@roombae.com',
        password: 'RoomBae@2026!',
      }),
    });
    const data: any = await res.json();
    const token = data.data?.accessToken;
    if (res.status === 200 && token) {
      ownerToken = token;
      return true;
    }
    return false;
  });

  // 5. Resident Authentication
  let residentToken = '';
  await testEndpoint('Resident Sign-In (POST /api/v1/auth/sign-in)', async () => {
    const res = await fetch(`${baseUrl}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'resident@roombae.com',
        password: 'RoomBae@2026!',
      }),
    });
    const data: any = await res.json();
    const token = data.data?.accessToken;
    if (res.status === 200 && token) {
      residentToken = token;
      return true;
    }
    return false;
  });

  // 6. Public Search & Discovery
  await testEndpoint('Public Search & Discovery Engine (GET /api/v1/search)', async () => {
    const res = await fetch(`${baseUrl}/search`);
    const data: any = await res.json();
    return res.status === 200 && Array.isArray(data.data) && data.data.length >= 1;
  });

  // 7. Subscription Plans Catalog
  await testEndpoint('SaaS Subscription Plans Catalog (GET /api/v1/subscriptions/plans)', async () => {
    const res = await fetch(`${baseUrl}/subscriptions/plans`);
    const data: any = await res.json();
    return res.status === 200 && Array.isArray(data.data) && data.data.length === 3;
  });

  // 8. Owner Active Subscription
  await testEndpoint('Owner Active Subscription (GET /api/v1/subscriptions/my-subscription)', async () => {
    const res = await fetch(`${baseUrl}/subscriptions/my-subscription`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const data: any = await res.json();
    return res.status === 200 && data.data && data.data.status === 'ACTIVE';
  });

  // 9. Owner PG Properties Inventory
  await testEndpoint('Owner PG Inventory (GET /api/v1/pgs)', async () => {
    const res = await fetch(`${baseUrl}/pgs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const data: any = await res.json();
    return res.status === 200 && Array.isArray(data.data) && data.data.length > 0;
  });

  // 10. Owner Realtime Analytics
  await testEndpoint('Owner Analytics (GET /api/v1/analytics/owner)', async () => {
    const res = await fetch(`${baseUrl}/analytics/owner`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const data: any = await res.json();
    return res.status === 200 && data.data && (typeof data.data.financials?.totalRevenue === 'number' || typeof data.data.totalRevenue === 'number');
  });

  // 11. Admin SaaS Platform Analytics
  await testEndpoint('Admin SaaS Analytics (GET /api/v1/analytics/admin)', async () => {
    const res = await fetch(`${baseUrl}/analytics/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data: any = await res.json();
    return res.status === 200 && data.data && (typeof data.data.platformStats?.totalPlatformRevenue === 'number' || typeof data.data.subscriptionRevenue === 'number');
  });

  // 12. Resident Bookings
  await testEndpoint('Resident Bookings (GET /api/v1/bookings)', async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    const data: any = await res.json();
    const bookings = Array.isArray(data.data) ? data.data : data.data?.bookings;
    return res.status === 200 && Array.isArray(bookings);
  });

  // 13. Resident Invoices & Billing
  await testEndpoint('Resident Invoices (GET /api/v1/billing/invoices)', async () => {
    const res = await fetch(`${baseUrl}/billing/invoices`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    const data: any = await res.json();
    const invoices = Array.isArray(data.data) ? data.data : data.data?.invoices;
    return res.status === 200 && Array.isArray(invoices);
  });

  // 14. Resident Complaints
  await testEndpoint('Resident Complaints (GET /api/v1/complaints)', async () => {
    const res = await fetch(`${baseUrl}/complaints`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    const data: any = await res.json();
    const complaints = Array.isArray(data.data) ? data.data : data.data?.complaints;
    return res.status === 200 && Array.isArray(complaints);
  });

  // 15. Resident Digital Agreements
  await testEndpoint('Resident Agreements (GET /api/v1/agreements)', async () => {
    const res = await fetch(`${baseUrl}/agreements`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    const data: any = await res.json();
    const agreements = Array.isArray(data.data) ? data.data : data.data?.agreements;
    return res.status === 200 && Array.isArray(agreements);
  });

  // 16. In-App Notifications
  await testEndpoint('Notifications Dispatch & Query (GET /api/v1/notifications)', async () => {
    const res = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    const data: any = await res.json();
    const notifications = Array.isArray(data.data) ? data.data : data.data?.notifications;
    return res.status === 200 && Array.isArray(notifications);
  });

  // 17. Security RBAC Guard (Resident attempting Admin endpoint)
  await testEndpoint('RBAC Guard: Resident forbidden from Admin (GET /api/v1/admin/stats)', async () => {
    const res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    return res.status === 403;
  });

  // 18. Security RBAC Guard (Unauthenticated request to protected route)
  await testEndpoint('RBAC Guard: Unauthenticated request rejected (GET /api/v1/admin/stats)', async () => {
    const res = await fetch(`${baseUrl}/admin/stats`);
    return res.status === 401;
  });

  server.close();
  await prisma.$disconnect();

  const passed = testResults.filter((t) => t.status === 'PASS').length;
  const total = testResults.length;

  console.log('\n======================================================================');
  console.log('                 ROOMBAE E2E VERIFICATION REPORT                      ');
  console.log('======================================================================');
  testResults.forEach((t) => {
    const icon = t.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${t.index.toString().padStart(2, '0')}/${total}] ${t.status.padEnd(5)} | ${t.name}`);
  });
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEndToEndVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
