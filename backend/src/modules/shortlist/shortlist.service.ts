import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../core/errors/CustomErrors';

export class ShortlistService {
  async getShortlist(userId: string) {
    const items = await prisma.shortlistItem.findMany({
      where: { userId },
      include: {
        pg: {
          include: {
            location: true,
            images: {
              take: 3,
              orderBy: { order: 'asc' },
            },
            amenities: {
              include: { amenity: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => {
      const pg = item.pg;
      return {
        id: pg.id,
        pgId: pg.id,
        shortlistId: item.id,
        name: pg.name,
        description: pg.description,
        genderType: pg.genderType,
        basePrice: pg.basePrice,
        rentStartingFrom: pg.basePrice,
        address: pg.location?.address || '',
        locality: pg.location?.locality || '',
        city: pg.location?.city || '',
        state: pg.location?.state || '',
        pincode: pg.location?.pincode || '',
        latitude: pg.location?.latitude,
        longitude: pg.location?.longitude,
        logo: pg.images?.[0]?.secureUrl || '',
        galleryImages: pg.images?.map((img) => img.secureUrl) || [],
        amenities: pg.amenities?.map((a) => a.amenity.name) || [],
        rules: pg.rules,
        status: pg.status,
        shortlistedAt: item.createdAt,
      };
    });
  }

  async toggleShortlist(userId: string, pgId: string) {
    if (!pgId) throw new BadRequestError('Property ID is required.');

    const pg = await prisma.pG.findUnique({ where: { id: pgId } });
    if (!pg) throw new NotFoundError('Property not found.');

    const existing = await prisma.shortlistItem.findUnique({
      where: {
        userId_pgId: { userId, pgId },
      },
    });

    if (existing) {
      await prisma.shortlistItem.delete({
        where: { id: existing.id },
      });
      return { isShortlisted: false, message: 'Property removed from shortlist.' };
    } else {
      const created = await prisma.shortlistItem.create({
        data: { userId, pgId },
      });
      return { isShortlisted: true, shortlistId: created.id, message: 'Property added to shortlist.' };
    }
  }

  async removeFromShortlist(userId: string, pgId: string) {
    if (!pgId) throw new BadRequestError('Property ID is required.');

    await prisma.shortlistItem.deleteMany({
      where: { userId, pgId },
    });
    return { success: true, message: 'Property removed from shortlist.' };
  }

  async syncShortlist(userId: string, pgIds: string[]) {
    if (!Array.isArray(pgIds) || pgIds.length === 0) {
      return { syncedCount: 0 };
    }

    let syncedCount = 0;
    for (const pgId of pgIds) {
      try {
        const pg = await prisma.pG.findUnique({ where: { id: pgId } });
        if (pg) {
          await prisma.shortlistItem.upsert({
            where: { userId_pgId: { userId, pgId } },
            create: { userId, pgId },
            update: {},
          });
          syncedCount++;
        }
      } catch (err) {
        // Continue on individual failure
      }
    }

    return { syncedCount };
  }
}
