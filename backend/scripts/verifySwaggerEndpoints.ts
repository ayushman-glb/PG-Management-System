import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { JwtTokenService } from '../src/infrastructure/crypto/JwtTokenService';

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

  // Request 1: GET /properties/search (Public)
  const res1 = await request(app).get('/api/v1/properties/search');
  results.push({
    endpoint: 'GET /properties/search',
    role: 'PUBLIC',
    expected: 200,
    status: res1.status,
    pass: res1.status === 200,
    dataSummary: `Found ${res1.body?.data?.properties?.length || 0} properties`,
  });

  // Request 2: GET /auth/csrf-token (Public)
  const res2 = await request(app).get('/api/v1/auth/csrf-token');
  results.push({
    endpoint: 'GET /auth/csrf-token',
    role: 'PUBLIC',
    expected: 200,
    status: res2.status,
    pass: res2.status === 200,
    dataSummary: `CSRF Token present: ${Boolean(res2.body?.data?.csrfToken)}`,
  });

  // Request 3: GET /properties/public (Public)
  const res3 = await request(app).get('/api/v1/properties/public');
  results.push({
    endpoint: 'GET /properties/public',
    role: 'PUBLIC',
    expected: 200,
    status: res3.status,
    pass: res3.status === 200,
    dataSummary: `Found ${res3.body?.data?.properties?.length || 0} public listings`,
  });

  // Request 4: GET /properties/owner-summary (Owner)
  const res4 = await request(app)
    .get('/api/v1/properties/owner-summary')
    .set('Authorization', `Bearer ${ownerToken}`);
  results.push({
    endpoint: 'GET /properties/owner-summary',
    role: 'OWNER',
    expected: 200,
    status: res4.status,
    pass: res4.status === 200,
    dataSummary: `Total properties: ${res4.body?.data?.totalProperties}`,
  });

  // Request 5: POST /properties (Owner)
  const res5 = await request(app)
    .post('/api/v1/properties')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: 'Verified Test PG ' + Date.now(),
      address: '123 Main Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      totalRooms: 10,
    });
  results.push({
    endpoint: 'POST /properties',
    role: 'OWNER',
    expected: 201,
    status: res5.status,
    pass: res5.status === 201,
    dataSummary: `Created Property ID: ${res5.body?.data?.property?.id || res5.body?.data?.id}`,
  });

  // Request 6: GET /residents/portal/me (Resident)
  const res6 = await request(app)
    .get('/api/v1/residents/portal/me')
    .set('Authorization', `Bearer ${residentToken}`);
  results.push({
    endpoint: 'GET /residents/portal/me',
    role: 'RESIDENT',
    expected: 200,
    status: res6.status,
    pass: res6.status === 200,
    dataSummary: `Resident Name: ${res6.body?.data?.profile?.user?.name || res6.body?.data?.profile?.name}`,
  });

  // Request 7: POST /complaints (Resident)
  const samplePG = await prisma.pG.findFirst();
  const res7 = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${residentToken}`)
    .send({
      title: 'Water filter maintenance verification',
      description: 'Filter needs servicing on 2nd floor dispenser',
      category: 'MAINTENANCE',
      priority: 'MEDIUM',
      pgId: samplePG?.id,
    });
  results.push({
    endpoint: 'POST /complaints',
    role: 'RESIDENT',
    expected: 201,
    status: res7.status,
    pass: res7.status === 201,
    dataSummary: `Created Complaint ID: ${res7.body?.data?.id || res7.body?.data?.complaint?.id}`,
  });

  // Request 8: GET /god/overview (GOD)
  const res8 = await request(app)
    .get('/api/v1/god/overview')
    .set('Authorization', `Bearer ${godToken}`);
  results.push({
    endpoint: 'GET /god/overview',
    role: 'GOD',
    expected: 200,
    status: res8.status,
    pass: res8.status === 200,
    dataSummary: `Total Owners: ${res8.body?.data?.totalOwners}, Residents: ${res8.body?.data?.totalResidents}`,
  });

  // Request 9: GET /god/owners (GOD)
  const res9 = await request(app)
    .get('/api/v1/god/owners')
    .set('Authorization', `Bearer ${godToken}`);
  results.push({
    endpoint: 'GET /god/owners',
    role: 'GOD',
    expected: 200,
    status: res9.status,
    pass: res9.status === 200,
    dataSummary: `Retrieved ${res9.body?.data?.length || 0} owners in platform directory`,
  });

  console.table(results);

  const allPassed = results.every((r) => r.pass);
  console.log(`\nOverall Swagger / API Verification: ${allPassed ? 'ALL 9 PASS ✅' : 'FAILURES PRESENT ❌'}`);
  await prisma.$disconnect();
}

runSwaggerVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
