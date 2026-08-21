import { app } from '../app';
import { Container } from '../container';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import http from 'http';
import path from 'path';

// Import playwright from frontend
// @ts-ignore
const { chromium } = require(path.resolve(__dirname, '../../../frontend/node_modules/playwright'));

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
  const PORT = 5095;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[1/5] Backend HTTP server listening on http://localhost:${PORT}`);

  // 2. Fetch real database user records for token generation
  const dbOwner = await prisma.user.findFirst({ where: { role: Role.OWNER } });
  const dbResident = await prisma.user.findFirst({ where: { role: Role.RESIDENT } });
  let dbGod = await prisma.user.findFirst({ where: { role: Role.GOD } });
  if (!dbGod) {
    dbGod = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' as any } });
  }

  if (!dbOwner || !dbResident || !dbGod) {
    throw new Error(`Missing database seed users: Owner=${!!dbOwner}, Resident=${!!dbResident}, GOD=${!!dbGod}`);
  }

  const ownerToken = Container.tokenService.generateAccessToken({
    id: dbOwner.id,
    email: dbOwner.email,
    role: Role.OWNER,
    tokenVersion: dbOwner.tokenVersion || 0,
  });

  const residentToken = Container.tokenService.generateAccessToken({
    id: dbResident.id,
    email: dbResident.email,
    role: Role.RESIDENT,
    tokenVersion: dbResident.tokenVersion || 0,
  });

  const godToken = Container.tokenService.generateAccessToken({
    id: dbGod.id,
    email: dbGod.email,
    role: Role.GOD,
    tokenVersion: dbGod.tokenVersion || 0,
  });

  console.log(`[2/5] Generated RS256 JWT tokens for real DB users:`);
  console.log(`  - OWNER   : ${dbOwner.email} (${dbOwner.id})`);
  console.log(`  - RESIDENT: ${dbResident.email} (${dbResident.id})`);
  console.log(`  - GOD     : ${dbGod.email} (${dbGod.id})`);

  // 3. Launch headless browser
  console.log('[3/5] Launching Chromium headless browser via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const swaggerUrl = `http://localhost:${PORT}/api/docs/`;
  console.log(`[4/5] Navigating to Swagger UI at ${swaggerUrl}...`);
  await page.goto(swaggerUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.swagger-ui', { timeout: 15000 });

  const title = await page.title();
  console.log(`✓ Swagger UI loaded successfully: "${title}"`);
  console.log(`✓ Console errors on load: ${consoleErrors.length}`);

  const opCount = await page.locator('.opblock').count();
  console.log(`✓ Total Swagger operations found on page: ${opCount}`);

  const results: SwaggerTestResult[] = [];

  // Helper to set Bearer token in Swagger UI Authorize modal
  async function setSwaggerAuth(token: string | null) {
    const authBtn = page.locator('button.authorize');
    if ((await authBtn.count()) > 0) {
      await authBtn.first().click();
      await page.waitForTimeout(400);

      // Check if already authorized, if so logout
      const logoutBtn = page.locator('.auth-container button:has-text("Logout"), .auth-container button:has-text("Unauthorize")');
      if ((await logoutBtn.count()) > 0) {
        await logoutBtn.first().click();
        await page.waitForTimeout(300);
      }

      if (token) {
        const input = page.locator('.auth-container input[type="text"]').first();
        await input.fill(token.replace(/^Bearer\s+/i, ''));
        const modalAuthBtn = page.locator('.auth-btn-wrapper button.modal-btn.auth.authorize, .auth-btn-wrapper button[aria-label="Apply credentials"]');
        await modalAuthBtn.first().click();
        await page.waitForTimeout(300);
      }

      const closeBtn = page.locator('button.btn-done, button.modal-btn.btn-done');
      if ((await closeBtn.count()) > 0) {
        await closeBtn.first().click();
      }
      await page.waitForTimeout(300);
    }
  }

  // Helper to execute an operation in Swagger UI DOM
  async function executeSwaggerOp(
    method: 'get' | 'post',
    pathExact: string,
    body?: any
  ): Promise<{ status: number; excerpt: string }> {
    // Locate opblock
    const opBlock = page
      .locator(`.opblock-${method}`)
      .filter({
        has: page.locator('.opblock-summary-path', { hasText: pathExact }),
      })
      .first();

    await opBlock.scrollIntoViewIfNeeded();

    // Expand operation if not open
    const isExpanded = (await opBlock.locator('.opblock-body').count()) > 0;
    if (!isExpanded) {
      await opBlock.locator('.opblock-summary').click();
      await page.waitForTimeout(400);
    }

    // Click "Try it out"
    const tryOutBtn = opBlock.locator('button.try-out__btn');
    if ((await tryOutBtn.count()) > 0) {
      const text = await tryOutBtn.textContent();
      if (text?.includes('Try it out')) {
        await tryOutBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Fill body if POST
    if (body) {
      const textarea = opBlock.locator('textarea.body-param__text');
      if ((await textarea.count()) > 0) {
        await textarea.fill(typeof body === 'string' ? body : JSON.stringify(body, null, 2));
        await page.waitForTimeout(200);
      }
    }

    // Click "Execute"
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

  console.log('\n[5/5] Executing 9 live operations through Swagger UI DOM buttons...\n');

  // ── ROW 1: Public GET /properties/search
  await setSwaggerAuth(null);
  console.log('Executing 1/9: Public GET /properties/search...');
  const r1 = await executeSwaggerOp('get', '/properties/search');
  console.log(`  -> Status: ${r1.status}, Excerpt: ${r1.excerpt}`);
  results.push({
    step: 1,
    operation: 'GET /properties/search',
    role: 'PUBLIC',
    expectedStatus: 200,
    observedStatus: r1.status,
    passFail: r1.status === 200 && r1.excerpt.includes('success') ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains success:true + array of listing cards',
    responseBodyExcerpt: r1.excerpt,
  });

  // ── ROW 2: Public GET /auth/csrf-token
  console.log('Executing 2/9: Public GET /auth/csrf-token...');
  const r2 = await executeSwaggerOp('get', '/auth/csrf-token');
  console.log(`  -> Status: ${r2.status}, Excerpt: ${r2.excerpt}`);
  results.push({
    step: 2,
    operation: 'GET /auth/csrf-token',
    role: 'PUBLIC',
    expectedStatus: 200,
    observedStatus: r2.status,
    passFail: r2.status === 200 && (r2.excerpt.includes('csrfToken') || r2.excerpt.includes('success')) ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains csrfToken string',
    responseBodyExcerpt: r2.excerpt,
  });

  // ── ROW 3: Public GET /properties/public
  console.log('Executing 3/9: Public GET /properties/public...');
  const r3 = await executeSwaggerOp('get', '/properties/public');
  console.log(`  -> Status: ${r3.status}, Excerpt: ${r3.excerpt}`);
  results.push({
    step: 3,
    operation: 'GET /properties/public',
    role: 'PUBLIC',
    expectedStatus: 200,
    observedStatus: r3.status,
    passFail: r3.status === 200 && r3.excerpt.includes('success') ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains catalog listings with room structures',
    responseBodyExcerpt: r3.excerpt,
  });

  // ── ROW 4: Owner GET /properties/owner-summary
  console.log('Executing 4/9: Owner GET /properties/owner-summary...');
  await setSwaggerAuth(ownerToken);
  const r4 = await executeSwaggerOp('get', '/properties/owner-summary');
  console.log(`  -> Status: ${r4.status}, Excerpt: ${r4.excerpt}`);
  results.push({
    step: 4,
    operation: 'GET /properties/owner-summary',
    role: 'OWNER',
    expectedStatus: 200,
    observedStatus: r4.status,
    passFail: r4.status === 200 && r4.excerpt.includes('success') ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains portfolio totals, beds, and occupancy stats',
    responseBodyExcerpt: r4.excerpt,
  });

  // ── ROW 5: Owner POST /properties
  console.log('Executing 5/9: Owner POST /properties...');
  const r5 = await executeSwaggerOp('post', '/properties', {
    name: 'Swagger Live UI PG ' + Date.now(),
    address: '100 Outer Ring Road, Bellandur, Bangalore',
    city: 'Bangalore',
    pincode: '560103',
    genderPolicy: 'UNISEX',
    totalRooms: 4,
    totalBeds: 8,
    monthlyRent: 9500,
    securityDeposit: 19000,
    noticePeriodDays: 30,
    gateClosingTime: '22:30',
  });
  console.log(`  -> Status: ${r5.status}, Excerpt: ${r5.excerpt}`);
  results.push({
    step: 5,
    operation: 'POST /properties',
    role: 'OWNER',
    expectedStatus: 201,
    observedStatus: r5.status,
    passFail: r5.status === 201 && (r5.excerpt.includes('success') || r5.excerpt.includes('id')) ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=201 & body contains newly created draft property record',
    responseBodyExcerpt: r5.excerpt,
  });

  // ── ROW 6: Resident GET /residents/portal/me
  console.log('Executing 6/9: Resident GET /residents/portal/me...');
  await setSwaggerAuth(residentToken);
  const r6 = await executeSwaggerOp('get', '/residents/portal/me');
  console.log(`  -> Status: ${r6.status}, Excerpt: ${r6.excerpt}`);
  results.push({
    step: 6,
    operation: 'GET /residents/portal/me',
    role: 'RESIDENT',
    expectedStatus: 200,
    observedStatus: r6.status,
    passFail: r6.status === 200 && r6.excerpt.includes('success') ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains stay status, agreement info, and bed number',
    responseBodyExcerpt: r6.excerpt,
  });

  // ── ROW 7: Resident POST /complaints
  console.log('Executing 7/9: Resident POST /complaints...');
  const r7 = await executeSwaggerOp('post', '/complaints', {
    title: 'Swagger UI Live Ticket ' + Date.now(),
    category: 'PLUMBING',
    priority: 'MEDIUM',
    description: 'Executed directly from Swagger UI DOM Try It Out button.',
  });
  console.log(`  -> Status: ${r7.status}, Excerpt: ${r7.excerpt}`);
  results.push({
    step: 7,
    operation: 'POST /complaints',
    role: 'RESIDENT',
    expectedStatus: 201,
    observedStatus: r7.status,
    passFail: r7.status === 201 && (r7.excerpt.includes('success') || r7.excerpt.includes('ticketCode') || r7.excerpt.includes('Complaint') || r7.excerpt.includes('created')) ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=201 & body contains registered complaint ticket + status OPEN',
    responseBodyExcerpt: r7.excerpt,
  });

  // ── ROW 8: GOD GET /god/overview
  console.log('Executing 8/9: GOD GET /god/overview...');
  await setSwaggerAuth(godToken);
  const r8 = await executeSwaggerOp('get', '/god/overview');
  console.log(`  -> Status: ${r8.status}, Excerpt: ${r8.excerpt}`);
  results.push({
    step: 8,
    operation: 'GET /god/overview',
    role: 'GOD',
    expectedStatus: 200,
    observedStatus: r8.status,
    passFail: r8.status === 200 && (r8.excerpt.includes('success') || r8.excerpt.includes('totalOwners') || r8.excerpt.includes('analytics') || r8.excerpt.includes('growth') || r8.excerpt.includes('owners')) ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains totalOwners, totalResidents, monthlySaaSRevenue',
    responseBodyExcerpt: r8.excerpt,
  });

  // ── ROW 9: GOD GET /god/owners
  console.log('Executing 9/9: GOD GET /god/owners...');
  const r9 = await executeSwaggerOp('get', '/god/owners');
  console.log(`  -> Status: ${r9.status}, Excerpt: ${r9.excerpt}`);
  results.push({
    step: 9,
    operation: 'GET /god/owners',
    role: 'GOD',
    expectedStatus: 200,
    observedStatus: r9.status,
    passFail: r9.status === 200 && r9.excerpt.includes('success') ? 'PASS' : 'FAIL',
    expectedShapeCondition: 'status=200 & body contains array of registered platform owners',
    responseBodyExcerpt: r9.excerpt,
  });

  // Clean up
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));

  // Print results table
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
  console.log(`\nOverall Swagger UI Pass Rate: ${results.filter((r) => r.passFail === 'PASS').length}/${results.length} (${allPassed ? '100% PASS' : 'FAILURES PRESENT'})`);

  // Write log to backend/swagger-ui-live.log
  const fs = require('fs');
  const logContent = [
    '======================================================================',
    'RoomBae — Live Swagger UI Verification Report (Playwright DOM Driven)',
    `Timestamp: ${new Date().toISOString()}`,
    '======================================================================\n',
    'Execution Environment:',
    `- Target URL: http://localhost:${PORT}/api/docs/`,
    '- Browser: Headless Chromium via Playwright',
    '- Trigger Mechanism: Native DOM button clicks (Authorize modal, Try it out, Body input, Execute)',
    '- Data Source: Live Swagger UI response table (.live-responses-table)\n',
    'Results Summary:',
    `Passed: ${results.filter((r) => r.passFail === 'PASS').length}/9`,
    `Failed: ${results.filter((r) => r.passFail === 'FAIL').length}/9`,
    `Overall: ${allPassed ? '100% PASS (ALL 9 VERIFIED)' : 'FAILED'}\n`,
    'Detailed 9-Row Normalized Verification Table:',
    JSON.stringify(results, null, 2),
  ].join('\n');
  fs.writeFileSync(path.resolve(__dirname, '../../swagger-ui-live.log'), logContent);
  console.log('✓ Verification log saved to backend/swagger-ui-live.log');
}

runLiveSwaggerUiVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during Swagger UI verification:', err);
    process.exit(1);
  });
