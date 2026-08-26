import { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { geoapifyClient, GeoapifyClient } from './geoapify.client';
import { GeoapifyRawResponse, GeoapifyFeature, NormalizedLocation } from './geoapify.types';
import { logger } from '../../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class GeoapifyService {
  private cache = new Map<string, CacheEntry<NormalizedLocation[]>>();
  private readonly ttlMs = 60 * 60 * 1000; // 1 hour TTL
  private readonly maxCacheSize = 1000;

  constructor(
    private readonly client: GeoapifyClient = geoapifyClient,
    private readonly db: PrismaClient = prisma
  ) {}

  private getCached(key: string): NormalizedLocation[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: NormalizedLocation[]): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Evict oldest item
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  async getAutocomplete(query: string, limit: number = 8, bias?: string): Promise<NormalizedLocation[]> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const cacheKey = `ac:${cleanQuery}:${limit}:${bias || ''}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // 1. Try Geoapify API
    try {
      const raw = await this.client.autocomplete(cleanQuery, limit, bias);
      if (raw && raw.features && raw.features.length > 0) {
        const normalized = this.normalizeFeatures(raw.features);
        if (normalized.length > 0) {
          this.setCache(cacheKey, normalized);
          return normalized;
        }
      }
    } catch (err: any) {
      logger.warn(`[GeoapifyService] Geoapify autocomplete failed, using database fallback: ${err.message}`);
    }

    // 2. Fallback to MongoDB internal PGLocation records
    return this.fallbackDatabaseLocations(cleanQuery, limit);
  }

  async geocode(address: string, limit: number = 5): Promise<NormalizedLocation[]> {
    const cleanAddress = address.trim().toLowerCase();
    if (!cleanAddress) return [];

    const cacheKey = `gc:${cleanAddress}:${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.geocode(cleanAddress, limit);
      if (raw && raw.features && raw.features.length > 0) {
        const normalized = this.normalizeFeatures(raw.features);
        if (normalized.length > 0) {
          this.setCache(cacheKey, normalized);
          return normalized;
        }
      }
    } catch (err: any) {
      logger.warn(`[GeoapifyService] Geocode failed: ${err.message}`);
    }

    return this.fallbackDatabaseLocations(cleanAddress, limit);
  }

  async reverseGeocode(lat: number, lon: number): Promise<NormalizedLocation | null> {
    const cacheKey = `rev:${lat.toFixed(4)}:${lon.toFixed(4)}`;
    const cached = this.getCached(cacheKey);
    if (cached && cached.length > 0) return cached[0];

    try {
      const raw = await this.client.reverseGeocode(lat, lon);
      if (raw && raw.features && raw.features.length > 0) {
        const normalized = this.normalizeFeatures(raw.features);
        if (normalized.length > 0) {
          this.setCache(cacheKey, normalized);
          return normalized[0];
        }
      }
    } catch (err: any) {
      logger.warn(`[GeoapifyService] Reverse geocode failed: ${err.message}`);
    }

    return null;
  }

  private normalizeFeatures(features: GeoapifyFeature[]): NormalizedLocation[] {
    return features
      .map((f, idx) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [p.lon || 0, p.lat || 0];
        const longitude = Number(coords[0]);
        const latitude = Number(coords[1]);

        if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) {
          return null;
        }

        const name = p.name || p.suburb || p.city || p.formatted || 'Unknown Location';
        const formattedAddress = p.formatted || [name, p.city, p.state].filter(Boolean).join(', ');

        return {
          id: p.place_id || `geo_${latitude}_${longitude}_${idx}`,
          formattedAddress,
          name,
          city: p.city || p.county || null,
          locality: p.suburb || p.district || p.neighbourhood || null,
          suburb: p.suburb || null,
          district: p.district || p.county || null,
          state: p.state || null,
          country: p.country || 'India',
          postcode: p.postcode || null,
          latitude,
          longitude,
          resultType: p.result_type || p.category || null,
        } as NormalizedLocation;
      })
      .filter((item): item is NormalizedLocation => item !== null);
  }

  private async fallbackDatabaseLocations(query: string, limit: number): Promise<NormalizedLocation[]> {
    try {
      const pgs = await this.db.pGLocation.findMany({
        where: {
          OR: [
            { locality: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit * 2,
      });

      const uniqueResults = new Map<string, NormalizedLocation>();
      for (const loc of pgs) {
        const key = `${loc.locality || loc.city}-${loc.latitude}-${loc.longitude}`;
        if (!uniqueResults.has(key)) {
          uniqueResults.set(key, {
            id: loc.id,
            formattedAddress: [loc.locality, loc.city, loc.state].filter(Boolean).join(', '),
            name: loc.locality || loc.city,
            city: loc.city,
            locality: loc.locality,
            suburb: loc.locality,
            district: loc.city,
            state: loc.state,
            country: loc.country || 'India',
            postcode: loc.pincode,
            latitude: loc.latitude,
            longitude: loc.longitude,
            resultType: 'locality',
          });
        }
        if (uniqueResults.size >= limit) break;
      }

      return Array.from(uniqueResults.values());
    } catch {
      return [];
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const geoapifyService = new GeoapifyService();
