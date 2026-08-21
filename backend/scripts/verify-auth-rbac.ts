import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=================================================");
  console.log("  RoomBae — Auth, RBAC & Role Verification Suite ");
  console.log("=================================================\n");

  let passes = 0;
  let fails = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passes++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      fails++;
    }
  }

  try {
    // 1. Verify all 3 Roles exist and match passwords
    console.log("--- 1. Testing Credential Hashes ---");
    const testAccounts = [
      { email: "superadmin@roombae.com", pass: "SuperAdmin_RB_2026!", expectedRole: "GOD" },
      { email: "admin@roombae.com", pass: "Admin_RoomBae_7890!", expectedRole: "ADMIN" },
      { email: "rajesh.owner@roombae.com", pass: "Owner_Rajesh_1001!", expectedRole: "OWNER" },
      { email: "priya.owner@roombae.com", pass: "Owner_Priya_1002!", expectedRole: "OWNER" },
      { email: "resident1@roombae.com", pass: "Resident_RES1001_Pass!", expectedRole: "RESIDENT" },
      { email: "resident2@roombae.com", pass: "Resident_RES1002_Pass!", expectedRole: "RESIDENT" },
    ];

    for (const acc of testAccounts) {
      const user = await prisma.user.findUnique({ where: { email: acc.email } });
      assert(!!user, `User ${acc.email} exists in database`);
      if (user) {
        assert(user.role === acc.expectedRole, `User ${acc.email} has role ${acc.expectedRole}`);
        const match = await bcrypt.compare(acc.pass, user.passwordHash || "");
        assert(match, `User ${acc.email} password verified`);
      }
    }

    // 2. Test Invalid Password Rejection
    console.log("\n--- 2. Testing Invalid Password Rejection ---");
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@roombae.com" } });
    if (adminUser) {
      const badMatch = await bcrypt.compare("WrongPassword123!", adminUser.passwordHash || "");
      assert(!badMatch, "Invalid password correctly rejected by bcrypt");
    }

    // 3. Test Owner Data Scoping
    console.log("\n--- 3. Testing PG Owner Data Scoping ---");
    const rajesh = await prisma.user.findUnique({ where: { email: "rajesh.owner@roombae.com" } });
    const priya = await prisma.user.findUnique({ where: { email: "priya.owner@roombae.com" } });

    const rajeshOwner = await prisma.owner.findFirst({ where: { userId: rajesh?.id } });
    const priyaOwner = await prisma.owner.findFirst({ where: { userId: priya?.id } });

    assert(!!rajeshOwner, "Rajesh owner profile exists");
    assert(!!priyaOwner, "Priya owner profile exists");

    const rajeshPGs = await prisma.pG.findMany({ where: { ownerId: rajeshOwner?.id } });
    const priyaPGs = await prisma.pG.findMany({ where: { ownerId: priyaOwner?.id } });

    assert(rajeshPGs.length > 0, `Rajesh owns ${rajeshPGs.length} PG(s): ${rajeshPGs.map(p => p.name).join(", ")}`);
    assert(priyaPGs.length > 0, `Priya owns ${priyaPGs.length} PG(s): ${priyaPGs.map(p => p.name).join(", ")}`);

    // Ensure no overlap
    const overlap = rajeshPGs.some(r => priyaPGs.some(p => p.id === r.id));
    assert(!overlap, "Owner properties are strictly isolated per owner ID");

    // 4. Test Resident Portal Data Scoping
    console.log("\n--- 4. Testing Resident Data Scoping ---");
    const res1 = await prisma.user.findUnique({ where: { email: "resident1@roombae.com" } });
    const res1Profile = await prisma.resident.findFirst({
      where: { userId: res1?.id },
      include: { bed: { include: { room: true } }, pg: true },
    });

    assert(!!res1Profile, "Resident 1 profile linked to user record");
    if (res1Profile) {
      assert(!!res1Profile.bed, `Resident 1 assigned to Bed ${res1Profile.bed?.bedNumber} in Room ${res1Profile.bed?.room?.roomNumber}`);
      assert(!!res1Profile.pg, `Resident 1 assigned to PG ${res1Profile.pg?.name}`);
    }

    // 5. Test Admin Aggregation Metrics
    console.log("\n--- 5. Testing Admin Aggregation Metrics ---");
    const [totalOwners, totalPGs, totalResidents] = await Promise.all([
      prisma.owner.count(),
      prisma.pG.count(),
      prisma.resident.count(),
    ]);

    assert(totalOwners > 0, `Total Owners count: ${totalOwners}`);
    assert(totalPGs > 0, `Total PGs count: ${totalPGs}`);
    assert(totalResidents > 0, `Total Residents count: ${totalResidents}`);

    console.log("\n=================================================");
    console.log(`  Results: ${passes} Passed, ${fails} Failed`);
    console.log("=================================================\n");

    if (fails > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Verification suite encountered error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
