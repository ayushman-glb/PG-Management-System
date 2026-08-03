export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber?: string;
  bedNumber?: string;
  pgName?: string;
  pgId?: string;
  rentAmount?: number;
  dueDate?: string;
  status: "ACTIVE" | "PENDING_KYC" | "INACTIVE" | "NOTICE_PERIOD";
  kycStatus?: "VERIFIED" | "PENDING" | "REJECTED";
  emergencyContact?: string;
  joiningDate?: string;
  avatarUrl?: string;
}

export interface ResidentKYC {
  aadharNumber?: string;
  panNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  documentUrls?: string[];
}
