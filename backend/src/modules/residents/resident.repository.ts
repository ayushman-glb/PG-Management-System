import { PrismaClient, Resident, Bed, Visitor, LeaveApplication, MealSchedule } from '@prisma/client';
import { IResidentRepository, ICreateResidentData } from '../../interfaces/repositories/IResidentRepository';

export class ResidentRepository implements IResidentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<any | null> {
    try {
      return await this.db.resident.findUnique({ where: { id } });
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<any | null> {
    try {
      return await this.db.resident.findFirst({
        where: { userId },
        include: {
          user: true,
          pg: true,
          bed: { include: { room: true } },
          payments: { orderBy: { createdAt: 'desc' } },
          complaints: { orderBy: { createdAt: 'desc' } },
          visitors: { orderBy: { createdAt: 'desc' } },
          leaveApplications: { orderBy: { createdAt: 'desc' } }
        }
      });
    } catch {
      return null;
    }
  }

  async findBedById(bedId: string): Promise<Bed | null> {
    try {
      return await this.db.bed.findUnique({ where: { id: bedId } });
    } catch {
      return null;
    }
  }

  async updateBedOccupancy(bedId: string, isOccupied: boolean): Promise<Bed> {
    return this.db.bed.update({
      where: { id: bedId },
      data: { isOccupied }
    });
  }

  async createResident(data: ICreateResidentData): Promise<Resident> {
    const resUser = await this.db.user.findUnique({ where: { id: data.userId } });
    return this.db.resident.create({
      data: {
        userId: data.userId,
        pgId: data.propertyId,
        bedId: data.bedId,
        profilePicture: data.profilePicture || 'https://images.unsplash.com/photo-1534528741775?w=300',
        name: resUser?.name || 'Resident',
        gender: data.gender || 'Male',
        age: data.age || 22,
        phone: resUser?.phone || '+919876543210',
        email: resUser?.email || 'resident@roombae.com',
        permanentAddress: data.permanentAddress || 'Residential Address',
        occupation: data.occupation || 'Student',
        bloodGroup: data.bloodGroup || 'O+',
        emergencyContact: {
          create: {
            name: data.emergencyName || 'Emergency Contact',
            relation: 'Parent',
            phone: data.emergencyContact
          }
        },
        moveInDate: data.moveInDate,
        rentDueDate: data.rentDueDate
      }
    });
  }

  async getDirectory(query: { propertyId?: string; search?: string; status?: any }): Promise<any[]> {
    const where: any = {};
    if (query.propertyId) where.pgId = query.propertyId;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    try {
      return await this.db.resident.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, phone: true, residentCode: true, avatarUrl: true }
          },
          pg: {
            select: { name: true }
          },
          bed: {
            include: { room: true }
          }
        }
      });
    } catch {
      return [];
    }
  }

  async findRoomBeds(roomId: string): Promise<any[]> {
    try {
      return await this.db.bed.findMany({
        where: { roomId },
        include: {
          resident: {
            include: {
              user: { select: { name: true, phone: true, avatarUrl: true } }
            }
          }
        }
      });
    } catch {
      return [];
    }
  }

  async createVisitorPass(data: any): Promise<Visitor> {
    return this.db.visitor.create({ data });
  }

  async createGatePass(data: any): Promise<LeaveApplication> {
    return this.db.leaveApplication.create({
      data: {
        residentId: data.residentId,
        pgId: data.propertyId,
        leaveType: data.passType || 'HOME_VISIT',
        startDate: data.departureTime,
        expectedReturn: data.returnTime,
        reason: data.reason || 'Home Visit'
      }
    });
  }

  async findMealSkip(residentId: string, mealType: string, date: Date): Promise<MealSchedule | null> {
    return null;
  }

  async createMealSkip(residentId: string, mealType: string, date: Date): Promise<MealSchedule> {
    const res = await this.db.resident.findUnique({ where: { id: residentId } });
    return this.db.mealSchedule.create({
      data: {
        pgId: res!.pgId,
        dayOfWeek: 'Monday',
        breakfastMenu: 'Puri Bhaji',
        lunchMenu: 'Thali',
        snacksMenu: 'Tea',
        dinnerMenu: 'Dal Rice',
        calories: 2000
      }
    });
  }

  async deleteMealSkip(id: string): Promise<void> {}
}
