import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import * as jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const PORT = 5008;
let server: http.Server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

interface IBenchmarkResult {
  endpoint: string;
  totalRequests: number;
  concurrency: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  rps: number;
  errorRate: number;
  passed: boolean;
}

const benchmarkResults: IBenchmarkResult[] = [];

async function benchmark(
  endpoint: string,
  totalRequests: number,
  concurrency: number,
  requestFactory: () => Promise<Response>,
  maxP95Ms: number = 800
): Promise<IBenchmarkResult> {
  const latencies: number[] = [];
  let errorCount = 0;

  const startTime = Date.now();
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const reqStart = Date.now();
      try {
        const res = await requestFactory();
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        if (res.status >= 400) errorCount++;
      } catch {
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        errorCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalDurationSeconds = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const rps = Math.round(totalRequests / (totalDurationSeconds || 0.001));
  const errorRate = (errorCount / totalRequests) * 100;
  const passed = p95 <= maxP95Ms && errorRate === 0;

  const result: IBenchmarkResult = {
    endpoint,
    totalRequests,
    concurrency,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    avgMs: avg,
    minMs: min,
    maxMs: max,
    rps,
    errorRate,
    passed,
  };

  benchmarkResults.push(result);

  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(
    `${color}[${passed ? 'PASS' : 'FAIL'}]\x1b[0m ${endpoint} | p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms | Avg: ${avg}ms | RPS: ${rps} | Errors: ${errorRate}%`
  );

  return result;
}

export async function runPerformanceLoadSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: IBenchmarkResult[];
}> {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_RATE_LIMIT = 'true';

  console.log('\n================================================================');
  console.log('🚀 MODULE 6: HIGH-CONCURRENCY & PERFORMANCE LOAD BENCHMARKING');
  console.log('================================================================\n');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const resident = await prisma.user.findFirst({ where: { email: 'ankursaha985@gmail.com' } });
  const owner = await prisma.user.findFirst({ where: { email: '33200122040@tib.edu.in' } });

  const residentToken = jwt.sign(
    { id: resident!.id, email: resident!.email, role: resident!.role, tokenVersion: resident!.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  const ownerToken = jwt.sign(
    { id: owner!.id, email: owner!.email, role: owner!.role, tokenVersion: owner!.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  try {
    // 1. Health Check Endpoint
    await benchmark('GET /health', 40, 8, () => fetch(`http://127.0.0.1:${PORT}/health`), 600);

    // 2. Owner Properties Listing Endpoint (Multi-Join Aggregation)
    await benchmark(
      'GET /properties/my',
      30,
      6,
      () =>
        fetch(`${BASE_URL}/properties/my`, {
          headers: { Authorization: `Bearer ${ownerToken}` },
        }),
      1500
    );

    // 3. Authenticated Billing Invoices (DB Aggregation Query)
    await benchmark(
      'GET /billing/invoices',
      30,
      6,
      () =>
        fetch(`${BASE_URL}/billing/invoices`, {
          headers: { Authorization: `Bearer ${residentToken}` },
        }),
      1500
    );

    // 4. CPU-Bound Password Login Verification
    await benchmark(
      'POST /auth/login',
      15,
      5,
      () =>
        fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'ankursaha985@gmail.com', password: 'Ankur@#123' }),
        }),
      2500 // bcrypt 10 rounds has intentional computational complexity
    );

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const passed = benchmarkResults.filter((r) => r.passed).length;
  const failed = benchmarkResults.filter((r) => !r.passed).length;
  return { total: benchmarkResults.length, passed, failed, results: benchmarkResults };
}

if (require.main === module) {
  runPerformanceLoadSuite()
    .then(({ passed, failed }) => {
      console.log(`\nModule 6 Completed: ${passed} passed, ${failed} failed.\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Module 6 Error:', err);
      process.exit(1);
    });
}
