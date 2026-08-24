import { api } from "./api";

export interface SearchFilters {
  query?: string;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
  roomType?: string;
  amenities?: string[];
  isAc?: boolean;
  hasAttachedBathroom?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SearchService {
  async search(filters: SearchFilters = {}) {
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.city) params.set("city", filters.city);
    if (filters.area) params.set("area", filters.area);
    if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.gender && filters.gender !== "all") params.set("gender", filters.gender);
    if (filters.roomType && filters.roomType !== "all") params.set("roomType", filters.roomType);
    if (filters.amenities && filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","));
    if (filters.isAc !== undefined) params.set("isAc", String(filters.isAc));
    if (filters.hasAttachedBathroom !== undefined) params.set("hasAttachedBathroom", String(filters.hasAttachedBathroom));
    if (filters.lat !== undefined) params.set("lat", String(filters.lat));
    if (filters.lng !== undefined) params.set("lng", String(filters.lng));
    if (filters.radius !== undefined) params.set("radius", String(filters.radius));
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/search${queryString}`);
  }

  async globalSearch(query: string) {
    return this.search({ query });
  }

  async getAutocomplete(query: string) {
    return api.get(`/search/autocomplete?q=${encodeURIComponent(query)}`);
  }

  async getFeatured() {
    return api.get(`/search/featured`);
  }
}

export const searchService = new SearchService();
export default searchService;
