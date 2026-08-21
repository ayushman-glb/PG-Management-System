import { prisma } from '../config/prisma';
import { TokenVersionService } from '../services/security/TokenVersionService';
import { GodService } from '../modules/god/god.service';

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
    const currentVersion = godUser.tokenVersion ?? 0;
    const isValidCurrent = await TokenVersionService.isValidTokenVersion(godUser.id, currentVersion);
    const isValidObsolete = await TokenVersionService.isValidTokenVersion(godUser.id, currentVersion - 1);
    console.log(`- Current tokenVersion (${currentVersion}) validation result:`, isValidCurrent);
    console.log(`- Obsolete tokenVersion (${currentVersion - 1}) validation result:`, isValidObsolete);
  }

  // Phase D: GOD Dashboard Numbers Against Real Database
  console.log('\n2. Spot-Checking GOD Overview Metrics:');
  const [dbOwnerCount, dbResidentCount, dbPendingKycCount, dbPendingPgs] = await Promise.all([
    prisma.owner.count(),
    prisma.resident.count(),
    prisma.ownerKYC.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.pG.count({ where: { draftStatus: 'PENDING_APPROVAL' } }),
  ]);

  console.log('Direct DB Counts:');
  console.log({
    totalOwners: dbOwnerCount,
    totalResidents: dbResidentCount,
    pendingKYC: dbPendingKycCount,
    pendingPGApprovals: dbPendingPgs,
  });

  const godService = new GodService();
  const overview = await godService.getOverview();

  console.log('\nGodService.getOverview() Result:');
  console.log({
    totalOwners: overview.totalOwners,
    totalResidents: overview.totalResidents,
    pendingKycCount: overview.systemMetrics.pendingKycCount,
    pendingPropertyApprovals: overview.systemMetrics.pendingPropertyApprovals,
    totalProperties: overview.totalProperties,
    occupancyRate: overview.occupancyRate,
    monthlySaaSRevenue: overview.monthlySaaSRevenue,
    annualRunRate: overview.annualRunRate,
    totalPlatformRevenue: overview.totalPlatformRevenue,
  });

  // Verify Owners endpoint
  const ownersResult = await godService.getOwners({ page: 1, limit: 10 });
  console.log(`\nGodService.getOwners() returned ${ownersResult.owners.length} owners (Total: ${ownersResult.pagination.total})`);

  // Spot-check individual owner if available
  if (ownersResult.owners.length > 0) {
    const firstOwner = ownersResult.owners[0];
    const singleOwner = await godService.getOwnerById(firstOwner.id);
    console.log('\nSpot-check First Owner Details:');
    console.log({
      id: singleOwner.owner?.id,
      name: singleOwner.owner?.name,
      email: singleOwner.owner?.email,
      totalPGs: singleOwner.properties?.length,
      kycStatus: singleOwner.kyc?.status,
      subscriptionPlan: singleOwner.subscription?.planType,
    });
  }

  await prisma.$disconnect();
  console.log('\n✓ Phase C & D Database verification completed successfully.');
}

verifyDatabasePhaseCD().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
