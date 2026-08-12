import { API_CONFIG } from "@config/api";
import { authService } from "./auth.service";
import { deviceIdentityProvider } from "./deviceIdentity";
import { propertyService } from "./property.service";
import { residentService } from "./resident.service";
import { billingService } from "./billing.service";
import { complaintService } from "./complaint.service";
import { roomService } from "./room.service";
import { bedService } from "./bed.service";
import { visitorService } from "./visitor.service";
import { agreementService } from "./agreement.service";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

class ApiClient {
  public async request<T = any>(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<T> {
    const token = typeof localStorage !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("token")) : null;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const identity = await deviceIdentityProvider.getDeviceIdentity();
      if (identity && identity.visitorId) {
        headers["X-Visitor-Id"] = identity.visitorId;
      }
    } catch {
      // Ignore device identity error if blocked
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401 && !isRetry && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      try {
        const refreshed = await authService.refreshToken();
        if (refreshed?.accessToken) {
          authService.setToken(refreshed.accessToken);
          return this.request<T>(endpoint, options, true);
        }
      } catch {
        authService.clearToken();
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error ${res.status}`);
    }

    const method = (options.method || "GET").toUpperCase();
    if (method !== "GET" && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("roombae-data-changed", { detail: { endpoint, method } }));
    }

    return res.json();
  }

  public get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const body = isFormData ? data : JSON.stringify(data);
    const customHeaders = { ...(options?.headers as Record<string, string>) };

    if (isFormData) {
      delete customHeaders["Content-Type"];
      delete customHeaders["content-type"];
    }

    const headers: Record<string, string> = isFormData
      ? customHeaders
      : { "Content-Type": "application/json", ...customHeaders };

    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body,
      headers,
    });
  }

  public put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...(options?.headers as Record<string, string>) },
    });
  }

  public patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...(options?.headers as Record<string, string>) },
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  public login = authService.login.bind(authService);
  public register = authService.register.bind(authService);
  public sendOtp = authService.sendOtp.bind(authService);
  public verifyOtp = authService.verifyOtp.bind(authService);
  public logout = authService.logout.bind(authService);

  public getPublicProperties = propertyService.getPublicProperties.bind(propertyService);
  public getPropertyById = propertyService.getPropertyById.bind(propertyService);
  public createProperty = propertyService.createProperty.bind(propertyService);
  public getOwnerSummary = propertyService.getOwnerSummary.bind(propertyService);

  public onboardResident = residentService.onboardResident.bind(residentService);
  public getResidentDirectory = residentService.getResidentDirectory.bind(residentService);
  public getPortalMe = residentService.getPortalMe.bind(residentService);
  public updateResidentStatus = residentService.updateResidentStatus.bind(residentService);
  public getResidentStatusHistory = residentService.getResidentStatusHistory.bind(residentService);

  public createVisitorPass = visitorService.createVisitorPass.bind(visitorService);
  public createGatePass = visitorService.createGatePass.bind(visitorService);

  public createBillingOrder = billingService.createBillingOrder.bind(billingService);
  public verifyPayment = billingService.verifyPayment.bind(billingService);
  public getInvoicePdfUrl = billingService.getInvoicePdfUrl.bind(billingService);

  public listComplaints = complaintService.listComplaints.bind(complaintService);
  public createComplaint = complaintService.createComplaint.bind(complaintService);
  public updateComplaintStatus = complaintService.updateComplaintStatus.bind(complaintService);

  public updateBedStatus = bedService.updateBedStatus.bind(bedService);
  public createBedHold = bedService.createBedHold.bind(bedService);
  public releaseBedHold = bedService.releaseBedHold.bind(bedService);
  public getBedHolds = bedService.getBedHolds.bind(bedService);

  public createRoomTransferRequest = roomService.createRoomTransferRequest.bind(roomService);
  public getRoomTransferRequests = roomService.getRoomTransferRequests.bind(roomService);
  public approveRoomTransfer = roomService.approveRoomTransfer.bind(roomService);
  public rejectRoomTransfer = roomService.rejectRoomTransfer.bind(roomService);
  public completeRoomTransfer = roomService.completeRoomTransfer.bind(roomService);

  public getResidentAgreements = agreementService.getResidentAgreements.bind(agreementService);
  public getAgreementById = agreementService.getAgreementById.bind(agreementService);
  public signAgreement = agreementService.signAgreement.bind(agreementService);
  public verifyAgreement = agreementService.verifyAgreement.bind(agreementService);

  // Rental Platform APIs
  public toggleShortlist = (propertyId: string) => this.post(`/shortlist/${propertyId}`);
  public getShortlist = () => this.get("/shortlist");
  public requestTour = (data: { propertyId: string; requestedSlot: string; notes?: string }) => this.post("/tours", data);
  public getTours = () => this.get("/tours");
  public updateTourStatus = (id: string, data: { status: string; ownerNotes?: string; requestedSlot?: string }) => this.patch(`/tours/${id}`, data);

  public createApplication = (data: any) => this.post("/applications", data);
  public uploadApplicationDoc = (appId: string, docData: any) => this.post(`/applications/${appId}/documents`, docData);
  public getApplication = (id: string) => this.get(`/applications/${id}`);
  public getApplications = () => this.get("/applications");
  public updateApplicationStatus = (id: string, statusData: any) => this.patch(`/applications/${id}/status`, statusData);
  public signLease = (id: string, signData: any) => this.post(`/applications/${id}/sign-lease`, signData);

  public getOrCreateThread = (pgId: string) => this.post("/messages/thread", { pgId });
  public getThreads = () => this.get("/messages/threads");
  public getThreadMessages = (threadId: string) => this.get(`/messages/thread/${threadId}`);
  public sendMessage = (data: { threadId: string; content: string }) => this.post("/messages", data);

  public getMoveInInfo = (propertyId: string) => this.get(`/move-in/${propertyId}`);
  public updateMoveInInfo = (propertyId: string, data: any) => this.post(`/move-in/${propertyId}`, data);
  public getTenantDashboardSummary = () => this.get("/move-in/tenant-summary");
}

export const api = new ApiClient();
