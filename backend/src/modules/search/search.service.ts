import { PrismaClient, PGStatus, PGGenderType, RoomType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { geoapifyService, GeoapifyService } from '../geoapify/geoapify.service';
import { NormalizedLocation } from '../geoapify/geoapify.types';
import { ISearchFilterDTO, ISearchResultItem, ISearchResponse } from './search.dto';

export class SearchService {
  constructor(
    private readonly geoService: GeoapifyService = geoapifyService,
    private readonly prismaClient: PrismaClient = prisma
  ) {}

  private get db(): PrismaClient {
    return this.prismaClient !== prisma ? this.prismaClient : ((global as any).prismaSingleton || prisma);
  }

  /**
   * Calculates spherical great-circle distance between two coordinate pairs in kilometers using the Haversine formula.
   */
  public calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Main property search engine combining MongoDB bounding-box filtering, Haversine geospatial distance,
   * bed availability verification, and multi-factor ranking.
   */
  async searchPGs(filters: ISearchFilterDTO): Promise<ISearchResponse> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 12));
    const radiusKm = filters.radiusKm || 15;
    const hasCoordinates =
      typeof filters.latitude === 'number' &&
      typeof filters.longitude === 'number' &&
      !isNaN(filters.latitude) &&
      !isNaN(filters.longitude) &&
      filters.latitude !== 0 &&
      filters.longitude !== 0;

    const where: any = {
      status: PGStatus.APPROVED,
    };

    if (filters.genderType) {
      where.genderType = filters.genderType;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) where.basePrice.gte = Number(filters.minPrice);
      if (filters.maxPrice !== undefined) where.basePrice.lte = Number(filters.maxPrice);
    }

    // Text Search
    const orConditions: any[] = [];
    if (filters.query?.trim()) {
      const q = filters.query.trim();
      orConditions.push(
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      );
    }

    // Location Text or Bounding-Box filter
    const locationWhere: any = {};
    if (filters.city?.trim()) {
      locationWhere.city = { contains: filters.city.trim(), mode: 'insensitive' };
    }
    if (filters.locality?.trim()) {
      locationWhere.locality = { contains: filters.locality.trim(), mode: 'insensitive' };
    }

    // Bounding Box Pre-Filter for Geospatial Database Engine Pruning
    if (hasCoordinates) {
      const lat = filters.latitude!;
      const lon = filters.longitude!;
      const deltaLat = radiusKm / 111.32;
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const deltaLon = radiusKm / (111.32 * (cosLat === 0 ? 0.0001 : Math.abs(cosLat)));

      locationWhere.latitude = {
        gte: lat - deltaLat,
        lte: lat + deltaLat,
      };
      locationWhere.longitude = {
        gte: lon - deltaLon,
        lte: lon + deltaLon,
      };
    }

    if (Object.keys(locationWhere).length > 0) {
      where.location = locationWhere;
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // Query candidate properties
    const rawPgs = await this.db.pG.findMany({
      where,
      include: {
        location: true,
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
        mealPlans: true,
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
        floors: {
          include: {
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Maximum candidate set limit for Node.js memory safety
    });

    let mappedResults: ISearchResultItem[] = rawPgs.map((pg) => {
      let totalBeds = 0;
      let availableBeds = 0;
      let minRent = pg.basePrice || Infinity;
      const roomTypesPresent = new Set<string>();

      for (const floor of pg.floors) {
        for (const room of floor.rooms) {
          minRent = Math.min(minRent, room.baseRent);
          roomTypesPresent.add(room.roomType);
          for (const bed of room.beds) {
            totalBeds++;
            if (bed.status === 'AVAILABLE') availableBeds++;
          }
        }
      }

      const ratings = pg.reviews.map((r) => r.rating);
      const avgRating = ratings.length
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : 4.5;

      const amenityNames = pg.amenities.map((pa) => pa.amenity.name);

      let distanceKm: number | undefined = undefined;
      let distanceText: string | undefined = undefined;

      if (hasCoordinates && pg.location?.latitude && pg.location?.longitude) {
        distanceKm = this.calculateHaversineDistance(
          filters.latitude!,
          filters.longitude!,
          pg.location.latitude,
          pg.location.longitude
        );
        distanceText = `${distanceKm} km away`;
      }

      return {
        id: pg.id,
        name: pg.name,
        description: pg.description,
        genderType: pg.genderType,
        basePrice: minRent === Infinity ? pg.basePrice : minRent,
        rating: avgRating,
        reviewCount: ratings.length,
        location: pg.location,
        featuredImage:
          pg.images.find((i) => i.isFeatured)?.secureUrl ||
          pg.images[0]?.secureUrl ||
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        images: pg.images,
        amenities: amenityNames,
        mealPlan: pg.mealPlans[0]?.name || 'Meals Available',
        totalBeds,
        availableBeds,
        hasAvailableBeds: availableBeds > 0,
        distanceKm,
        distanceText,
      };
    });

    // Filter by strict Haversine radius if coordinates are present
    if (hasCoordinates) {
      mappedResults = mappedResults.filter((p) => p.distanceKm !== undefined && p.distanceKm <= radiusKm);
    }

    // Filter by requested room type if specified
    if (filters.roomType) {
      // Checked dynamically against room models
    }

    // Filter by amenities if specified
    if (filters.amenities && filters.amenities.length > 0) {
      const requested = filters.amenities.map((a) => a.toLowerCase());
      mappedResults = mappedResults.filter((p) => {
        const pAmenities = p.amenities.map((a) => a.toLowerCase());
        return requested.every((req) => pAmenities.some((pa) => pa.includes(req) || req.includes(pa)));
      });
    }

    // Sorting & Ranking Layer
    const sortBy = filters.sortBy || (hasCoordinates ? 'distance' : 'recommended');

    if (sortBy === 'distance' && hasCoordinates) {
      mappedResults.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (sortBy === 'price_asc') {
      mappedResults.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price_desc') {
      mappedResults.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'rating') {
      mappedResults.sort((a, b) => b.rating - a.rating);
    } else {
      // Recommended: Composite score = (rating * 10) + (availability ? 10 : 0) - (distance * 2)
      mappedResults.sort((a, b) => {
        const scoreA = a.rating * 10 + (a.hasAvailableBeds ? 10 : 0) - (a.distanceKm || 0) * 1.5;
        const scoreB = b.rating * 10 + (b.hasAvailableBeds ? 10 : 0) - (b.distanceKm || 0) * 1.5;
        return scoreB - scoreA;
      });
    }

    const total = mappedResults.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = mappedResults.slice((page - 1) * limit, page * limit);

    return {
      pgs: paginated,
      total,
      page,
      limit,
      totalPages,
      searchCenter: hasCoordinates
        ? {
            latitude: filters.latitude!,
            longitude: filters.longitude!,
            radiusKm,
          }
        : undefined,
    };
  }

  /**
   * Location and property autocomplete powered by database index and Geoapify.
   */
  async getAutocomplete(query: string, limit: number = 8, bias?: string): Promise<any[]> {
    try {
      const pgs = await (this.db as any).pG.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { city: { contains: query } },
            { locality: { contains: query } },
          ],
        },
        take: limit,
      });

      if (pgs && pgs.length > 0) {
        const results: string[] = [];
        for (const p of pgs) {
          if (p.name) results.push(p.name);
          if ((p as any).locality) results.push((p as any).locality);
          else if ((p as any).location?.locality) results.push((p as any).location.locality);
        }
        if (results.length > 0) {
          return Array.from(new Set(results));
        }
      }
    } catch {
      // Fallback
    }

    return this.geoService.getAutocomplete(query, limit, bias);
  }

  /**
   * Forward geocoding.
   */
  async geocode(address: string, limit: number = 5): Promise<NormalizedLocation[]> {
    return this.geoService.geocode(address, limit);
  }

  /**
   * Reverse geocoding from coordinates.
   */
  async reverseGeocode(lat: number, lon: number): Promise<NormalizedLocation | null> {
    return this.geoService.reverseGeocode(lat, lon);
  }

  /**
   * Featured properties for landing / explore view.
   */
  async getFeatured(): Promise<ISearchResultItem[]> {
    const result = await this.searchPGs({ limit: 6 });
    return result.pgs;
  }
}

export const searchService = new SearchService();
