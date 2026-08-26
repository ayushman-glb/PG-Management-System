import { api } from './api';
import { LocationModel } from '../store/useSearchStore';

export interface SearchPropertiesParams {
  query?: string;
  city?: string;
  locality?: string;
  genderType?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  isAc?: boolean;
  hasFood?: boolean;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export class SearchService {
  async autocomplete(query: string, signal?: AbortSignal, limit: number = 8): Promise<LocationModel[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    });

    try {
      const res = await api.get<{ data: LocationModel[] }>(
        `/search/locations/autocomplete?${params.toString()}`,
        { signal }
      );
      return res?.data || (Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw err;
      }
      return [];
    }
  }

  async geocode(address: string, signal?: AbortSignal, limit: number = 5): Promise<LocationModel[]> {
    if (!address || address.trim().length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      text: address.trim(),
      limit: limit.toString(),
    });

    try {
      const res = await api.get<{ data: LocationModel[] }>(
        `/search/locations/geocode?${params.toString()}`,
        { signal }
      );
      return res?.data || (Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw err;
      }
      return [];
    }
  }

  async reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<LocationModel | null> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
    });

    try {
      const res = await api.get<{ data: LocationModel }>(
        `/search/locations/reverse?${params.toString()}`,
        { signal }
      );
      return res?.data || null;
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw err;
      }
      return null;
    }
  }

  async searchProperties(params: SearchPropertiesParams, signal?: AbortSignal): Promise<{
    pgs: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    searchCenter?: { latitude: number; longitude: number; radiusKm: number };
  }> {
    const query = new URLSearchParams();

    if (params.query) query.append('query', params.query);
    if (params.city) query.append('city', params.city);
    if (params.locality) query.append('locality', params.locality);
    if (params.genderType && params.genderType !== 'ALL') query.append('genderType', params.genderType);
    if (params.roomType && params.roomType !== 'ALL') query.append('roomType', params.roomType);
    if (params.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
    if (params.isAc !== undefined) query.append('isAc', params.isAc.toString());
    if (params.hasFood !== undefined) query.append('hasFood', params.hasFood.toString());
    if (params.amenities && params.amenities.length > 0) query.append('amenities', params.amenities.join(','));
    if (params.latitude !== undefined) query.append('latitude', params.latitude.toString());
    if (params.longitude !== undefined) query.append('longitude', params.longitude.toString());
    if (params.radiusKm !== undefined) query.append('radiusKm', params.radiusKm.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/search${queryString}`, { signal });

    return {
      pgs: res?.data || [],
      total: res?.meta?.total || (res?.data ? res.data.length : 0),
      page: res?.meta?.page || params.page || 1,
      limit: res?.meta?.limit || params.limit || 12,
      totalPages: res?.meta?.totalPages || 1,
      searchCenter: res?.meta?.searchCenter,
    };
  }

  async globalSearch(query: string, signal?: AbortSignal): Promise<any> {
    return this.searchProperties({ query }, signal);
  }

  async getFeatured(signal?: AbortSignal): Promise<any[]> {
    const res = await api.get('/search/featured', { signal });
    return res?.data || [];
  }

  // Shortlist and Tour Support
  async getShortlist(): Promise<any[]> {
    const res = await api.get('/shortlist');
    return res?.data || res || [];
  }

  async toggleShortlist(propertyId: string): Promise<any> {
    return api.post(`/shortlist/${propertyId}`);
  }

  async removeFromShortlist(propertyId: string): Promise<any> {
    return api.post(`/shortlist/${propertyId}`);
  }

  async getMyTours(): Promise<any[]> {
    const res = await api.get('/tours');
    return res?.data || res || [];
  }

  async requestTour(data: { pgId?: string; propertyId?: string; requestedSlot: string; notes?: string }): Promise<any> {
    return api.post('/tours', {
      propertyId: data.propertyId || data.pgId,
      requestedSlot: data.requestedSlot,
      notes: data.notes,
    });
  }

  async updateTourStatus(id: string, statusOrData: string | { status: string; ownerNotes?: string }): Promise<any> {
    const payload = typeof statusOrData === 'string' ? { status: statusOrData } : statusOrData;
    return api.patch(`/tours/${id}`, payload);
  }
}

export const searchService = new SearchService();
