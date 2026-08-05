import { env } from "@config/env";
import type { ApiResponse } from "../types";

export class BillingService {
  private getToken(): string | null {
    try {
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
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

  async createBillingOrder(residentId: string, baseAmount: number, recaptchaToken?: string) {
    const res = await this.request("/billing/create-order", {
      method: "POST",
      body: JSON.stringify({ residentId, baseAmount, recaptchaToken }),
    });
    return res.data;
  }

  async verifyPayment(paymentId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, recaptchaToken?: string) {
    const res = await this.request("/billing/verify-payment", {
      method: "POST",
      body: JSON.stringify({ paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, recaptchaToken }),
    });
    return res.data;
  }

  getInvoicePdfUrl(paymentId: string) {
    return `${env.API_URL}/billing/invoices/${paymentId}/download`;
  }
}

export const billingService = new BillingService();
