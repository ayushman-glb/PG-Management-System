import { Role } from '@prisma/client';

export class DataIntegrityService {
  constructor(private db: any) {}

  async runAudit(autoRepair: boolean = false): Promise<any> {
    const categories = {
      missingResidentProfiles: 0,
      bedOccupancyMismatches: 0,
    };
    let totalIssuesRepaired = 0;

    // 1. Missing resident profiles
    const residents = await this.db.user.findMany({
      where: { role: Role.RESIDENT },
    });

    for (const u of residents) {
      const existing = await this.db.resident.findFirst({ where: { userId: u.id } });
      if (!existing) {
        categories.missingResidentProfiles++;
        if (autoRepair) {
          await this.db.resident.create({
            data: {
              userId: u.id,
              name: u.name || 'Resident',
              email: u.email,
            },
          });
          totalIssuesRepaired++;
        }
      }
    }

    // 2. Bed occupancy status mismatches
    const beds = await this.db.bed.findMany();
    for (const b of beds) {
      if (b.isOccupied || b.status === 'OCCUPIED') {
        const assignedResident = await this.db.resident.findFirst({ where: { bedId: b.id } });
        if (!assignedResident) {
          categories.bedOccupancyMismatches++;
          if (autoRepair) {
            await this.db.bed.update({
              where: { id: b.id },
              data: {
                isOccupied: false,
                status: 'AVAILABLE',
              },
            });
            totalIssuesRepaired++;
          }
        }
      }
    }

    return {
      categories,
      totalIssuesRepaired,
    };
  }
}
