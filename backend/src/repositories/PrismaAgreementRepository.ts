export class PrismaAgreementRepository {
  constructor(private db: any) {}

  async findById(id: string, pgId?: string) {
    const agreement = await this.db.agreement.findUnique({ where: { id } });
    if (!agreement) return null;
    if (pgId && agreement.pgId !== pgId) {
      throw new Error('Unauthorized: Agreement does not belong to specified PG tenant');
    }
    return agreement;
  }

  async updateStatus(id: string, status: string, pgId?: string) {
    const agreement = await this.findById(id, pgId);
    if (!agreement) throw new Error('Agreement not found');
    return await this.db.agreement.update({
      where: { id },
      data: { status },
    });
  }
}
