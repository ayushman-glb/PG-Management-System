import { PrismaClient, Payment, PaymentStatus } from '@prisma/client';
import { IBillingRepository, ICreatePaymentData } from '../interfaces/repositories/IBillingRepository';

export class PrismaBillingRepository implements IBillingRepository {
  constructor(private readonly db: PrismaClient) {}

  async createPayment(data: ICreatePaymentData): Promise<Payment> {
    return this.db.payment.create({
      data: {
        residentId: data.residentId,
        pgId: data.propertyId,
        invoiceNumber: data.invoiceNumber,
        baseAmount: data.baseAmount,
        cgstAmount: data.cgstAmount,
        sgstAmount: data.sgstAmount,
        igstAmount: data.igstAmount,
        totalAmount: data.totalAmount,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        status: data.status,
        razorpayOrderId: data.razorpayOrderId
      }
    });
  }

  async findPaymentById(id: string, propertyId?: string): Promise<Payment | null> {
    try {
      const payment = await this.db.payment.findUnique({ where: { id } });
      if (payment && propertyId && payment.pgId !== propertyId) {
        throw new Error("Unauthorized: Payment does not belong to specified PG tenant");
      }
      return payment;
    } catch (e) {
      return null;
    }
  }

  async findPaymentWithDetails(id: string, propertyId?: string): Promise<any | null> {
    try {
      const payment = await this.db.payment.findUnique({
        where: { id },
        include: {
          resident: {
            include: { user: true, bed: { include: { room: true } } }
          },
          pg: true
        }
      });
      if (payment && propertyId && payment.pgId !== propertyId) {
        throw new Error("Unauthorized: Payment does not belong to specified PG tenant");
      }
      return payment;
    } catch (e) {
      return null;
    }
  }

  async findPaymentByInvoiceNumber(invoiceNumber: string): Promise<Payment | null> {
    try {
      return await this.db.payment.findFirst({
        where: { invoiceNumber }
      });
    } catch (e) {
      return null;
    }
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    details?: { razorpayPaymentId?: string; razorpaySignature?: string; clientIp?: string },
    propertyId?: string
  ): Promise<Payment> {
    if (propertyId) {
      const payment = await this.db.payment.findUnique({ where: { id } });
      if (!payment || payment.pgId !== propertyId) {
        throw new Error("Unauthorized: Payment does not belong to specified PG tenant");
      }
    }
    return this.db.payment.update({
      where: { id },
      data: {
        status,
        ...(details?.razorpayPaymentId && { razorpayPaymentId: details.razorpayPaymentId }),
        paymentDate: status === PaymentStatus.PAID ? new Date() : undefined
      }
    });
  }
}
