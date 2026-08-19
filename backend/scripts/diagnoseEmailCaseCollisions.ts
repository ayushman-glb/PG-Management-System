import { prisma } from "../src/config/prisma";
import { logger } from "../src/utils/logger";

/**
 * Diagnostic Script: Email Case Collision Scanner (Read-Only)
 * Scans the User collection in MongoDB to identify accounts with different casing
 * that would collide when normalized to lowercase.
 *
 * This script is purely diagnostic and does NOT modify or delete any database records.
 */
async function scanEmailCollisions() {
  logger.info("🔍 Starting Read-Only Email Case Collision Scan...");

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info(`📊 Total users scanned: ${users.length}`);

    const emailMap = new Map<string, Array<{ id: string; email: string; name: string; role: string; createdAt: Date }>>();

    for (const user of users) {
      const lower = user.email.toLowerCase();
      const existing = emailMap.get(lower) || [];
      existing.push(user);
      emailMap.set(lower, existing);
    }

    const collisions: Array<{ normalizedEmail: string; accounts: any[] }> = [];

    for (const [normalizedEmail, accounts] of emailMap.entries()) {
      if (accounts.length > 1) {
        collisions.push({ normalizedEmail, accounts });
      }
    }

    if (collisions.length === 0) {
      logger.info("✅ No email case collisions detected. All email addresses are uniquely lowercased.");
    } else {
      logger.warn(`⚠️ Detected ${collisions.length} email collision group(s):`);
      for (const collision of collisions) {
        logger.warn(`Collision Group for [${collision.normalizedEmail}]:`);
        for (const account of collision.accounts) {
          logger.warn(`  - ID: ${account.id} | Stored Email: "${account.email}" | Name: "${account.name}" | Role: ${account.role} | Created: ${account.createdAt}`);
        }
      }
      logger.info("ℹ️ Note: Review these accounts manually. No automated changes have been applied.");
    }
  } catch (error: any) {
    logger.error("❌ Error scanning email collisions:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

scanEmailCollisions();
