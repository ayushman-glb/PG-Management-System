import { env } from "@config/env";
import type { ApiResponse } from "../types";
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
  private getToken(): string | null {
    return authService.getToken();
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${env.API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Billing API request failed");
    }
    return data;
  }

  /**
   * Create Razorpay payment order
   */
  async createBillingOrder(residentId: string, baseAmount: number, details?: Partial<CreateOrderParams>): Promise<PaymentOrderData> {
    const res = await this.request<PaymentOrderData>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ residentId, baseAmount, ...details }),
    });
    return res.data;
  }

  /**
   * Verify cryptographic Razorpay signature and record payment
   */
  async verifyPayment(
    paymentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<VerifiedPaymentResult> {
    const res = await this.request<VerifiedPaymentResult>("/payments/verify", {
      method: "POST",
      body: JSON.stringify({ paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    });
    return res.data;
  }

  /**
   * Get payments history with filters
   */
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

    const res = await this.request(`/payments/history?${query.toString()}`);
    return res.data;
  }

  /**
   * Get aggregated payment analytics
   */
  async getPaymentAnalytics(ownerId?: string, pgId?: string) {
    const query = new URLSearchParams();
    if (ownerId) query.set("ownerId", ownerId);
    if (pgId) query.set("pgId", pgId);

    const res = await this.request(`/payments/analytics?${query.toString()}`);
    return res.data;
  }

  /**
   * Get single payment details
   */
  async getPaymentById(paymentId: string) {
    const res = await this.request(`/payments/${paymentId}`);
    return res.data;
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number, reason?: string) {
    const res = await this.request(`/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount, reason }),
    });
    return res.data;
  }

  /**
   * Send payment receipt email
   */
  async sendReceiptEmail(paymentId: string, email?: string) {
    const res = await this.request("/billing/send-receipt", {
      method: "POST",
      body: JSON.stringify({ paymentId, email }),
    });
    return res.data;
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(paymentId: string, email?: string) {
    const res = await this.request("/billing/send-invoice", {
      method: "POST",
      body: JSON.stringify({ paymentId, email }),
    });
    return res.data;
  }

  /**
   * Download Invoice PDF URL
   */
  getInvoicePdfUrl(paymentId: string) {
    return `${env.API_URL}/billing/invoices/${paymentId}/download`;
  }

  /**
   * Download Receipt PDF URL
   */
  getReceiptPdfUrl(paymentId: string) {
    return `${env.API_URL}/billing/receipts/${paymentId}/download`;
  }

  /**
   * Export CSV payments URL
   */
  getExportCsvUrl(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params);
    const token = this.getToken();
    if (token) query.set("token", token);
    return `${env.API_URL}/payments/export/csv?${query.toString()}`;
  }
}

export const billingService = new BillingService();
export default billingService;
