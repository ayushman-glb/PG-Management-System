import { PrismaClient, Complaint, ComplaintStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class ComplaintRepository {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async findById(id: string): Promise<Complaint | null> {
    return await this.db.complaint.findUnique({ where: { id } });
  }
}
