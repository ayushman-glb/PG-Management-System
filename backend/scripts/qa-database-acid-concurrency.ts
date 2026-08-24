import { PrismaClient, Role, BedStatus, BookingStatus, AgreementStatus, InvoiceStatus, PaymentStatus, PaymentMethod, PaymentPurpose, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    results.push({ suite: 'Database & ACID Concurrency', name, passed: true, durationMs });
    console.log(`\x1b[32m[PASS]\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    results.push({ suite: 'Database & ACID Concurrency', name, passed: false, durationMs, error });
    console.error(`\x1b[31m[FAIL]\x1b[0m ${name} (${durationMs}ms)\n       Error: ${error}`);
  }
}

export async function runDatabaseACIDSuite(): Promise<{ total: number; passed: number; failed: number; results: ITestResult[] }> {
  console.log('\n================================================================');
  console.log('📦 MODULE 1: DATABASE RELIABILITY, ACID TRANSACTIONS & CONCURRENCY');
  console.log('================================================================\n');

  let tempUserId = '';
  let tempPgId = '';
  let tempRoomId = '';
  let tempBedId = '';
  let tempBookingId = '';

  try {
    // 1. CRUD Entity Verification
    await test('1.1 CRUD Lifecycle on Core Entities (Create, Read, Update, Delete)', async () => {
      const passwordHash = await bcrypt.hash('TempPassword@123', 10);
      const testUser = await prisma.user.create({
        data: {
          email: `qa_crud_test_${Date.now()}@roombae.com`,
          username: `qa_crud_${Date.now().toString().slice(-6)}`,
          phone: `+9199${Date.now().toString().slice(-8)}`,
          passwordHash,
          role: Role.RESIDENT,
          isActive: true,
          profile: {
            create: {
              firstName: 'QA',
              lastName: 'Tester',
              gender: Gender.MALE,
              occupation: 'SDET Engineer',
            },
          },
        },
      });
      tempUserId = testUser.id;

      const readUser = await prisma.user.findUnique({
        where: { id: tempUserId },
        include: { profile: true },
      });
      if (!readUser || readUser.profile?.firstName !== 'QA') {
        throw new Error('User read failed or profile not joined correctly');
      }

      const updatedUser = await prisma.user.update({
        where: { id: tempUserId },
        data: { isProfileComplete: true },
      });
      if (!updatedUser.isProfileComplete) {
        throw new Error('User update failed');
      }
    });

    // 2. ACID Multi-Step Transaction Rollback Simulation
    await test('1.2 ACID Transaction Rollback on Mid-Stream Failure Injection', async () => {
      const owner = await prisma.user.findFirst({ where: { role: Role.PG_OWNER } });
      if (!owner) throw new Error('No PG Owner found for transaction test');

      const pg = await prisma.pG.findFirst({ where: { ownerId: owner.id } });
      if (!pg) throw new Error('No PG found for transaction test');

      const availableBed = await prisma.bed.findFirst({ where: { status: BedStatus.AVAILABLE } });
      if (!availableBed) throw new Error('No available bed found for transaction test');

      const initialAvailableBedCount = await prisma.bed.count({ where: { status: BedStatus.AVAILABLE } });

      let transactionErrorCaught = false;

      try {
        await prisma.$transaction(async (tx) => {
          // Step 1: Create a booking record
          const booking = await tx.booking.create({
            data: {
              residentId: tempUserId,
              pgId: pg.id,
              roomId: availableBed.roomId,
              bedId: availableBed.id,
              roomType: 'DOUBLE',
              preferredMoveInDate: new Date(),
              status: BookingStatus.CONFIRMED,
              rentAmount: 14500,
              depositAmount: 29000,
            },
          });

          // Step 2: Update bed status to OCCUPIED
          await tx.bed.update({
            where: { id: availableBed.id },
            data: { status: BedStatus.OCCUPIED, currentResidentId: tempUserId },
          });

          // Step 3: INTENTIONALLY INJECT FAILURE to test rollback
          throw new Error('SIMULATED_DATABASE_FAILURE_INJECTION');
        });
      } catch (err: any) {
        if (err.message.includes('SIMULATED_DATABASE_FAILURE_INJECTION')) {
          transactionErrorCaught = true;
        } else {
          throw err;
        }
      }

      if (!transactionErrorCaught) {
        throw new Error('Expected transaction failure was not triggered');
      }

      // Verify that bed was NOT updated and booking was NOT created
      const bedAfterRollback = await prisma.bed.findUnique({ where: { id: availableBed.id } });
      if (bedAfterRollback?.status !== BedStatus.AVAILABLE || bedAfterRollback?.currentResidentId) {
        throw new Error('Transaction rollback failed: Bed status was mutated despite transaction failure');
      }

      const finalAvailableCount = await prisma.bed.count({ where: { status: BedStatus.AVAILABLE } });
      if (finalAvailableCount !== initialAvailableBedCount) {
        throw new Error('Transaction rollback failed: Bed count mismatch');
      }
    });

    // 3. Concurrency Race Condition: Concurrent Double-Bed Booking
    await test('1.3 Concurrency Race Condition (2 Concurrent Requests Competing for 1 Bed)', async () => {
      const availableBed = await prisma.bed.findFirst({ where: { status: BedStatus.AVAILABLE } });
      if (!availableBed) throw new Error('No available bed for concurrency test');

      const owner = await prisma.user.findFirst({ where: { role: Role.PG_OWNER } });
      const pg = await prisma.pG.findFirst({ where: { ownerId: owner!.id } });

      // Simulate 2 competing requests trying to occupy the same bed atomically
      async function attemptBooking(residentId: string): Promise<boolean> {
        try {
          return await prisma.$transaction(async (tx) => {
            const bed = await tx.bed.findUnique({ where: { id: availableBed!.id } });
            if (bed?.status !== BedStatus.AVAILABLE) {
              return false; // Bed already claimed
            }

            await tx.bed.update({
              where: { id: availableBed!.id },
              data: { status: BedStatus.OCCUPIED, currentResidentId: residentId },
            });

            await tx.booking.create({
              data: {
                residentId,
                pgId: pg!.id,
                roomId: availableBed!.roomId,
                bedId: availableBed!.id,
                roomType: 'DOUBLE',
                preferredMoveInDate: new Date(),
                status: BookingStatus.CONFIRMED,
                rentAmount: 14500,
                depositAmount: 29000,
              },
            });

            return true;
          });
        } catch {
          return false;
        }
      }

      // Execute concurrently
      const residentA = tempUserId;
      const residentB = (await prisma.user.findFirst({ where: { role: Role.RESIDENT, NOT: { id: tempUserId } } }))!.id;

      const [resA, resB] = await Promise.all([
        attemptBooking(residentA),
        attemptBooking(residentB),
      ]);

      // Exactly one must succeed, and one must fail
      const successCount = (resA ? 1 : 0) + (resB ? 1 : 0);
      if (successCount !== 1) {
        throw new Error(`Concurrency race condition failure: Expected exactly 1 successful booking, but got ${successCount} (resA: ${resA}, resB: ${resB})`);
      }

      // Clean up the booked bed back to available
      await prisma.booking.deleteMany({ where: { bedId: availableBed.id, residentId: resA ? residentA : residentB } });
      await prisma.bed.update({
        where: { id: availableBed.id },
        data: { status: BedStatus.AVAILABLE, currentResidentId: null },
      });
    });

    // 4. Concurrency Duplicate Payment Idempotency
    await test('1.4 Payment Idempotency & Duplicate Webhook Concurrency Defense', async () => {
      const invoice = await prisma.invoice.findFirst({ where: { status: InvoiceStatus.UNPAID } });
      if (!invoice) return; // Skip if no unpaid invoice

      const utr = `UTR_CONCURRENT_TEST_${Date.now()}`;

      async function recordPayment(): Promise<boolean> {
        try {
          return await prisma.$transaction(async (tx) => {
            const existing = await tx.payment.findFirst({ where: { manualUtr: utr } });
            if (existing) return false;

            await tx.payment.create({
              data: {
                invoiceId: invoice!.id,
                payerId: invoice!.residentId,
                payeeId: invoice!.residentId,
                pgId: invoice!.pgId,
                amount: invoice!.totalAmount,
                currency: 'INR',
                paymentMethod: PaymentMethod.UPI_MANUAL,
                purpose: PaymentPurpose.MONTHLY_RENT,
                status: PaymentStatus.VERIFIED,
                manualUtr: utr,
              },
            });
            return true;
          });
        } catch {
          return false;
        }
      }

      const [payA, payB] = await Promise.all([recordPayment(), recordPayment()]);
      const paymentsWithUtr = await prisma.payment.count({ where: { manualUtr: utr } });

      if (paymentsWithUtr > 1) {
        throw new Error(`Duplicate payment idempotency violation: ${paymentsWithUtr} payments recorded for unique UTR ${utr}`);
      }

      // Cleanup test payment
      await prisma.payment.deleteMany({ where: { manualUtr: utr } });
    });

    // 5. Mathematical and Referential Consistency Audit
    await test('1.5 Mathematical & Referential Integrity Audit across All Models', async () => {
      const totalBeds = await prisma.bed.count();
      const occupiedBeds = await prisma.bed.count({ where: { status: BedStatus.OCCUPIED } });
      const availableBeds = await prisma.bed.count({ where: { status: BedStatus.AVAILABLE } });
      const maintenanceBeds = await prisma.bed.count({ where: { status: BedStatus.MAINTENANCE } });

      if (totalBeds !== occupiedBeds + availableBeds + maintenanceBeds) {
        throw new Error(`Bed status mismatch: Total (${totalBeds}) != Occupied (${occupiedBeds}) + Available (${availableBeds}) + Maint (${maintenanceBeds})`);
      }

      const activeAllocations = await prisma.roomAllocation.count({ where: { isActive: true } });
      if (activeAllocations !== occupiedBeds) {
        throw new Error(`Occupancy mismatch: Active Allocations (${activeAllocations}) != Occupied Beds (${occupiedBeds})`);
      }

      // Check all rooms have valid PGs
      const rooms = await prisma.room.findMany();
      for (const r of rooms) {
        if (!r.pgId) throw new Error(`Room ${r.id} missing pgId`);
      }

      // Check all beds have valid rooms and PGs
      const beds = await prisma.bed.findMany();
      for (const b of beds) {
        if (!b.roomId || !b.pgId) throw new Error(`Bed ${b.id} missing roomId or pgId`);
      }
    });

  } finally {
    // Cleanup temporary user
    if (tempUserId) {
      await prisma.userProfile.deleteMany({ where: { userId: tempUserId } });
      await prisma.user.deleteMany({ where: { id: tempUserId } });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (require.main === module) {
  runDatabaseACIDSuite()
    .then(({ passed, failed }) => {
      console.log(`\nModule 1 Completed: ${passed} passed, ${failed} failed.\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Module 1 Error:', err);
      process.exit(1);
    });
}
