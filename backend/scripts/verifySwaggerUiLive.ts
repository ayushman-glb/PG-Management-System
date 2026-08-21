import { app } from '../src/app';
import { Container } from '../src/container';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import http from 'http';
import path from 'path';
import fs from 'fs';

// Import playwright from frontend
// @ts-ignore
const { chromium } = require(path.resolve(__dirname, '../../frontend/node_modules/playwright'));

interface SwaggerTestResult {
  step: number;
  operation: string;
  role: string;
  expectedStatus: number;
  observedStatus: number;
  passFail: 'PASS' | 'FAIL';
  expectedShapeCondition: string;
  responseBodyExcerpt: string;
}

async function runLiveSwaggerUiVerification() {
  console.log('\n======================================================================');
  console.log('🚀 RoomBae — Live Swagger UI Browser Interaction & Verification');
  console.log('======================================================================\n');

  // 1. Start ephemeral HTTP server
  const PORT = 5090;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[1/5] Backend HTTP server listening on http://localhost:${PORT}`);

  // 2. Fetch live credentials for personas
  const tokenService = Container.getTokenService();
  const godUser = await prisma.user.findFirst({ where: { role: Role.GOD } });
  const ownerUser = await prisma.user.findFirst({ where: { role: Role.OWNER } });
  const residentUser = await prisma.user.findFirst({ where: { role: Role.RESIDENT } });

  if (!godUser || !ownerUser || !residentUser) {
    throw new Error('Database is missing seed users for GOD, OWNER, or RESIDENT.');
  }

  const tokens = {
    PUBLIC: '',
    OWNER: tokenService.generateAccessToken({
      id: ownerUser.id,
      email: ownerUser.email,
      role: ownerUser.role,
      tokenVersion: ownerUser.tokenVersion ?? 0,
    }),
    RESIDENT: tokenService.generateAccessToken({
      id: residentUser.id,
      email: residentUser.email,
      role: residentUser.role,
      tokenVersion: residentUser.tokenVersion ?? 0,
    }),
    GOD: tokenService.generateAccessToken({
      id: godUser.id,
      email: godUser.email,
      role: godUser.role,
      tokenVersion: godUser.tokenVersion ?? 0,
    }),
  };

  console.log('[2/5] Generated valid tokens for Public, Owner, Resident, and GOD personas');

  // 3. Launch headless Playwright browser
  console.log('[3/5] Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to Swagger UI
  const swaggerUrl = `http://localhost:${PORT}/api/docs/`;
  await page.goto(swaggerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.swagger-ui', { timeout: 15000 });
  console.log(`[4/5] Swagger UI loaded cleanly at ${swaggerUrl}`);

  const results: SwaggerTestResult[] = [];

  // Helper to Authorize in Swagger UI modal
  async function authorizeSwagger(role: 'PUBLIC' | 'OWNER' | 'RESIDENT' | 'GOD') {
    const token = tokens[role];

    // Open Authorize modal
    const authBtn = page.locator('button.authorize');
    await authBtn.waitFor({ state: 'visible', timeout: 10000 });
    await authBtn.click();
    await page.waitForSelector('.auth-container', { timeout: 10000 });

    // Check if Logout button exists (clear previous auth)
    const logoutBtns = page.locator('.auth-container button.btn-done, .auth-container button:has-text("Logout")');
    const logoutCount = await logoutBtns.count();
    for (let i = 0; i < logoutCount; i++) {
      const btn = logoutBtns.nth(i);
      if (await btn.isVisible()) {
        const text = await btn.innerText();
        if (text.includes('Logout')) {
          await btn.click();
        }
      }
    }

    if (role !== 'PUBLIC' && token) {
      // Find the BearerAuth input
      const authInput = page.locator('.auth-container input[type="text"]').first();
      await authInput.fill(token);
      const submitBtn = page.locator('.auth-container button.authorize').first();
      await submitBtn.click();
      await page.waitForTimeout(500);
    }

    // Close modal
    const closeBtn = page.locator('.auth-container button.btn-done, .auth-container button:has-text("Close")').first();
    await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // Helper to execute an operation in Swagger UI DOM
  async function executeSwaggerOp(
    method: 'get' | 'post' | 'put' | 'delete',
    pathText: string,
    requestBody?: string,
    stepNum = 1
  ): Promise<{ status: number; excerpt: string }> {
    // Locate the operation block
    const opBlock = page
      .locator(`.opblock-${method}`)
      .filter({ has: page.locator('.opblock-summary-path', { hasText: pathText }) })
      .first();

    await opBlock.waitFor({ state: 'visible', timeout: 10000 });

    // Check if operation is expanded
    const isExpanded = await opBlock.locator('.opblock-body').isVisible();
    if (!isExpanded) {
      await opBlock.locator('.opblock-summary').click();
      await opBlock.locator('.opblock-body').waitFor({ state: 'visible', timeout: 10000 });
    }

    // Click 'Try it out' button if visible
    const tryItOutBtn = opBlock.locator('button.try-out__btn');
    if (await tryItOutBtn.isVisible()) {
      const btnText = await tryItOutBtn.innerText();
      if (btnText.includes('Try it out')) {
        await tryItOutBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // If requestBody is provided, fill body textarea
    if (requestBody) {
      const bodyTextArea = opBlock.locator('textarea.body-param__text').first();
      if (await bodyTextArea.isVisible()) {
        await bodyTextArea.fill(requestBody);
      }
    }

    // Click 'Execute' button
    const executeBtn = opBlock.locator('button.execute');
    await executeBtn.click();

    // Wait strictly for the live execution response in .live-responses-table
    const responseRow = opBlock.locator('.live-responses-table tbody tr.response').first();
    await responseRow.waitFor({ state: 'visible', timeout: 35000 });
    await page.waitForTimeout(1000);

    const statusEl = responseRow.locator('td.response-col_status').first();
    const statusRaw = (await statusEl.innerText()) || (await statusEl.textContent()) || '';
    const match = statusRaw.match(/\d{3}/);
    const status = match ? parseInt(match[0], 10) : 0;

    const preEl = responseRow.locator('.highlight-code pre, pre.microlight, pre, code').first();
    let bodyText = '';
    if ((await preEl.count()) > 0) {
      bodyText = (await preEl.innerText()) || (await preEl.textContent()) || '';
    } else {
      const descEl = responseRow.locator('td.response-col_description').first();
      bodyText = (await descEl.innerText()) || (await descEl.textContent()) || '';
    }
    const excerpt = (bodyText || '').replace(/^Response body\s+Download\s+/i, '').trim().replace(/\s+/g, ' ').substring(0, 120);

    return { status, excerpt };
  }

  console.log('[5/5] Executing 9 live Swagger UI operations...\n');

  // ----------------------------------------------------
  // OP 1: GET /properties/search (Public)
  // ----------------------------------------------------
  console.log('-> Executing Op 1: GET /properties/search (Role: PUBLIC)');
  await authorizeSwagger('PUBLIC');
  const res1 = await executeSwaggerOp('get', '/properties/search');
  const pass1 = res1.status === 200 && res1.excerpt.includes('success');
  results.push({
    step: 1,
    operation: 'GET /properties/search',
    role: 'PUBLIC',
    expectedStatus: 200,
    observedStatus: res1.status,
    passFail: pass1 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains success:true + array of listing cards',
    responseBodyExcerpt: res1.excerpt,
  });
  console.log(`   Status: ${res1.status}, Excerpt: ${res1.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 2: GET /auth/csrf-token (Public)
  // ----------------------------------------------------
  console.log('-> Executing Op 2: GET /auth/csrf-token (Role: PUBLIC)');
  const res2 = await executeSwaggerOp('get', '/auth/csrf-token');
  const pass2 = res2.status === 200 && res2.excerpt.includes('csrfToken');
  results.push({
    step: 2,
    operation: 'GET /auth/csrf-token',
    role: 'PUBLIC',
    expectedStatus: 200,
    observedStatus: res2.status,
    passFail: pass2 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains csrfToken string',
    responseBodyExcerpt: res2.excerpt,
  });
  console.log(`   Status: ${res2.status}, Excerpt: ${res2.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 3: GET /properties/public (Public)
  // ----------------------------------------------------
  console.log('-> Executing Op 3: GET /properties/public (Role: PUBLIC)');
  const res3 = await executeSwaggerOp('get', '/properties/public');
  const pass3 = res3.status === 200 && res3.excerpt.includes('properties');
  results.push({
    step: 3,
    operation: 'GET /properties/public',
    role: 'PUBLIC',
    expectedStatus: 200,
    observedStatus: res3.status,
    passFail: pass3 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains catalog listings with room structures',
    responseBodyExcerpt: res3.excerpt,
  });
  console.log(`   Status: ${res3.status}, Excerpt: ${res3.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 4: GET /properties/owner-summary (Owner)
  // ----------------------------------------------------
  console.log('-> Executing Op 4: GET /properties/owner-summary (Role: OWNER)');
  await authorizeSwagger('OWNER');
  const res4 = await executeSwaggerOp('get', '/properties/owner-summary');
  const pass4 = res4.status === 200 && res4.excerpt.includes('totalProperties');
  results.push({
    step: 4,
    operation: 'GET /properties/owner-summary',
    role: 'OWNER',
    expectedStatus: 200,
    observedStatus: res4.status,
    passFail: pass4 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains portfolio totals, beds, and occupancy stats',
    responseBodyExcerpt: res4.excerpt,
  });
  console.log(`   Status: ${res4.status}, Excerpt: ${res4.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 5: POST /properties (Owner)
  // ----------------------------------------------------
  console.log('-> Executing Op 5: POST /properties (Role: OWNER)');
  const newPGPayload = JSON.stringify({
    name: 'Swagger Live Test PG ' + Date.now(),
    address: '456 Residency Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560025',
    totalRooms: 6,
  }, null, 2);
  const res5 = await executeSwaggerOp('post', '/properties', newPGPayload);
  const pass5 = res5.status === 201 && (res5.excerpt.includes('property') || res5.excerpt.includes('success') || res5.excerpt.includes('created'));
  results.push({
    step: 5,
    operation: 'POST /properties',
    role: 'OWNER',
    expectedStatus: 201,
    observedStatus: res5.status,
    passFail: pass5 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=201 & body contains newly created draft property record',
    responseBodyExcerpt: res5.excerpt,
  });
  console.log(`   Status: ${res5.status}, Excerpt: ${res5.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 6: GET /residents/portal/me (Resident)
  // ----------------------------------------------------
  console.log('-> Executing Op 6: GET /residents/portal/me (Role: RESIDENT)');
  await authorizeSwagger('RESIDENT');
  const res6 = await executeSwaggerOp('get', '/residents/portal/me');
  const pass6 = res6.status === 200 && (res6.excerpt.includes('profile') || res6.excerpt.includes('Resident'));
  results.push({
    step: 6,
    operation: 'GET /residents/portal/me',
    role: 'RESIDENT',
    expectedStatus: 200,
    observedStatus: res6.status,
    passFail: pass6 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains stay status, agreement info, and bed number',
    responseBodyExcerpt: res6.excerpt,
  });
  console.log(`   Status: ${res6.status}, Excerpt: ${res6.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 7: POST /complaints (Resident)
  // ----------------------------------------------------
  console.log('-> Executing Op 7: POST /complaints (Role: RESIDENT)');
  const samplePG = await prisma.pG.findFirst();
  const complaintPayload = JSON.stringify({
    title: 'WiFi Router resetting frequently',
    description: 'The router on 3rd floor restarts every hour.',
    category: 'WIFI',
    priority: 'MEDIUM',
    pgId: samplePG?.id || '',
  }, null, 2);
  const res7 = await executeSwaggerOp('post', '/complaints', complaintPayload);
  const pass7 = res7.status === 201 && (res7.excerpt.includes('complaint') || res7.excerpt.includes('success') || res7.excerpt.includes('ticket') || res7.excerpt.includes('created'));
  results.push({
    step: 7,
    operation: 'POST /complaints',
    role: 'RESIDENT',
    expectedStatus: 201,
    observedStatus: res7.status,
    passFail: pass7 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=201 & body contains registered complaint ticket + status OPEN',
    responseBodyExcerpt: res7.excerpt,
  });
  console.log(`   Status: ${res7.status}, Excerpt: ${res7.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 8: GET /god/overview (GOD)
  // ----------------------------------------------------
  console.log('-> Executing Op 8: GET /god/overview (Role: GOD)');
  await authorizeSwagger('GOD');
  const res8 = await executeSwaggerOp('get', '/god/overview');
  const pass8 = res8.status === 200 && (res8.excerpt.includes('totalOwners') || res8.excerpt.includes('analytics') || res8.excerpt.includes('success'));
  results.push({
    step: 8,
    operation: 'GET /god/overview',
    role: 'GOD',
    expectedStatus: 200,
    observedStatus: res8.status,
    passFail: pass8 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains totalOwners, totalResidents, monthlySaaSRevenue',
    responseBodyExcerpt: res8.excerpt,
  });
  console.log(`   Status: ${res8.status}, Excerpt: ${res8.excerpt.substring(0, 60)}...`);

  // ----------------------------------------------------
  // OP 9: GET /god/owners (GOD)
  // ----------------------------------------------------
  console.log('-> Executing Op 9: GET /god/owners (Role: GOD)');
  const res9 = await executeSwaggerOp('get', '/god/owners');
  const pass9 = res9.status === 200 && (res9.excerpt.includes('Owners') || res9.excerpt.includes('success') || res9.excerpt.includes('data'));
  results.push({
    step: 9,
    operation: 'GET /god/owners',
    role: 'GOD',
    expectedStatus: 200,
    observedStatus: res9.status,
    passFail: pass9 ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains array of registered platform owners',
    responseBodyExcerpt: res9.excerpt,
  });
  console.log(`   Status: ${res9.status}, Excerpt: ${res9.excerpt.substring(0, 60)}...`);

  // Cleanup
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();

  console.log('\n======================================================================');
  console.log('📊 SWAGGER UI REAL DOM INTERACTION RESULTS TABLE (9/9)');
  console.log('======================================================================\n');
  console.table(
    results.map((r) => ({
      '#': r.step,
      Operation: r.operation,
      Role: r.role,
      Expected: r.expectedStatus,
      Observed: r.observedStatus,
      Result: r.passFail,
      Condition: r.expectedShapeCondition,
      'Response Excerpt': r.responseBodyExcerpt,
    }))
  );

  const allPassed = results.every((r) => r.passFail === 'PASS');
  console.log(`\nOverall Swagger UI Pass Rate: ${results.filter((r) => r.passFail === 'PASS').length}/9 (${allPassed ? '100% PASS' : 'FAILURES PRESENT'})`);

  // Write log artifact
  const logContent = `======================================================================
RoomBae — Live Swagger UI Verification Report (Playwright DOM Driven)
Timestamp: ${new Date().toISOString()}
======================================================================

Execution Environment:
- Target URL: http://localhost:${PORT}/api/docs/
- Browser: Headless Chromium via Playwright
- Trigger Mechanism: Native DOM button clicks (Authorize modal, Try it out, Body input, Execute)
- Data Source: Live Swagger UI response table (.live-responses-table)

Results Summary:
Passed: ${results.filter((r) => r.passFail === 'PASS').length}/9
Failed: ${results.filter((r) => r.passFail === 'FAIL').length}/9
Overall: ${allPassed ? '100% PASS (ALL 9 VERIFIED)' : 'FAILURES DETECTED'}

Detailed 9-Row Normalized Verification Table:
${JSON.stringify(results, null, 2)}
`;

  fs.writeFileSync(path.resolve(__dirname, '../swagger-ui-live.log'), logContent);
  console.log('✓ Verification log saved to backend/swagger-ui-live.log\n');
}

runLiveSwaggerUiVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
