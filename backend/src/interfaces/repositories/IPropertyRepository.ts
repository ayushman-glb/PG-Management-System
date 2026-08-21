import { PG, RoomType, PGStatus } from '@prisma/client';

export interface ISearchPropertiesQuery {
  city?: string;
  lat?: number;
  lng?: number;
  maxDistanceKm?: number;
  minRent?: number;
  maxRent?: number;
  roomType?: RoomType;
  page?: number;
  limit?: number;
}

export interface ICreatePropertyData {
  ownerId: string;
  name: string;
  slug?: string;
  logo?: string;
  galleryImages?: string[];
  description?: string;
  address: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  rentStartingFrom?: number;
  securityDeposit?: number;
  gstin?: string;
  totalRooms?: number;
  totalBeds?: number;
  capacity?: number;
  availableBeds?: number;
  amenities?: string[];
  images?: string[];
  status?: PGStatus;
}

export interface IPropertyRepository {
  search(query: ISearchPropertiesQuery): Promise<{ properties: any[]; total: number }>;
  findById(id: string): Promise<any | null>;
  create(data: ICreatePropertyData): Promise<PG>;
  createRoomWithBeds(propertyId: string, roomNumber: string, bedsCount: number): Promise<any>;
  findByOwnerId(ownerId: string): Promise<any[]>;
}
