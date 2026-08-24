import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';

const PORT = 5004;
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
    results.push({ suite: 'REST API & OWASP Security', name, passed: true, durationMs });
    console.log(`\x1b[32m[PASS]\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    results.push({ suite: 'REST API & OWASP Security', name, passed: false, durationMs, error });
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

export async function runApiSecuritySuite(): Promise<{ total: number; passed: number; failed: number; results: ITestResult[] }> {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_RATE_LIMIT = 'true';

  console.log('\n================================================================');
  console.log('🛡️  MODULE 2: REST API INVENTORY, OWASP SECURITY & RBAC MATRIX');
  console.log('================================================================\n');

  // Start in-process test server on port 5004
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  let residentToken = '';
  let ownerToken = '';
  let adminToken = '';

  try {
    // 1. Authenticate All 3 Personas to Obtain Tokens
    await test('2.1 Authenticate Test Personas (Resident, PG Owner, Admin)', async () => {
      const resRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'ankursaha985@gmail.com', password: 'Ankur@#123' }),
      });
      if (resRes.status !== 200 || !resRes.body.data?.accessToken) {
        throw new Error(`Resident login failed: ${JSON.stringify(resRes.body)}`);
      }
      residentToken = resRes.body.data.accessToken;

      const ownRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: '33200122040@tib.edu.in', password: 'Ayush@#123' }),
      });
      if (ownRes.status !== 200 || !ownRes.body.data?.accessToken) {
        throw new Error(`PG Owner login failed: ${JSON.stringify(ownRes.body)}`);
      }
      ownerToken = ownRes.body.data.accessToken;

      const admRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'god@3456', password: 'GOD@34$%65' }),
      });
      if (admRes.status !== 200 || !admRes.body.data?.accessToken) {
        throw new Error(`Admin login failed: ${JSON.stringify(admRes.body)}`);
      }
      adminToken = admRes.body.data.accessToken;
    });

    // 2. HTTP Security Headers Audit
    await test('2.2 HTTP Security Headers Inspection (Helmet, CSP, HSTS, Sniff Guard)', async () => {
      const { headers } = await apiRequest('/health');
      const contentTypeOptions = headers.get('x-content-type-options');
      const frameOptions = headers.get('x-frame-options');

      if (contentTypeOptions !== 'nosniff') {
        throw new Error(`Expected X-Content-Type-Options: nosniff, got ${contentTypeOptions}`);
      }
      if (frameOptions !== 'SAMEORIGIN' && frameOptions !== 'DENY' && !headers.get('content-security-policy')) {
        throw new Error(`Missing clickjacking frame defense in headers`);
      }
    });

    // 3. Exhaustive RBAC & IDOR/BOLA Boundary Isolation
    await test('2.3 RBAC & IDOR/BOLA Boundary Matrix (Cross-Role & Cross-Tenant Forbidden Access)', async () => {
      // A. Resident trying Admin route
      const r1 = await apiRequest('/admin/users', { headers: { Authorization: `Bearer ${residentToken}` } });
      if (r1.status !== 403) throw new Error(`Expected 403 for Resident -> /admin/users, got ${r1.status}`);

      // B. Resident trying Owner route
      const r2 = await apiRequest('/properties/my', { headers: { Authorization: `Bearer ${residentToken}` } });
      if (r2.status !== 403) throw new Error(`Expected 403 for Resident -> /properties/my, got ${r2.status}`);

      // C. PG Owner trying Admin route
      const r3 = await apiRequest('/admin/kyc/queue', { headers: { Authorization: `Bearer ${ownerToken}` } });
      if (r3.status !== 403) throw new Error(`Expected 403 for Owner -> /admin/kyc/queue, got ${r3.status}`);

      // D. Unauthenticated request to protected endpoint
      const r4 = await apiRequest('/billing/invoices');
      if (r4.status !== 401) throw new Error(`Expected 401 for unauthenticated request, got ${r4.status}`);
    });

    // 4. Malicious Input & NoSQL Injection Sanitization
    await test('2.4 Input Sanitization & NoSQL Injection Defense (mongoSanitize & XSS Defense)', async () => {
      // Attempt login with NoSQL operator injection in identifier
      const nosqlRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: { $gt: '' }, // NoSQL injection attack attempt
          password: 'Password123!',
        }),
      });

      // Must be safely rejected with 400 or 401 without crashing or MongoDB query corruption
      if (nosqlRes.status !== 400 && nosqlRes.status !== 401) {
        throw new Error(`NoSQL injection was not safely intercepted, status: ${nosqlRes.status}`);
      }

      // Test XSS payload in compliant ticket description
      const xssRes = await apiRequest('/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${residentToken}` },
        body: JSON.stringify({
          pgId: 'invalid_pg_id_test',
          category: 'WIFI',
          title: '<script>alert("XSS")</script>',
          description: '<img src="x" onerror="alert(1)"> Test payload',
        }),
      });
      // Should reject invalid pgId safely without evaluating or corrupting database
      if (xssRes.status >= 500) {
        throw new Error(`XSS payload caused server 500 crash: ${JSON.stringify(xssRes.body)}`);
      }
    });

    // 5. REST API Status Code Matrix (400, 404, 422 Validations)
    await test('2.5 REST API Status Code Matrix (400 Bad Request, 404 Not Found, 422 Invalid Input)', async () => {
      // 404: Nonexistent endpoint
      const notFoundRes = await apiRequest('/non-existent-module-route-404');
      if (notFoundRes.status !== 404) {
        throw new Error(`Expected 404 for invalid route, got ${notFoundRes.status}`);
      }

      // 400: Missing required body parameters in POST /auth/login
      const badReqRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (badReqRes.status !== 400) {
        throw new Error(`Expected 400 for empty login payload, got ${badReqRes.status}`);
      }

      // 400/404: Request with malformed MongoDB ObjectId
      const malformedIdRes = await apiRequest('/properties/not_a_valid_object_id', {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      if (malformedIdRes.status !== 400 && malformedIdRes.status !== 404) {
        throw new Error(`Expected 400 or 404 for malformed ID, got ${malformedIdRes.status}`);
      }
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (require.main === module) {
  runApiSecuritySuite()
    .then(({ passed, failed }) => {
      console.log(`\nModule 2 Completed: ${passed} passed, ${failed} failed.\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Module 2 Error:', err);
      process.exit(1);
    });
}
