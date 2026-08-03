export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: "VACANT" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "HOLD";
  residentId?: string;
  residentName?: string;
  monthlyRent: number;
}

export interface BedHold {
  id: string;
  bedId: string;
  reason: string;
  holdStartDate?: string;
  holdEndDate?: string;
  notes?: string;
  createdAt: string;
}
