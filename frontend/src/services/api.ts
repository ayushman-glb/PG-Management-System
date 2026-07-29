/**
 * RoomBae Enterprise API Client
 * Connects frontend React components seamlessly to the Express REST API (/api/v1)
 */

const API_BASE = "http://localhost:5000/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

class ApiClient {
  private getToken(): string | null {
    try {
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  }

  public setToken(token: string) {
    try {
      localStorage.setItem("accessToken", token);
    } catch (e) {}
  }

  public clearToken() {
    try {
      localStorage.removeItem("accessToken");
    } catch (e) {}
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An API request error occurred");
      }

      return data;
    } catch (error: any) {
      console.warn(`[API] Endpoint ${endpoint} request failed:`, error.message);
      throw error;
    }
  }

  // --- Auth APIs ---
  async login(identifier: string, password: string) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res.data;
  }

  async register(data: { name: string; email: string; password: string; role?: string; phone?: string }) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res.data;
  }

  async sendOtp(email: string) {
    const res = await this.request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data;
  }

  async verifyOtp(email: string, otp: string) {
    const res = await this.request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    if (res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res.data;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.clearToken();
    }
  }

  // --- Properties APIs ---
  async getPublicProperties(params?: { city?: string; minRent?: number; maxRent?: number; roomType?: string }) {
    const query = new URLSearchParams();
    if (params?.city) query.append("city", params.city);
    if (params?.minRent) query.append("minRent", params.minRent.toString());
    if (params?.maxRent) query.append("maxRent", params.maxRent.toString());
    if (params?.roomType) query.append("roomType", params.roomType);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/properties/public${queryString}`);
    return res.data;
  }

  async getPropertyById(id: string) {
    const res = await this.request(`/properties/${id}`);
    return res.data;
  }

  async createProperty(propertyData: any) {
    const res = await this.request("/properties", {
      method: "POST",
      body: JSON.stringify(propertyData),
    });
    return res.data;
  }

  async getOwnerSummary() {
    const res = await this.request("/properties/owner/summary");
    return res.data;
  }

  // --- Residents & Portal APIs ---
  async onboardResident(kycData: any) {
    const res = await this.request("/residents/onboard", {
      method: "POST",
      body: JSON.stringify(kycData),
    });
    return res.data;
  }

  async getResidentDirectory(params?: { propertyId?: string; search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.propertyId) query.append("propertyId", params.propertyId);
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/residents/directory${queryString}`);
    return res.data;
  }

  async getPortalMe() {
    const res = await this.request("/residents/portal/me");
    return res.data;
  }

  async createVisitorPass(data: any) {
    const res = await this.request("/residents/portal/visitor-pass", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async createGatePass(data: any) {
    const res = await this.request("/residents/portal/gate-pass", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async toggleMealSkip(date: string, mealType: string) {
    const res = await this.request("/residents/portal/meal-skip", {
      method: "POST",
      body: JSON.stringify({ date, mealType }),
    });
    return res.data;
  }

  // --- Billing APIs ---
  async createBillingOrder(residentId: string, baseAmount: number) {
    const res = await this.request("/billing/create-order", {
      method: "POST",
      body: JSON.stringify({ residentId, baseAmount }),
    });
    return res.data;
  }

  async verifyPayment(paymentId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const res = await this.request("/billing/verify-payment", {
      method: "POST",
      body: JSON.stringify({ paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    });
    return res.data;
  }

  getInvoicePdfUrl(paymentId: string) {
    return `${API_BASE}/billing/invoices/${paymentId}/download`;
  }

  // --- Complaints APIs ---
  async listComplaints(params?: { propertyId?: string; priority?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.propertyId) query.append("propertyId", params.propertyId);
    if (params?.priority) query.append("priority", params.priority);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request(`/complaints${queryString}`);
    return res.data;
  }

  async createComplaint(data: { category: string; title: string; description: string; priority?: string }) {
    const res = await this.request("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async updateComplaintStatus(id: string, status: string) {
    const res = await this.request(`/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return res.data;
  }
}

export const api = new ApiClient();
