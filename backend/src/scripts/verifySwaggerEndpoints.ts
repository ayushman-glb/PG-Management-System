import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/prisma';
import { JwtTokenService } from '../infrastructure/crypto/JwtTokenService';

const tokenService = new JwtTokenService();

async function runSwaggerVerification() {
  console.log('=== PHASE E: SWAGGER & API ENDPOINT VERIFICATION (9 REQUESTS) ===\n');

  // 1. Fetch live DB users for real authenticated requests
  const godUser = await prisma.user.findFirst({ where: { role: 'GOD' } });
  const ownerUser = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  const residentUser = await prisma.user.findFirst({ where: { role: 'RESIDENT' } });

  const godToken = tokenService.generateAccessToken({
    id: godUser!.id,
    email: godUser!.email,
    role: godUser!.role,
    tokenVersion: godUser!.tokenVersion ?? 0,
  });

  const ownerToken = tokenService.generateAccessToken({
    id: ownerUser!.id,
    email: ownerUser!.email,
    role: ownerUser!.role,
    tokenVersion: ownerUser!.tokenVersion ?? 0,
  });

  const residentToken = tokenService.generateAccessToken({
    id: residentUser!.id,
    email: residentUser!.email,
    role: residentUser!.role,
    tokenVersion: residentUser!.tokenVersion ?? 0,
  });

  const results: any[] = [];

  // Request 1: Public GET - Marketplace Search
  console.log('1. Testing Public GET /api/v1/properties/search...');
  const r1 = await request(app).get('/api/v1/properties/search');
  results.push({ name: 'Public GET /api/v1/properties/search', status: r1.status, success: r1.body.success ?? true });
  console.log(`   Status: ${r1.status}`);

  // Request 2: Public GET - CSRF Token Bootstrap
  console.log('2. Testing Public GET /api/v1/auth/csrf-token...');
  const r2 = await request(app).get('/api/v1/auth/csrf-token').set('Origin', 'https://ayushman-glb.github.io');
  const csrfToken = r2.body.data?.csrfToken;
  const cookieHeader = r2.headers['set-cookie'] || [];
  results.push({ name: 'Public GET /api/v1/auth/csrf-token', status: r2.status, hasCsrfToken: Boolean(csrfToken) });
  console.log(`   Status: ${r2.status}, Token: ${csrfToken ? csrfToken.slice(0, 16) + '...' : 'none'}`);

  // Request 3: Public GET - Public properties list
  console.log('3. Testing Public GET /api/v1/properties/public...');
  const r3 = await request(app).get('/api/v1/properties/public');
  results.push({ name: 'Public GET /api/v1/properties/public', status: r3.status, success: r3.body.success ?? true });
  console.log(`   Status: ${r3.status}`);

  // Request 4: Owner Auth GET - Owner portfolio summary
  console.log('4. Testing Owner GET /api/v1/properties/owner-summary...');
  const r4 = await request(app)
    .get('/api/v1/properties/owner-summary')
    .set('Authorization', `Bearer ${ownerToken}`);
  results.push({ name: 'Owner GET /api/v1/properties/owner-summary', status: r4.status, success: r4.body.success });
  console.log(`   Status: ${r4.status}`);

  // Request 5: Owner Auth POST - Create PG listing (with KYC check)
  console.log('5. Testing Owner POST /api/v1/properties (KYC Guard Verification)...');
  const req5 = request(app)
    .post('/api/v1/properties')
    .set('Authorization', `Bearer ${ownerToken}`)
    .set('x-csrf-token', csrfToken);
  
  if (cookieHeader) {
    req5.set('Cookie', Array.isArray(cookieHeader) ? cookieHeader.join('; ') : String(cookieHeader));
  }

  const r5 = await req5.send({
    name: 'RoomBae Luxury Residency',
    address: 'Koramangala 4th Block',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
  });
  results.push({ name: 'Owner POST /api/v1/properties', status: r5.status, note: r5.status === 403 ? 'KYC Guard Enforced (Expected for unverified owner)' : 'Processed' });
  console.log(`   Status: ${r5.status} (${r5.body.message || r5.body.error?.message || 'Handled'})`);

  // Request 6: Resident Auth GET - Portal Me
  console.log('6. Testing Resident GET /api/v1/residents/portal/me...');
  const r6 = await request(app)
    .get('/api/v1/residents/portal/me')
    .set('Authorization', `Bearer ${residentToken}`);
  results.push({ name: 'Resident GET /api/v1/residents/portal/me', status: r6.status, success: r6.body.success });
  console.log(`   Status: ${r6.status}`);

  // Request 7: Resident Auth POST - Create Complaint
  console.log('7. Testing Resident POST /api/v1/complaints...');
  const r7 = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${residentToken}`)
    .send({
      title: 'Water filter maintenance',
      description: 'Filter indicator light is red on 2nd floor dispenser.',
      category: 'General',
    });
  results.push({ name: 'Resident POST /api/v1/complaints', status: r7.status, success: r7.body.success });
  console.log(`   Status: ${r7.status}`);

  // Request 8: GOD Auth GET - Executive Overview
  console.log('8. Testing GOD GET /api/v1/god/overview...');
  const r8 = await request(app)
    .get('/api/v1/god/overview')
    .set('Authorization', `Bearer ${godToken}`);
  results.push({ name: 'GOD GET /api/v1/god/overview', status: r8.status, totalOwners: r8.body.data?.totalOwners, monthlyRevenue: r8.body.data?.monthlySaaSRevenue });
  console.log(`   Status: ${r8.status}, Total Owners: ${r8.body.data?.totalOwners}, MRR: ₹${r8.body.data?.monthlySaaSRevenue}`);

  // Request 9: GOD Auth GET - Platform Owner Directory
  console.log('9. Testing GOD GET /api/v1/god/owners...');
  const r9 = await request(app)
    .get('/api/v1/god/owners')
    .set('Authorization', `Bearer ${godToken}`);
  const ownerListCount = Array.isArray(r9.body.data) ? r9.body.data.length : (r9.body.data?.owners?.length ?? 0);
  results.push({ name: 'GOD GET /api/v1/god/owners', status: r9.status, ownerCount: ownerListCount });
  console.log(`   Status: ${r9.status}, Owners Count: ${ownerListCount}`);

  console.log('\n=== SWAGGER / API ENDPOINT SUMMARY TABLE ===');
  console.table(results);

  await prisma.$disconnect();
}

runSwaggerVerification().catch((err) => {
  console.error('Swagger verification script failed:', err);
  process.exit(1);
});
