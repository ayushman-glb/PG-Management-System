import { PrismaClient, Invoice } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class BillingRepository {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async findById(id: string): Promise<Invoice | null> {
    return await this.db.invoice.findUnique({ where: { id } });
  }
}
