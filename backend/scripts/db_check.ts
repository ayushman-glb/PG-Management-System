import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const ping = await prisma.$runCommandRaw({ ping: 1 });
    console.log("PING OK:", JSON.stringify(ping));

    const counts: Record<string, number> = {};
    const models = [
      "User",
      "Owner",
      "PG",
      "Building",
      "Floor",
      "Room",
      "Bed",
      "Resident",
      "Payment",
      "Complaint",
      "Invoice",
      "Agreement",
      "Subscription",
      "Analytics",
    ];

    for (const name of models) {
      try {
        const c = await (prisma as any)[
          name[0].toLowerCase() + name.slice(1)
        ].count();
        counts[name] = c;
      } catch (e: any) {
        counts[name] = -1;
        console.log(`  ${name} count error:`, e.message?.slice(0, 120));
      }
    }

    console.log("COUNTS:", JSON.stringify(counts, null, 2));
  } catch (e: any) {
    console.log("FAIL:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
