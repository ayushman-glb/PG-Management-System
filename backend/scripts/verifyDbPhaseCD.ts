import { prisma } from '../src/config/prisma';
import { TokenVersionService } from '../src/services/security/TokenVersionService';
import { GodService } from '../src/modules/god/god.service';

async function verifyDatabasePhaseCD() {
  console.log('=== PHASE C & D DATABASE VERIFICATION ===\n');

  // Phase C: GOD User Record & Token Version Verification
  const godUser = await prisma.user.findFirst({
    where: { role: 'GOD' },
  });

  console.log('1. GOD User in Database:');
  console.log({
    id: godUser?.id,
    email: godUser?.email,
    role: godUser?.role,
    tokenVersion: godUser?.tokenVersion,
  });

  if (godUser) {
    const isValidV1 = await TokenVersionService.isValidTokenVersion(godUser.id, 1);
    const isValidV0 = await TokenVersionService.isValidTokenVersion(godUser.id, 0);
    console.log(`Token validation: Version 1 (current) = ${isValidV1}, Version 0 (legacy) = ${isValidV0}`);
  }

  console.log('\n2. Spot-Checks for Phase D:');
  // Raw Counts
  const ownerCount = await prisma.owner.count();
  const residentCount = await prisma.resident.count();
  const pgCount = await prisma.pG.count();
  const bedCount = await prisma.bed.count();
  const occupiedBedCount = await prisma.bed.count({ where: { status: 'OCCUPIED' } });

  console.log({
    rawOwnerCount: ownerCount,
    rawResidentCount: residentCount,
    rawPGCount: pgCount,
    rawBedCount: bedCount,
    rawOccupiedBedCount: occupiedBedCount,
  });

  // GodService.getOverview KPIs
  const godService = new GodService();
  const overview = await godService.getOverview();
  console.log('\nGodService Overview KPIs:');
  console.log(overview);

  // Spot-check Owner ID
  console.log('\n3. Owner Detail Spot-Check:');
  const sampleOwner = await prisma.owner.findFirst({
    include: {
      user: true,
      subscription: true,
      pgs: true,
    },
  });
  if (sampleOwner) {
    const detailedOwner = await godService.getOwnerById(sampleOwner.id);
    console.log({
      id: detailedOwner.owner.id,
      name: detailedOwner.owner.name,
      plan: detailedOwner.subscription?.planType || 'STARTER',
      pgCount: detailedOwner.properties.length,
      totalResidents: detailedOwner.residents.length,
    });
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
  await prisma.$disconnect();
}

verifyDatabasePhaseCD().catch((err) => {
  console.error(err);
  process.exit(1);
});
