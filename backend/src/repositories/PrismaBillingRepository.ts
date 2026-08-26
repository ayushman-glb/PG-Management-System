export class PrismaBillingRepository {
  constructor(private db: any) {}

  async findPaymentById(id: string, propertyId?: string) {
    const payment = await this.db.payment.findUnique({ where: { id } });
    if (!payment) return null;
    if (propertyId && payment.pgId !== propertyId) {
      return null;
    }
    return payment;
  }

  async updatePaymentStatus(id: string, status: any, txId?: string, propertyId?: string) {
    const payment = await this.db.payment.findUnique({ where: { id } });
    if (!payment) throw new Error('Payment not found');
    if (propertyId && payment.pgId !== propertyId) {
      throw new Error('Unauthorized: Payment does not belong to specified PG tenant');
    }
    return await this.db.payment.update({
      where: { id },
      data: { status, ...(txId ? { transactionId: txId } : {}) },
    });
  }
}
