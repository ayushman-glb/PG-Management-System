import { prisma } from "../src/config/prisma";
import { EncryptionService } from "../src/services/security/EncryptionService";
import { SecurityAuditService } from "../src/services/security/SecurityAuditService";
import { logger } from "../src/utils/logger";

/**
 * Data Encryption Key Rotation CLI Migration Script
 * 
 * Re-encrypts all database records with sensitive encrypted fields (Aadhaar, PAN, Bank Details, UPI)
 * to the active encryption key specified in ACTIVE_ENCRYPTION_KEY or target parameter.
 * 
 * Usage:
 *   npx ts-node scripts/rotate-encryption.ts [targetKeyId]
 */
async function rotateEncryptionKeys(): Promise<void> {
  const targetKeyId = process.argv[2] || process.env.ACTIVE_ENCRYPTION_KEY || "v2";
  logger.info(`🔐 Starting Database Field Re-Encryption to target key: ${targetKeyId}`);

  let totalMigrated = 0;

  try {
    // 1. Rotate Owner Profile Bank & Financial Details
    const owners = await prisma.ownerProfile.findMany();
    logger.info(`Found ${owners.length} OwnerProfile records to inspect for rotation`);

    for (const owner of owners) {
      let needsUpdate = false;
      const updatedData: any = {};

      if (owner.bankDetails && typeof owner.bankDetails === "string") {
        const rotated = EncryptionService.rotate(owner.bankDetails, targetKeyId);
        if (rotated !== owner.bankDetails) {
          updatedData.bankDetails = rotated;
          needsUpdate = true;
        }
      }

      if (owner.upiId && typeof owner.upiId === "string") {
        const rotated = EncryptionService.rotate(owner.upiId, targetKeyId);
        if (rotated !== owner.upiId) {
          updatedData.upiId = rotated;
          needsUpdate = true;
        }
      }

      if (owner.gstNumber && typeof owner.gstNumber === "string") {
        const rotated = EncryptionService.rotate(owner.gstNumber, targetKeyId);
        if (rotated !== owner.gstNumber) {
          updatedData.gstNumber = rotated;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.ownerProfile.update({
          where: { id: owner.id },
          data: updatedData,
        });
        totalMigrated++;
      }
    }

    // 2. Rotate OwnerKYC Documents / Identification Numbers
    const kycRecords = await prisma.ownerKYC.findMany();
    logger.info(`Found ${kycRecords.length} OwnerKYC records to inspect for rotation`);

    for (const kyc of kycRecords) {
      let needsUpdate = false;
      const updatedData: any = {};

      if (kyc.idNumber && typeof kyc.idNumber === "string") {
        const rotated = EncryptionService.rotate(kyc.idNumber, targetKeyId);
        if (rotated !== kyc.idNumber) {
          updatedData.idNumber = rotated;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.ownerKYC.update({
          where: { id: kyc.id },
          data: updatedData,
        });
        totalMigrated++;
      }
    }

    // 3. Log Audit Event
    await SecurityAuditService.logKeyRotation(
      undefined,
      "v1",
      targetKeyId,
      totalMigrated
    );

    logger.info(`✅ Key rotation migration completed successfully! ${totalMigrated} fields re-encrypted.`);
  } catch (err: any) {
    logger.error("❌ Key rotation migration failed", { error: err.message });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  rotateEncryptionKeys();
}

export { rotateEncryptionKeys };
