import { PrismaClient, PG, PGStatus, PGGenderType, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import { SubscriptionService } from '../subscriptions/subscription.service';

export interface ICreatePGDTO {
  ownerId: string;
  name: string;
  description: string;
  genderType: PGGenderType;
  rules?: string[];
  noticePeriodDays?: number;
  gateClosingTime?: string;
  basePrice?: number;
  depositMonths?: number;
  gstNumber?: string;
  contactPhone?: string;
  contactEmail?: string;
  location: {
    address: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
    placeId?: string;
  };
  amenityIds?: string[];
  images?: { publicId: string; secureUrl: string; caption?: string; isFeatured?: boolean }[];
}

export class PropertyService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  private subService = new SubscriptionService();

  async createPG(data: ICreatePGDTO): Promise<PG> {
    // 1. Verify owner SaaS subscription & PG limit
    await this.subService.verifyPGLimit(data.ownerId);

    if (!data.name || !data.description || !data.genderType || !data.location) {
      throw new BadRequestError('PG name, description, gender type, and location are required.');
    }

    const pg = await this.db.pG.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        description: data.description,
        genderType: data.genderType,
        rules: data.rules || [],
        noticePeriodDays: data.noticePeriodDays || 30,
        gateClosingTime: data.gateClosingTime,
        status: PGStatus.PENDING_ADMIN_VERIFICATION,
        basePrice: data.basePrice || 0,
        depositMonths: data.depositMonths || 1,
        gstNumber: data.gstNumber,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        location: {
          create: {
            address: data.location.address,
            locality: data.location.locality,
            city: data.location.city,
            state: data.location.state,
            pincode: data.location.pincode,
            country: data.location.country || 'India',
            latitude: data.location.latitude || 12.9716,
            longitude: data.location.longitude || 77.5946,
            googleMapsUrl: data.location.googleMapsUrl,
            placeId: data.location.placeId,
          },
        },
        images: data.images?.length
          ? {
              create: data.images.map((img, idx) => ({
                publicId: img.publicId,
                secureUrl: img.secureUrl,
                caption: img.caption,
                isFeatured: img.isFeatured || idx === 0,
                order: idx,
              })),
            }
          : undefined,
      },
      include: {
        location: true,
        images: true,
      },
    });

    // Link Amenities if provided
    if (data.amenityIds?.length) {
      for (const amenityId of data.amenityIds) {
        await this.db.pGAmenity.create({
          data: {
            pgId: pg.id,
            amenityId,
            isAvailable: true,
          },
        });
      }
    }

    return pg;
  }

  async getOwnerPGs(ownerId: string): Promise<any[]> {
    const pgs = await this.db.pG.findMany({
      where: { ownerId },
      include: {
        location: true,
        images: true,
        amenities: { include: { amenity: true } },
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
    });

    return pgs.map((pg) => {
      let totalRooms = 0;
      let totalBeds = 0;
      let occupiedBeds = 0;
      let availableBeds = 0;

      for (const floor of pg.floors) {
        totalRooms += floor.rooms.length;
        for (const room of floor.rooms) {
          totalBeds += room.beds.length;
          for (const bed of room.beds) {
            if (bed.status === 'OCCUPIED') occupiedBeds++;
            else if (bed.status === 'AVAILABLE') availableBeds++;
          }
        }
      }

      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      return {
        ...pg,
        stats: {
          totalFloors: pg.floors.length,
          totalRooms,
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancyRate,
        },
      };
    });
  }

  async getPublicProperties(limit: number = 10): Promise<any[]> {
    const pgs = await this.db.pG.findMany({
      where: {
        status: PGStatus.APPROVED,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
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
    });

    return pgs.map((pg) => {
      let totalBeds = 0;
      let availableBeds = 0;
      let minRent = pg.basePrice || 0;
      const roomTypesAvailable: Record<string, { available: number; total: number; minRent: number }> = {};

      for (const floor of pg.floors) {
        for (const room of floor.rooms) {
          if (!roomTypesAvailable[room.roomType]) {
            roomTypesAvailable[room.roomType] = { available: 0, total: 0, minRent: room.baseRent };
          } else {
            roomTypesAvailable[room.roomType].minRent = Math.min(roomTypesAvailable[room.roomType].minRent, room.baseRent);
          }
          if (minRent === 0 || room.baseRent < minRent) {
            minRent = room.baseRent;
          }

          for (const bed of room.beds) {
            totalBeds++;
            roomTypesAvailable[room.roomType].total++;
            if (bed.status === 'AVAILABLE') {
              availableBeds++;
              roomTypesAvailable[room.roomType].available++;
            }
          }
        }
      }

      return {
        ...pg,
        address: pg.location?.address,
        city: pg.location?.city,
        state: pg.location?.state,
        minRent,
        totalBeds,
        availableBedsCount: availableBeds,
        amenities: pg.amenities.map((a) => a.amenity?.name || a.amenityId).filter(Boolean),
        images: pg.images.map((img) => img.secureUrl),
        stats: {
          totalFloors: pg.floors.length,
          totalBeds,
          availableBeds,
        },
        availability: {
          totalBeds,
          availableBeds,
          roomTypes: roomTypesAvailable,
        },
      };
    });
  }

  async getPGDetails(pgId: string, userId?: string, userRole?: Role): Promise<any> {
    const pg = await this.db.pG.findUnique({
      where: { id: pgId },
      include: {
        location: true,
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
        mealPlans: true,
        reviews: {
          where: { isApproved: true },
          include: { resident: { select: { id: true, username: true, avatarUrl: true } } },
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
    });

    if (!pg) throw new NotFoundError('PG property not found.');

    // Only approved PGs are visible publicly, unless requested by Owner or Admin
    const isOwner = userId && pg.ownerId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (pg.status !== PGStatus.APPROVED && !isOwner && !isAdmin) {
      throw new ForbiddenError('This PG listing is currently undergoing verification.');
    }

    let totalBeds = 0;
    let availableBeds = 0;
    const roomTypesAvailable: Record<string, { available: number; total: number; minRent: number }> = {};

    for (const floor of pg.floors) {
      for (const room of floor.rooms) {
        if (!roomTypesAvailable[room.roomType]) {
          roomTypesAvailable[room.roomType] = { available: 0, total: 0, minRent: room.baseRent };
        } else {
          roomTypesAvailable[room.roomType].minRent = Math.min(roomTypesAvailable[room.roomType].minRent, room.baseRent);
        }

        for (const bed of room.beds) {
          totalBeds++;
          roomTypesAvailable[room.roomType].total++;
          if (bed.status === 'AVAILABLE') {
            availableBeds++;
            roomTypesAvailable[room.roomType].available++;
          }
        }
      }
    }

    return {
      ...pg,
      availability: {
        totalBeds,
        availableBeds,
        roomTypes: roomTypesAvailable,
      },
    };
  }

  async updatePGStatus(pgId: string, status: PGStatus, rejectionReason?: string, adminNotes?: string): Promise<PG> {
    const pg = await this.db.pG.findUnique({ where: { id: pgId } });
    if (!pg) throw new NotFoundError('PG property not found.');

    return await this.db.pG.update({
      where: { id: pgId },
      data: {
        status,
        rejectionReason,
        adminNotes,
      },
    });
  }

  async addFloor(pgId: string, ownerId: string, floorNumber: number, floorName: string, wifiSsid?: string, wifiPassword?: string): Promise<any> {
    const pg = await this.db.pG.findUnique({ where: { id: pgId } });
    if (!pg) throw new NotFoundError('PG property not found.');
    if (pg.ownerId !== ownerId) throw new ForbiddenError('You do not own this PG.');

    return await this.db.floor.create({
      data: {
        pgId,
        floorNumber,
        floorName,
        wifiSsid,
        wifiPassword,
      },
    });
  }
}
