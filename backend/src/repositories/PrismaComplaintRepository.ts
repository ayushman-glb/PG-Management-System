import { PrismaClient, Complaint, TicketStatus } from '@prisma/client';
import { IComplaintRepository, ICreateComplaintData, IComplaintFilters } from '../interfaces/repositories/IComplaintRepository';

export class PrismaComplaintRepository implements IComplaintRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: ICreateComplaintData): Promise<Complaint> {
    return this.db.complaint.create({
      data: {
        ticketCode: data.ticketCode,
        residentId: data.residentId,
        pgId: data.propertyId,
        category: data.category,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status
      }
    });
  }

  async findMany(filters: IComplaintFilters): Promise<any[]> {
    const where: any = {};
    if (filters.propertyId) where.pgId = filters.propertyId;
    if (filters.priority) where.priority = filters.priority;
    if (filters.status) where.status = filters.status;

    try {
      return await this.db.complaint.findMany({
        where,
        include: {
          resident: {
            include: {
              user: { select: { name: true, phone: true } },
              bed: { include: { room: true } }
            }
          },
          pg: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  }

  async findById(id: string, propertyId?: string): Promise<Complaint | null> {
    try {
      const complaint = await this.db.complaint.findUnique({ where: { id } });
      if (complaint && propertyId && complaint.pgId !== propertyId) {
        throw new Error("Unauthorized: Complaint does not belong to specified PG tenant");
      }
      return complaint;
    } catch (e) {
      return null;
    }
  }

  async updateStatus(id: string, status: TicketStatus, propertyId?: string): Promise<Complaint> {
    if (propertyId) {
      const complaint = await this.db.complaint.findUnique({ where: { id } });
      if (!complaint || complaint.pgId !== propertyId) {
        throw new Error("Unauthorized: Complaint does not belong to specified PG tenant");
      }
    }
    return this.db.complaint.update({
      where: { id },
      data: { status }
    });
  }
}
