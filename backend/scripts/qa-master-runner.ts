/**
 * ROOMBAE MASTER QA TEST SUITE ORCHESTRATOR
 * Executes Modules 1 through 6 sequentially, tracking total assertions,
 * execution timing, defect ledger verification, and system certification.
 */

import { runDatabaseACIDSuite } from './qa-database-acid-concurrency';
import { runApiSecuritySuite } from './qa-api-security-matrix';
import { runAuthDeviceSessionSuite } from './qa-auth-device-session';
import { runSocketIOPipelineSuite } from './qa-socketio-pipeline';
import { runBusinessWorkflowsSuite } from './qa-business-workflows';
import { runPerformanceLoadSuite } from './qa-performance-load';

interface IModuleSummary {
  moduleName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

async function runMasterQaSuite() {
  const startTime = Date.now();
  const summaries: IModuleSummary[] = [];

  console.log('\n================================================================================');
  console.log('🛡️  ROOMBAE — MASTER SYSTEM QA, SECURITY, ACID & E2E VERIFICATION RUNNER');
  console.log('================================================================================\n');

  // Module 1
  const t1 = Date.now();
  const m1 = await runDatabaseACIDSuite();
  summaries.push({
    moduleName: 'Module 1: Database Reliability, ACID & Concurrency',
    total: m1.total,
    passed: m1.passed,
    failed: m1.failed,
    durationMs: Date.now() - t1,
  });

  // Module 2
  const t2 = Date.now();
  const m2 = await runApiSecuritySuite();
  summaries.push({
    moduleName: 'Module 2: REST API Inventory, OWASP Security & RBAC Matrix',
    total: m2.total,
    passed: m2.passed,
    failed: m2.failed,
    durationMs: Date.now() - t2,
  });

  // Module 3
  const t3 = Date.now();
  const m3 = await runAuthDeviceSessionSuite();
  summaries.push({
    moduleName: 'Module 3: Authentication, OAuth, Devices, Sessions & OTP',
    total: m3.total,
    passed: m3.passed,
    failed: m3.failed,
    durationMs: Date.now() - t3,
  });

  // Module 4
  const t4 = Date.now();
  const m4 = await runSocketIOPipelineSuite();
  summaries.push({
    moduleName: 'Module 4: Real-Time Socket.IO Pipeline & Room Authorization',
    total: m4.total,
    passed: m4.passed,
    failed: m4.failed,
    durationMs: Date.now() - t4,
  });

  // Module 5
  const t5 = Date.now();
  const m5 = await runBusinessWorkflowsSuite();
  summaries.push({
    moduleName: 'Module 5: End-to-End Business Workflows & Invoicing Lifecycle',
    total: m5.total,
    passed: m5.passed,
    failed: m5.failed,
    durationMs: Date.now() - t5,
  });

  // Module 6
  const t6 = Date.now();
  const m6 = await runPerformanceLoadSuite();
  summaries.push({
    moduleName: 'Module 6: High-Concurrency & Performance Load Benchmarking',
    total: m6.total,
    passed: m6.passed,
    failed: m6.failed,
    durationMs: Date.now() - t6,
  });

  const totalDurationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = summaries.reduce((acc, s) => acc + s.total, 0);
  const totalPassed = summaries.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = summaries.reduce((acc, s) => acc + s.failed, 0);
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log('\n================================================================================');
  console.log('📊 MASTER SYSTEM QA TEST EXECUTION REPORT');
  console.log('================================================================================');
  console.log(
    `Total Suites: 6 | Total Tests: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed} | Pass Rate: ${passRate}% | Execution Time: ${totalDurationSeconds}s\n`
  );

  console.table(
    summaries.map((s) => ({
      Module: s.moduleName,
      Total: s.total,
      Passed: s.passed,
      Failed: s.failed,
      Status: s.failed === 0 ? 'PASS ✅' : 'FAIL ❌',
      'Time (ms)': s.durationMs,
    }))
  );

  if (totalFailed > 0) {
    console.error(`\n❌ MASTER QA VERIFICATION FAILED: ${totalFailed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL QA SUITES PASSED WITH 100% INTEGRITY AND ZERO DEFECTS! 🚀\n');
  }
}

if (require.main === module) {
  runMasterQaSuite().catch((err) => {
    console.error('Fatal Master QA Runner Error:', err);
    process.exit(1);
  });
}
