import { prisma } from "../../config/prisma";
import { OwnerKYCStatus } from "@prisma/client";
import { logger } from "../../utils/logger";

/**
 * Single Source of Truth KYC Authorization & Governance Service
 * 
 * Solves the dual-source-of-truth vulnerability by designating `OwnerKYC.verificationStatus`
 * as the sole authoritative verification gate for Owner operations.
 * 
 * Rules:
 * - `OwnerKYC.verificationStatus` is the authoritative source of truth.
 * - `User.kycStatus` exists solely as a synchronized mirror updated in atomic transactions.
 * - Authorization checks query `OwnerKYC.verificationStatus` exclusively.
 * - Corrupted, missing, pending, or rejected records FAIL CLOSED (unauthorized).
 */
export class KycAuthorizationService {
  /**
   * Evaluates whether an owner has an approved and active KYC status.
   * Fails closed if the owner profile or KYC record is missing or corrupted.
   */
  public static async isOwnerKycApproved(userId: string): Promise<boolean> {
    if (!userId) return false;

    try {
      const owner = await prisma.owner.findUnique({
        where: { userId },
        include: {
          kyc: {
            select: {
              verificationStatus: true,
            },
          },
        },
      });

      if (!owner || !owner.kyc) {
        return false;
      }

      // Single authoritative check
      return owner.kyc.verificationStatus === OwnerKYCStatus.VERIFIED;
    } catch (err: any) {
      logger.error("KycAuthorizationService evaluation error, failing closed", { userId, error: err.message });
      return false; // Fail closed
    }
  }

  /**
   * Evaluates the comprehensive KYC status and returns structured result with denial reason
   */
  public static async evaluateOwnerKycStatus(userId: string): Promise<{
    isApproved: boolean;
    status: string;
    denialReason?: string;
  }> {
    if (!userId) {
      return { isApproved: false, status: "UNAUTHENTICATED", denialReason: "User ID required" };
    }

    try {
      const owner = await prisma.owner.findUnique({
        where: { userId },
        include: {
          kyc: {
            select: {
              verificationStatus: true,
              rejectionReason: true,
            },
          },
        },
      });

      if (!owner) {
        return { isApproved: false, status: "NO_OWNER_PROFILE", denialReason: "Owner profile not found" };
      }

      if (!owner.kyc) {
        return { isApproved: false, status: "PENDING", denialReason: "KYC verification documents not submitted" };
      }

      const isApproved = owner.kyc.verificationStatus === OwnerKYCStatus.VERIFIED;
      return {
        isApproved,
        status: owner.kyc.verificationStatus,
        denialReason: isApproved
          ? undefined
          : owner.kyc.rejectionReason || `Owner KYC status is ${owner.kyc.verificationStatus}`,
      };
    } catch (err: any) {
      logger.error("KycAuthorizationService evaluateOwnerKycStatus error", { userId, error: err.message });
      return { isApproved: false, status: "ERROR", denialReason: "Error verifying KYC status" };
    }
  }

  /**
   * Retrieves the comprehensive KYC status for a user/owner.
   */
  public static async getOwnerKycRecord(userId: string) {
    if (!userId) return null;

    try {
      const owner = await prisma.owner.findUnique({
        where: { userId },
        include: {
          kyc: true,
        },
      });

      return owner?.kyc || null;
    } catch (err: any) {
      logger.error("Error retrieving owner KYC record", { userId, error: err.message });
      return null;
    }
  }

  /**
   * Atomically approves an Owner's KYC within a Prisma transaction.
   * Updates `OwnerKYC.verificationStatus` as authority and syncs `User.kycStatus` as mirror.
   */
  public static async approveOwnerKyc(
    ownerId: string,
    adminId: string,
    remarks?: string
  ): Promise<{ success: boolean; kyc: any }> {
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { id: true, userId: true },
    });

    if (!owner) {
      throw new Error("Owner profile not found");
    }

    const [updatedKyc] = await prisma.$transaction([
      prisma.ownerKYC.upsert({
        where: { ownerId: owner.id },
        update: {
          verificationStatus: OwnerKYCStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedBy: adminId,
          rejectionReason: null,
        },
        create: {
          ownerId: owner.id,
          aadhaarNumber: "PENDING_ENCRYPTED",
          panNumber: "PENDING_ENCRYPTED",
          verificationStatus: OwnerKYCStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedBy: adminId,
        },
      }),
      prisma.user.update({
        where: { id: owner.userId },
        data: {
          kycStatus: "APPROVED",
          verificationStatus: "VERIFIED",
        },
      }),
    ]);

    logger.info("Owner KYC approved atomically via KycAuthorizationService", {
      ownerId,
      userId: owner.userId,
      adminId,
    });

    return { success: true, kyc: updatedKyc };
  }

  /**
   * Atomically rejects an Owner's KYC within a Prisma transaction.
   */
  public static async rejectOwnerKyc(
    ownerId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; kyc: any }> {
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { id: true, userId: true },
    });

    if (!owner) {
      throw new Error("Owner profile not found");
    }

    const [updatedKyc] = await prisma.$transaction([
      prisma.ownerKYC.update({
        where: { ownerId: owner.id },
        data: {
          verificationStatus: OwnerKYCStatus.REJECTED,
          rejectionReason: reason,
          verifiedBy: adminId,
        },
      }),
      prisma.user.update({
        where: { id: owner.userId },
        data: {
          kycStatus: "REJECTED",
        },
      }),
    ]);

    logger.warn("Owner KYC rejected atomically via KycAuthorizationService", {
      ownerId,
      userId: owner.userId,
      adminId,
      reason,
    });

    return { success: true, kyc: updatedKyc };
  }
}
