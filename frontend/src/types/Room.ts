export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  type: "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR_SHARING";
  sharingType: string;
  totalBeds: number;
  occupiedBeds: number;
  monthlyRent: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
  amenities?: string[];
}
