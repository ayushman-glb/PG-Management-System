import { PaymentStatus } from '@prisma/client';

export interface ICreatePaymentOrderInput {
  residentId: string;
  baseAmount: number;
  isInterstate?: boolean;
  itemCategory?: string;
  description?: string;
  dueDate?: Date;
  roomId?: string;
  bookingId?: string;
}

export interface ICreatePaymentOrderOutput {
  paymentId: string;
  invoiceNumber: string;
  receiptNumber: string;
  razorpayOrderId: string;
  orderId: string;
  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  currency: string;
  keyId: string;
  status: PaymentStatus;
}

export interface IVerifyPaymentInput {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  clientIp?: string;
}

export interface IVerifyPaymentOutput {
  success: boolean;
  paymentId: string;
  invoiceNumber: string;
  receiptNumber: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  paidAt: Date;
  residentName: string;
  propertyName?: string;
  roomNumber?: string;
  message: string;
}

export interface IPaymentHistoryFilters {
  residentId?: string;
  ownerId?: string;
  pgId?: string;
  status?: PaymentStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface IPaymentAnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  pendingAmount: number;
  refundedAmount: number;
  successfulPaymentsCount: number;
  failedPaymentsCount: number;
  collectionRatePercent: number;
  distribution: Array<{
    category: string;
    percentage: number;
    amount: number;
  }>;
  recentTrends: Array<{
    date: string;
    revenue: number;
    paymentsCount: number;
  }>;
}

export interface IRefundInput {
  paymentId: string;
  amount?: number;
  reason?: string;
}
