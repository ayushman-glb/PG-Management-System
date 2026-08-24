import { PrismaClient, PGStatus, PGGenderType, RoomType } from '@prisma/client';
import { prisma } from '../../config/prisma';

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
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export class SearchService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async searchPGs(filters: ISearchFilterDTO): Promise<{ pgs: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 12));
    const skip = (page - 1) * limit;

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

    // Text & location search
    const orConditions: any[] = [];
    if (filters.query?.trim()) {
      const q = filters.query.trim();
      orConditions.push(
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      );
    }

    if (filters.city?.trim()) {
      where.location = { ...where.location, city: { contains: filters.city.trim(), mode: 'insensitive' } };
    }
    if (filters.locality?.trim()) {
      where.location = { ...where.location, locality: { contains: filters.locality.trim(), mode: 'insensitive' } };
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const [total, rawPgs] = await Promise.all([
      this.db.pG.count({ where }),
      this.db.pG.findMany({
        where,
        skip,
        take: limit,
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
      }),
    ]);

    const pgs = rawPgs.map((pg) => {
      let totalBeds = 0;
      let availableBeds = 0;
      let minRent = pg.basePrice || Infinity;

      for (const floor of pg.floors) {
        for (const room of floor.rooms) {
          minRent = Math.min(minRent, room.baseRent);
          for (const bed of room.beds) {
            totalBeds++;
            if (bed.status === 'AVAILABLE') availableBeds++;
          }
        }
      }

      const ratings = pg.reviews.map((r) => r.rating);
      const avgRating = ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 4.5;

      return {
        id: pg.id,
        name: pg.name,
        description: pg.description,
        genderType: pg.genderType,
        basePrice: minRent === Infinity ? pg.basePrice : minRent,
        rating: avgRating,
        reviewCount: ratings.length,
        location: pg.location,
        featuredImage: pg.images.find((i) => i.isFeatured)?.secureUrl || pg.images[0]?.secureUrl || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        images: pg.images,
        amenities: pg.amenities.map((pa) => pa.amenity.name),
        mealPlan: pg.mealPlans[0]?.name || 'Meals Available',
        totalBeds,
        availableBeds,
        hasAvailableBeds: availableBeds > 0,
      };
    });

    return {
      pgs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
