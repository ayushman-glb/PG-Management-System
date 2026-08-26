import { PGGenderType, RoomType } from '@prisma/client';
import { NormalizedLocation } from '../geoapify/geoapify.types';

export interface ISearchFilterDTO {
  query?: string;
  city?: string;
  locality?: string;
  genderType?: PGGenderType;
  roomType?: RoomType;
  minPrice?: number;
  maxPrice?: number;
  isAc?: boolean;
  hasFood?: boolean;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'recommended' | 'distance' | 'price_asc' | 'price_desc' | 'rating';
  page?: number;
  limit?: number;
}

export interface ISearchResultItem {
  id: string;
  name: string;
  description: string;
  genderType: PGGenderType;
  basePrice: number;
  rating: number;
  reviewCount: number;
  location: any;
  featuredImage: string;
  images: any[];
  amenities: string[];
  mealPlan: string;
  totalBeds: number;
  availableBeds: number;
  hasAvailableBeds: boolean;
  distanceKm?: number;
  distanceText?: string;
}

export interface ISearchResponse {
  pgs: ISearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchCenter?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}
