import { prisma } from '../src/config/prisma';
import { DataIntegrityService } from '../src/services/data/DataIntegrityService';

async function main() {
  const isAutoRepair = process.argv.includes('--repair') || process.argv.includes('--fix');
  const service = new DataIntegrityService(prisma);

  console.log('================================================================================');
  console.log('🔍 RoomBae — Database Integrity & Schema Alignment Audit');
  console.log(`Mode: ${isAutoRepair ? '🔧 AUTO-REPAIR' : '📋 DRY-RUN (Audit Only)'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  try {
    const report = await service.runAudit(isAutoRepair);

    console.log('📊 AUDIT SUMMARY:');
    console.log(`- Duplicate Emails Detected         : ${report.categories.duplicateEmails}`);
    console.log(`- Duplicate Phones Detected         : ${report.categories.duplicatePhones}`);
    console.log(`- Missing Owner Profiles            : ${report.categories.missingOwnerProfiles}`);
    console.log(`- Missing Resident Profiles         : ${report.categories.missingResidentProfiles}`);
    console.log(`- Orphaned Owner Records            : ${report.categories.orphanedOwners}`);
    console.log(`- Orphaned Resident Records         : ${report.categories.orphanedResidents}`);
    console.log(`- Bed Occupancy Inconsistencies     : ${report.categories.bedOccupancyMismatches}`);
    console.log('--------------------------------------------------------------------------------');
    console.log(`Total Issues Found                  : ${report.totalIssuesFound}`);
    console.log(`Total Issues Repaired               : ${report.totalIssuesRepaired}\n`);

    if (report.issues.length > 0) {
      console.log('📝 DETAILED FINDINGS:');
      report.issues.forEach((issue, idx) => {
        const icon = issue.severity === 'CRITICAL' ? '🛑' : issue.severity === 'ERROR' ? '❌' : '⚠️';
        const repairTag = issue.repaired ? ' [REPAIRED ✅]' : '';
        console.log(`[${idx + 1}] ${icon} [${issue.category}] ${issue.description}${repairTag}`);
        if (issue.actionTaken) {
          console.log(`    ↳ Action: ${issue.actionTaken}`);
        }
      });
    } else {
      console.log('✅ Database is 100% synchronized and consistent. No integrity issues found!');
    }

    console.log('\n================================================================================');
  } catch (error: any) {
    console.error('❌ Audit execution failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
