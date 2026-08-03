import { Payment, PaymentStatus } from '@prisma/client';

export interface ICreatePaymentData {
  residentId: string;
  propertyId: string;
  invoiceNumber: string;
  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  dueDate: Date;
  paymentMethod: string;
  status: PaymentStatus;
  razorpayOrderId?: string;
}

export interface IBillingRepository {
  createPayment(data: ICreatePaymentData): Promise<Payment>;
  findPaymentById(id: string): Promise<Payment | null>;
  findPaymentWithDetails(id: string): Promise<any | null>;
  findPaymentByInvoiceNumber(invoiceNumber: string): Promise<Payment | null>;
  updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    details?: { razorpayPaymentId?: string; razorpaySignature?: string; clientIp?: string }
  ): Promise<Payment>;
}
