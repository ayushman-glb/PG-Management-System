export interface Visitor {
  id: string;
  name: string;
  phone: string;
  residentId: string;
  visitDate: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}
