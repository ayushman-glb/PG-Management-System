import { PrismaClient, Role } from '@prisma/client';
import { logger } from '../../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Migration Script: SUPER_ADMIN -> GOD Role Modernization
 * 
 * Safely updates any existing database records possessing the legacy 'SUPER_ADMIN' role string
 * to the authoritative 'GOD' role, and increments their tokenVersion to enforce fresh session tokens.
 */
export async function migrateSuperAdminToGod(): Promise<{ updatedCount: number }> {
  logger.info('Starting migration: SUPER_ADMIN -> GOD...');

  try {
    // 1. Update legacy User documents using MongoDB raw command to bypass Prisma Enum validation
    const rawResult: any = await prisma.$runCommandRaw({
      update: 'User',
      updates: [
        {
          q: { role: { $in: ['SUPER_ADMIN', 'super_admin'] } },
          u: {
            $set: { role: 'GOD' },
            $inc: { tokenVersion: 1 },
          },
          multi: true,
        },
      ],
    });

    const updatedCount = rawResult?.nModified ?? rawResult?.n ?? 0;
    logger.info(`Migration complete: ${updatedCount} user records modernized to GOD role.`);

    // 2. Update RBAC roles if existing
    try {
      await prisma.$runCommandRaw({
        update: 'RbacRole',
        updates: [
          {
            q: { name: 'SUPER_ADMIN' },
            u: {
              $set: { name: 'GOD', description: 'Platform Owner (GOD) with root system access.' },
            },
            multi: true,
          },
        ],
      });
    } catch {}

    return { updatedCount };
  } catch (error: any) {
    logger.error('Migration error while renaming SUPER_ADMIN to GOD', { error: error.message });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateSuperAdminToGod()
    .then((res) => {
      console.log(`✓ Migration successfully executed: ${res.updatedCount} records updated.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
