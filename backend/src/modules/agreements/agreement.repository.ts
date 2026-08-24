import { PrismaClient, Agreement } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class AgreementRepository {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async findById(id: string): Promise<Agreement | null> {
    return await this.db.agreement.findUnique({ where: { id } });
  }
}
