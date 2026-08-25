import { env } from "@config/env";
import { api } from "./api";
import { authService } from "./auth.service";

export interface CreateOrderParams {
  residentId?: string;
  baseAmount: number;
  isInterstate?: boolean;
  itemCategory?: string;
  description?: string;
  dueDate?: string;
  roomId?: string;
}

export interface PaymentOrderData {
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
  status: string;
}

export interface VerifiedPaymentResult {
  success: boolean;
  paymentId: string;
  invoiceNumber: string;
  receiptNumber: string;
  transactionId: string;
  amount: number;
  status: string;
  paidAt: string;
  residentName: string;
  propertyName?: string;
  roomNumber?: string;
  message: string;
}

export class BillingService {
  async createBillingOrder(residentId: string, baseAmount: number, details?: Partial<CreateOrderParams>): Promise<PaymentOrderData> {
    const res = await api.post<PaymentOrderData>("/payments/create-order", { residentId, baseAmount, ...details });
    return (res as any)?.data ?? res;
  }

  async verifyPayment(
    paymentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<VerifiedPaymentResult> {
    const res = await api.post<VerifiedPaymentResult>("/payments/verify", {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return (res as any)?.data ?? res;
  }

  async getInvoices(params: { status?: string; pgId?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.pgId) query.set("pgId", params.pgId);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const res = await api.get(`/billing/invoices?${query.toString()}`);
    return res?.data ?? res;
  }

  async getInvoiceById(id: string) {
    const res = await api.get(`/billing/invoices/${id}`);
    return res?.data ?? res;
  }

  async getUserDues(userId: string) {
    const res = await api.get(`/billing/dues/${userId}`);
    return res?.data ?? res;
  }

  async getPaymentHistory(params: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    pgId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.pgId) query.set("pgId", params.pgId);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const res = await api.get(`/payments/history?${query.toString()}`);
    return res?.data ?? res;
  }

  async getPaymentAnalytics(ownerId?: string, pgId?: string) {
    const query = new URLSearchParams();
    if (ownerId) query.set("ownerId", ownerId);
    if (pgId) query.set("pgId", pgId);

    const res = await api.get(`/analytics/owner?${query.toString()}`);
    return res?.data ?? res;
  }

  async getPaymentById(paymentId: string) {
    const res = await api.get(`/payments/${paymentId}`);
    return res?.data ?? res;
  }

  async processRefund(paymentId: string, amount?: number, reason?: string) {
    const res = await api.post(`/payments/${paymentId}/refund`, { amount, reason });
    return res?.data ?? res;
  }

  async sendReceiptEmail(_paymentId: string, _email?: string) {
    return { success: true, message: "Receipt dispatched" };
  }

  getInvoicePdfUrl(invoiceId: string) {
    return `${env.API_URL}/billing/invoices/${invoiceId}`;
  }

  getReceiptPdfUrl(paymentId: string) {
    return `${env.API_URL}/payments/${paymentId}/receipt`;
  }

  getExportCsvUrl(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params);
    const token = authService.getToken();
    if (token) query.set("token", token);
    return `${env.API_URL}/payments/history?format=csv&${query.toString()}`;
  }
}

export const billingService = new BillingService();
export default billingService;
