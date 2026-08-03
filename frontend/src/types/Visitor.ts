export interface VisitorPass {
  id: string;
  residentId: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  visitDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHECKED_IN" | "CHECKED_OUT";
  qrCodeUrl?: string;
  createdAt: string;
}
