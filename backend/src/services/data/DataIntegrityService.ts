import { PrismaClient, Role } from '@prisma/client';
import { prisma as defaultPrisma } from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface IIntegrityIssue {
  category: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  entityId?: string;
  repaired: boolean;
  actionTaken?: string;
}

export interface IIntegrityReport {
  timestamp: string;
  mode: 'DRY_RUN' | 'AUTO_REPAIR';
  totalIssuesFound: number;
  totalIssuesRepaired: number;
  categories: {
    duplicateEmails: number;
    duplicatePhones: number;
    missingOwnerProfiles: number;
    missingResidentProfiles: number;
    orphanedOwners: number;
    orphanedResidents: number;
    bedOccupancyMismatches: number;
    brokenReferences: number;
  };
  issues: IIntegrityIssue[];
}

export class DataIntegrityService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  private get client(): PrismaClient {
    return (global as any).prismaSingleton || this.prisma;
  }

  /**
   * Scans the database for integrity issues and optionally repairs them automatically.
   */
  async runAudit(autoRepair: boolean = false): Promise<IIntegrityReport> {
    const report: IIntegrityReport = {
      timestamp: new Date().toISOString(),
      mode: autoRepair ? 'AUTO_REPAIR' : 'DRY_RUN',
      totalIssuesFound: 0,
      totalIssuesRepaired: 0,
      categories: {
        duplicateEmails: 0,
        duplicatePhones: 0,
        missingOwnerProfiles: 0,
        missingResidentProfiles: 0,
        orphanedOwners: 0,
        orphanedResidents: 0,
        bedOccupancyMismatches: 0,
        brokenReferences: 0,
      },
      issues: [],
    };

    // 1. Audit Duplicate / Case-Collision Emails & Phones
    await this.auditEmailAndPhoneDuplicates(report, autoRepair);

    // 2. Audit Missing Owner Profiles for OWNER Users
    await this.auditMissingOwnerProfiles(report, autoRepair);

    // 3. Audit Missing Resident Profiles for RESIDENT Users
    await this.auditMissingResidentProfiles(report, autoRepair);

    // 4. Audit Orphaned Owner & Resident Profiles (pointing to non-existent User)
    await this.auditOrphanedProfiles(report, autoRepair);

    // 5. Audit Bed Occupancy Status vs Resident Bed Assignment
    await this.auditBedOccupancyStatus(report, autoRepair);

    // Update totals
    report.totalIssuesFound = report.issues.length;
    report.totalIssuesRepaired = report.issues.filter((i) => i.repaired).length;

    return report;
  }

  private async auditEmailAndPhoneDuplicates(report: IIntegrityReport, _autoRepair: boolean): Promise<void> {
    try {
      const users = await this.client.user.findMany({
        select: { id: true, email: true, phone: true },
      });

      const emailMap = new Map<string, string[]>();
      const phoneMap = new Map<string, string[]>();

      for (const u of users) {
        const canonicalEmail = u.email.trim().toLowerCase();
        if (!emailMap.has(canonicalEmail)) emailMap.set(canonicalEmail, []);
        emailMap.get(canonicalEmail)!.push(u.id);

        if (u.phone) {
          const canonicalPhone = u.phone.replace(/\D/g, '');
          if (canonicalPhone.length >= 10) {
            if (!phoneMap.has(canonicalPhone)) phoneMap.set(canonicalPhone, []);
            phoneMap.get(canonicalPhone)!.push(u.id);
          }
        }
      }

      // Check email duplicates
      for (const [email, ids] of emailMap.entries()) {
        if (ids.length > 1) {
          report.categories.duplicateEmails++;
          report.issues.push({
            category: 'DUPLICATE_EMAIL',
            severity: 'CRITICAL',
            description: `Case-collision / duplicate email "${email}" found across users: ${ids.join(', ')}`,
            entityId: ids[0],
            repaired: false,
          });
        }
      }

      // Check phone duplicates
      for (const [phone, ids] of phoneMap.entries()) {
        if (ids.length > 1) {
          report.categories.duplicatePhones++;
          report.issues.push({
            category: 'DUPLICATE_PHONE',
            severity: 'WARNING',
            description: `Duplicate phone "${phone}" found across users: ${ids.join(', ')}`,
            entityId: ids[0],
            repaired: false,
          });
        }
      }
    } catch (err: any) {
      logger.warn('Error in auditEmailAndPhoneDuplicates:', err.message);
    }
  }

  private async auditMissingOwnerProfiles(report: IIntegrityReport, autoRepair: boolean): Promise<void> {
    try {
      const ownerUsers = await this.client.user.findMany({
        where: { role: Role.OWNER },
      });

      for (const user of ownerUsers) {
        const owner = await this.client.owner.findFirst({ where: { userId: user.id } });
        if (!owner) {
          report.categories.missingOwnerProfiles++;
          let repaired = false;
          let actionTaken: string | undefined;

          if (autoRepair) {
            try {
              await this.client.owner.create({
                data: {
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '',
                  photo: user.avatarUrl || 'https://res.cloudinary.com/roombae/image/upload/v1700000000/default-owner.png',
                  address: '',
                  aadhaarNumber: '',
                  panNumber: '',
                  upiId: '',
                  bankName: '',
                  accountNumber: '',
                  ifscCode: '',
                  emergencyContact: '',
                },
              });
              repaired = true;
              actionTaken = `Created linked Owner profile for user ${user.id}`;
            } catch (createErr: any) {
              actionTaken = `Auto-repair failed: ${createErr.message}`;
            }
          }

          report.issues.push({
            category: 'MISSING_OWNER_PROFILE',
            severity: 'ERROR',
            description: `User ${user.id} (${user.email}) has role OWNER but no Owner profile document`,
            entityId: user.id,
            repaired,
            actionTaken,
          });
        }
      }
    } catch (err: any) {
      logger.warn('Error in auditMissingOwnerProfiles:', err.message);
    }
  }

  private async auditMissingResidentProfiles(report: IIntegrityReport, autoRepair: boolean): Promise<void> {
    try {
      const residentUsers = await this.client.user.findMany({
        where: { role: Role.RESIDENT },
      });

      for (const user of residentUsers) {
        const resident = await this.client.resident.findFirst({ where: { userId: user.id } });
        if (!resident) {
          report.categories.missingResidentProfiles++;
          let repaired = false;
          let actionTaken: string | undefined;

          if (autoRepair) {
            try {
              await this.client.resident.create({
                data: {
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '+919800000000',
                  profilePicture: user.avatarUrl || 'https://res.cloudinary.com/roombae/image/upload/v1700000000/default-avatar.png',
                  status: 'ACTIVE',
                },
              });
              repaired = true;
              actionTaken = `Created linked Resident profile for user ${user.id}`;
            } catch (createErr: any) {
              actionTaken = `Auto-repair failed: ${createErr.message}`;
            }
          }

          report.issues.push({
            category: 'MISSING_RESIDENT_PROFILE',
            severity: 'ERROR',
            description: `User ${user.id} (${user.email}) has role RESIDENT but no Resident profile document`,
            entityId: user.id,
            repaired,
            actionTaken,
          });
        }
      }
    } catch (err: any) {
      logger.warn('Error in auditMissingResidentProfiles:', err.message);
    }
  }

  private async auditOrphanedProfiles(report: IIntegrityReport, _autoRepair: boolean): Promise<void> {
    try {
      const [owners, residents] = await Promise.all([
        this.client.owner.findMany({ select: { id: true, userId: true, email: true } }),
        this.client.resident.findMany({ select: { id: true, userId: true, email: true } }),
      ]);

      for (const o of owners) {
        if (o.userId) {
          const user = await this.client.user.findUnique({ where: { id: o.userId } });
          if (!user) {
            report.categories.orphanedOwners++;
            report.issues.push({
              category: 'ORPHANED_OWNER',
              severity: 'WARNING',
              description: `Owner ${o.id} references non-existent User ${o.userId}`,
              entityId: o.id,
              repaired: false,
            });
          }
        }
      }

      for (const r of residents) {
        if (r.userId) {
          const user = await this.client.user.findUnique({ where: { id: r.userId } });
          if (!user) {
            report.categories.orphanedResidents++;
            report.issues.push({
              category: 'ORPHANED_RESIDENT',
              severity: 'WARNING',
              description: `Resident ${r.id} references non-existent User ${r.userId}`,
              entityId: r.id,
              repaired: false,
            });
          }
        }
      }
    } catch (err: any) {
      logger.warn('Error in auditOrphanedProfiles:', err.message);
    }
  }

  private async auditBedOccupancyStatus(report: IIntegrityReport, autoRepair: boolean): Promise<void> {
    try {
      const beds = await this.client.bed.findMany({
        select: { id: true, bedNumber: true, isOccupied: true, status: true },
      });

      for (const bed of beds) {
        const activeResident = await this.client.resident.findFirst({
          where: { bedId: bed.id, status: 'ACTIVE' },
        });

        const shouldBeOccupied = !!activeResident;
        if (bed.isOccupied !== shouldBeOccupied) {
          report.categories.bedOccupancyMismatches++;
          let repaired = false;
          let actionTaken: string | undefined;

          if (autoRepair) {
            try {
              await this.client.bed.update({
                where: { id: bed.id },
                data: {
                  isOccupied: shouldBeOccupied,
                  status: shouldBeOccupied ? 'OCCUPIED' : 'AVAILABLE',
                },
              });
              repaired = true;
              actionTaken = `Synchronized bed ${bed.id} isOccupied from ${bed.isOccupied} to ${shouldBeOccupied}`;
            } catch (updateErr: any) {
              actionTaken = `Auto-repair failed: ${updateErr.message}`;
            }
          }

          report.issues.push({
            category: 'BED_OCCUPANCY_MISMATCH',
            severity: 'WARNING',
            description: `Bed ${bed.id} (${bed.bedNumber}) has isOccupied=${bed.isOccupied} but active resident is ${shouldBeOccupied ? 'present' : 'absent'}`,
            entityId: bed.id,
            repaired,
            actionTaken,
          });
        }
      }
    } catch (err: any) {
      logger.warn('Error in auditBedOccupancyStatus:', err.message);
    }
  }
}
