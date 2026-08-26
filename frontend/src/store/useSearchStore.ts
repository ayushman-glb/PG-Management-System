import { create } from 'zustand';

export interface LocationModel {
  id: string;
  formattedAddress: string;
  name: string;
  city?: string | null;
  locality?: string | null;
  suburb?: string | null;
  state?: string | null;
  country?: string | null;
  postcode?: string | null;
  latitude: number;
  longitude: number;
  resultType?: string | null;
}

export type GenderTypeFilter = 'ALL' | 'BOYS' | 'GIRLS' | 'CO_LIVING';
export type RoomTypeFilter = 'ALL' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SHARING';
export type SortByOption = 'recommended' | 'distance' | 'price_asc' | 'price_desc' | 'rating';

export interface SearchState {
  selectedLocation: LocationModel | null;
  searchQuery: string;
  radiusKm: number;
  genderType: GenderTypeFilter;
  roomType: RoomTypeFilter;
  priceRange: [number, number];
  isAc?: boolean;
  hasFood?: boolean;
  amenities: string[];
  sortBy: SortByOption;

  setSelectedLocation: (location: LocationModel | null) => void;
  setSearchQuery: (query: string) => void;
  setRadiusKm: (radius: number) => void;
  setGenderType: (gender: GenderTypeFilter) => void;
  setRoomType: (roomType: RoomTypeFilter) => void;
  setPriceRange: (range: [number, number]) => void;
  setIsAc: (isAc?: boolean) => void;
  setHasFood: (hasFood?: boolean) => void;
  toggleAmenity: (amenity: string) => void;
  setSortBy: (sortBy: SortByOption) => void;
  resetFilters: () => void;
}

const initialFilters = {
  selectedLocation: {
    id: 'default_blr',
    name: 'Bengaluru',
    formattedAddress: 'Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    locality: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    resultType: 'city',
  } as LocationModel,
  searchQuery: '',
  radiusKm: 15,
  genderType: 'ALL' as GenderTypeFilter,
  roomType: 'ALL' as RoomTypeFilter,
  priceRange: [4000, 30000] as [number, number],
  isAc: undefined as boolean | undefined,
  hasFood: undefined as boolean | undefined,
  amenities: [] as string[],
  sortBy: 'recommended' as SortByOption,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialFilters,

  setSelectedLocation: (selectedLocation) => set({ selectedLocation }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setGenderType: (genderType) => set({ genderType }),
  setRoomType: (roomType) => set({ roomType }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setIsAc: (isAc) => set({ isAc }),
  setHasFood: (hasFood) => set({ hasFood }),
  toggleAmenity: (amenity) =>
    set((state) => ({
      amenities: state.amenities.includes(amenity)
        ? state.amenities.filter((a) => a !== amenity)
        : [...state.amenities, amenity],
    })),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () =>
    set({
      genderType: 'ALL',
      roomType: 'ALL',
      priceRange: [4000, 30000],
      isAc: undefined,
      hasFood: undefined,
      amenities: [],
      radiusKm: 15,
      sortBy: 'recommended',
    }),
}));
