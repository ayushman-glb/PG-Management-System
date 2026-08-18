import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillMissingResidents() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("=================================================");
  console.log(`🏠 RoomBae Database Backfill: Missing Resident Profiles`);
  console.log(`Mode: ${isDryRun ? "DRY RUN (No writes)" : "PRODUCTION WRITE"}`);
  console.log("=================================================\n");

  try {
    const residentUsers = await prisma.user.findMany({
      where: { role: Role.RESIDENT },
      include: { residentProfile: true },
    });

    console.log(`Found ${residentUsers.length} total users with role 'RESIDENT'`);

    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;

    for (const user of residentUsers) {
      if (user.residentProfile) {
        existingCount++;
        continue;
      }

      // Check directly in Resident collection in case relation wasn't linked in memory
      const directResident = await prisma.resident.findFirst({
        where: { userId: user.id },
      });

      if (directResident) {
        existingCount++;
        continue;
      }

      console.log(`[+] Missing Resident row for User: ${user.name} (${user.email}) [ID: ${user.id}]`);

      if (!isDryRun) {
        try {
          await prisma.resident.create({
            data: {
              userId: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || "+919800000000",
              profilePicture: user.avatarUrl || "https://res.cloudinary.com/roombae/image/upload/v1700000000/default-avatar.png",
              status: "ACTIVE",
            },
          });
          createdCount++;
          console.log(`    ✅ Successfully created Resident document for ${user.email}`);
        } catch (err: any) {
          errorCount++;
          console.error(`    ❌ Failed to create Resident row for ${user.email}:`, err.message);
        }
      } else {
        createdCount++;
      }
    }

    console.log("\n=================================================");
    console.log("📊 Backfill Summary:");
    console.log(`  - Total RESIDENT Users: ${residentUsers.length}`);
    console.log(`  - Profiles Already Present: ${existingCount}`);
    console.log(`  - Profiles ${isDryRun ? "Requiring Creation" : "Created"}: ${createdCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log("=================================================\n");
  } catch (error: any) {
    console.error("❌ Backfill execution failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillMissingResidents();
