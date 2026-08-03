export interface Complaint {
  id: string;
  residentId: string;
  residentName?: string;
  roomNumber?: string;
  category: "PLUMBING" | "ELECTRICAL" | "WIFI" | "CLEANING" | "FOOD" | "OTHER";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt?: string;
  assignedStaff?: string;
}
