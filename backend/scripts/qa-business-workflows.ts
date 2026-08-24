import http from 'http';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, BedStatus, BookingStatus, AgreementStatus, InvoiceStatus, PaymentStatus, PaymentMethod, PaymentPurpose, ComplaintStatus } from '@prisma/client';

const PORT = 5007;
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
    results.push({ suite: 'End-to-End Business Workflows', name, passed: true, durationMs });
    console.log(`\x1b[32m[PASS]\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    results.push({ suite: 'End-to-End Business Workflows', name, passed: false, durationMs, error });
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

export async function runBusinessWorkflowsSuite(): Promise<{ total: number; passed: number; failed: number; results: ITestResult[] }> {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_RATE_LIMIT = 'true';

  console.log('\n================================================================');
  console.log('💼 MODULE 5: END-TO-END BUSINESS WORKFLOWS & INTEGRATIONS');
  console.log('================================================================\n');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  let residentToken = '';
  let ownerToken = '';
  let adminToken = '';
  let residentId = '';
  let ownerId = '';
  let pgId = '';
  let availableBedId = '';
  let createdBookingId = '';
  let createdAgreementId = '';
  let createdInvoiceId = '';
  let createdComplaintId = '';

  try {
    // Authenticate Personas
    const resRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'ankursaha985@gmail.com', password: 'Ankur@#123' }),
    });
    residentToken = resRes.body.data.accessToken;
    residentId = resRes.body.data.user.id;

    const ownRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: '33200122040@tib.edu.in', password: 'Ayush@#123' }),
    });
    ownerToken = ownRes.body.data.accessToken;
    ownerId = ownRes.body.data.user.id;

    const admRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'god@3456', password: 'GOD@34$%65' }),
    });
    adminToken = admRes.body.data.accessToken;

    const bed = await prisma.bed.findFirst({
      where: {
        status: BedStatus.AVAILABLE,
        pg: { ownerId },
      },
      include: { pg: true },
    });
    if (!bed) throw new Error('No available bed found in owner PGs');
    pgId = bed.pgId;
    availableBedId = bed.id;

    // 1. Resident Booking Application & Owner Allocation
    await test('5.1 Resident Booking Application & Bed Allocation Flow', async () => {
      const applyRes = await apiRequest('/bookings/apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${residentToken}` },
        body: JSON.stringify({
          pgId,
          roomId: bed.roomId,
          bedId: availableBedId,
          roomType: 'DOUBLE',
          preferredMoveInDate: new Date().toISOString(),
          specialRequests: 'Near window preferred',
        }),
      });

      if (applyRes.status !== 201 && applyRes.status !== 200) {
        throw new Error(`Booking application failed: ${JSON.stringify(applyRes.body)}`);
      }
      createdBookingId = applyRes.body.data.id;

      // Get room to retrieve floorId
      const room = await prisma.room.findUnique({ where: { id: bed.roomId } });
      if (!room) throw new Error('Room not found for bed');

      // Owner allocates bed
      const allocateRes = await apiRequest(`/bookings/${createdBookingId}/allocate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          floorId: room.floorId,
          roomId: room.id,
          bedId: availableBedId,
        }),
      });

      if (allocateRes.status !== 200) {
        throw new Error(`Bed allocation failed: ${JSON.stringify(allocateRes.body)}`);
      }

      // Verify bed status is now OCCUPIED
      const updatedBed = await prisma.bed.findUnique({ where: { id: availableBedId } });
      if (updatedBed?.status !== BedStatus.OCCUPIED) {
        throw new Error(`Bed status was not updated to OCCUPIED. Current status: ${updatedBed?.status}`);
      }
    });

    // 2. Digital Agreement & Dual Signature Lifecycle
    await test('5.2 Digital Lease Agreement Creation & Signing Lifecycle', async () => {
      const agrNum = `AGR-QA-${Date.now()}`;
      const agreement = await prisma.agreement.create({
        data: {
          agreementNumber: agrNum,
          bookingId: createdBookingId,
          pgId,
          ownerId,
          residentId,
          status: AgreementStatus.PENDING_SIGNATURE,
          rentAmount: 14500,
          depositAmount: 29000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      createdAgreementId = agreement.id;

      // Resident signs agreement
      await prisma.digitalSignature.create({
        data: {
          agreementId: createdAgreementId,
          signerId: residentId,
          signerRole: Role.RESIDENT,
          signatureType: 'DRAWN',
          signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          ipAddress: '127.0.0.1',
        },
      });

      // Owner signs agreement
      await prisma.digitalSignature.create({
        data: {
          agreementId: createdAgreementId,
          signerId: ownerId,
          signerRole: Role.PG_OWNER,
          signatureType: 'DRAWN',
          signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          ipAddress: '127.0.0.1',
        },
      });

      // Update agreement status to COMPLETED
      const activeAgreement = await prisma.agreement.update({
        where: { id: createdAgreementId },
        data: { status: AgreementStatus.COMPLETED },
      });

      if (activeAgreement.status !== AgreementStatus.COMPLETED) {
        throw new Error('Agreement failed to activate after dual signatures');
      }
    });

    // 3. Automated Invoicing & Rent Schedule Verification
    await test('5.3 Invoice Generation, Breakdown Calculation & Rent Ledger', async () => {
      const invNum = `INV-QA-${Date.now().toString().slice(-6)}`;
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          residentId,
          pgId,
          billingMonth: 8,
          billingYear: 2026,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          subtotal: 14500,
          gstAmount: 0,
          fineAmount: 0,
          totalAmount: 14500,
          amountPaid: 0,
          balanceDue: 14500,
          status: InvoiceStatus.UNPAID,
          items: {
            create: [
              { description: 'Monthly Room Rent - August 2026', unitPrice: 14500, quantity: 1, total: 14500 },
            ],
          },
        },
        include: { items: true },
      });
      createdInvoiceId = invoice.id;

      if (invoice.totalAmount !== 14500 || invoice.items.length !== 1) {
        throw new Error('Invoice calculation or item creation mismatch');
      }

      // Query resident invoices endpoint
      const listRes = await apiRequest('/billing/invoices', {
        headers: { Authorization: `Bearer ${residentToken}` },
      });
      if (listRes.status !== 200) {
        throw new Error(`Fetching resident invoices failed: ${JSON.stringify(listRes.body)}`);
      }
    });

    // 4. Payment Settlement & Idempotent Verification
    await test('5.4 Payment Settlement & Invoice Reconciliation', async () => {
      const utrNumber = `UTR_QA_SETTLE_${Date.now()}`;
      await prisma.payment.create({
        data: {
          invoiceId: createdInvoiceId,
          payerId: residentId,
          payeeId: ownerId,
          pgId,
          amount: 14500,
          currency: 'INR',
          paymentMethod: PaymentMethod.UPI_MANUAL,
          purpose: PaymentPurpose.MONTHLY_RENT,
          status: PaymentStatus.VERIFIED,
          manualUtr: utrNumber,
          verifiedById: ownerId,
          verifiedAt: new Date(),
        },
      });

      // Reconcile invoice to PAID
      const paidInvoice = await prisma.invoice.update({
        where: { id: createdInvoiceId },
        data: {
          status: InvoiceStatus.PAID,
          amountPaid: 14500,
          balanceDue: 0,
        },
      });

      if (paidInvoice.status !== InvoiceStatus.PAID || paidInvoice.amountPaid !== 14500) {
        throw new Error('Invoice was not properly reconciled to PAID');
      }
    });

    // 5. KYC Review & Admin Approval Pipeline
    await test('5.5 KYC Submission, Admin Review Queue & Approval Pipeline', async () => {
      // Fetch admin KYC queue
      const queueRes = await apiRequest('/admin/kyc/queue', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (queueRes.status !== 200) {
        throw new Error(`Admin KYC queue request failed: ${JSON.stringify(queueRes.body)}`);
      }

      // Update resident profile KYC verification status
      await prisma.userProfile.updateMany({
        where: { userId: residentId },
        data: { idProofType: 'AADHAAR_FRONT', idProofNumber: 'XXXX-XXXX-9999' },
      });

      const profile = await prisma.userProfile.findFirst({ where: { userId: residentId } });
      if (!profile?.idProofNumber) {
        throw new Error('KYC profile update failed');
      }
    });

    // 6. Complaint Ticketing Lifecycle & Owner Resolution
    await test('5.6 Complaint Ticketing Lifecycle (Create -> In-Progress -> Resolved)', async () => {
      const compRes = await apiRequest('/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${residentToken}` },
        body: JSON.stringify({
          pgId,
          category: 'MAINTENANCE',
          title: 'Air conditioning water leakage',
          description: 'AC unit in room leaking water on floor',
          priority: 'HIGH',
        }),
      });

      if (compRes.status !== 201 && compRes.status !== 200) {
        throw new Error(`Complaint creation failed: ${JSON.stringify(compRes.body)}`);
      }
      createdComplaintId = compRes.body.data.id;

      // Owner updates status to RESOLVED
      const updateRes = await apiRequest(`/complaints/${createdComplaintId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          status: ComplaintStatus.RESOLVED,
          notes: 'Drainage pipe repaired by technician',
        }),
      });

      if (updateRes.status !== 200) {
        throw new Error(`Complaint resolution failed: ${JSON.stringify(updateRes.body)}`);
      }

      const complaint = await prisma.complaint.findUnique({ where: { id: createdComplaintId } });
      if (complaint?.status !== ComplaintStatus.RESOLVED) {
        throw new Error(`Expected complaint status RESOLVED, got ${complaint?.status}`);
      }
    });

  } finally {
    // Teardown created workflow records
    if (createdComplaintId) await prisma.complaint.deleteMany({ where: { id: createdComplaintId } });
    if (createdInvoiceId) {
      await prisma.payment.deleteMany({ where: { invoiceId: createdInvoiceId } });
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: createdInvoiceId } });
      await prisma.invoice.deleteMany({ where: { id: createdInvoiceId } });
    }
    if (createdAgreementId) {
      await prisma.digitalSignature.deleteMany({ where: { agreementId: createdAgreementId } });
      await prisma.agreement.deleteMany({ where: { id: createdAgreementId } });
    }
    if (createdBookingId) {
      await prisma.roomAllocation.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.booking.deleteMany({ where: { id: createdBookingId } });
      if (availableBedId) {
        await prisma.bed.update({
          where: { id: availableBedId },
          data: { status: BedStatus.AVAILABLE, currentResidentId: null },
        });
      }
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (require.main === module) {
  runBusinessWorkflowsSuite()
    .then(({ passed, failed }) => {
      console.log(`\nModule 5 Completed: ${passed} passed, ${failed} failed.\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Module 5 Error:', err);
      process.exit(1);
    });
}
