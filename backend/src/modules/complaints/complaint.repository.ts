import { PrismaClient, Complaint, TicketStatus } from '@prisma/client';
import { IComplaintRepository, ICreateComplaintData, IComplaintFilters } from '../../interfaces/repositories/IComplaintRepository';

export class ComplaintRepository implements IComplaintRepository {
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
    } catch {
      return [];
    }
  }

  async findById(id: string): Promise<Complaint | null> {
    try {
      return await this.db.complaint.findUnique({ where: { id } });
    } catch {
      return null;
    }
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Complaint> {
    return this.db.complaint.update({
      where: { id },
      data: { status }
    });
  }
}
