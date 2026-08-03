export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  minRent: number;
  maxRent?: number;
  sharingTypes: string[];
  amenities: string[];
  images: string[];
  rating?: number;
  ownerId?: string;
  status?: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}
