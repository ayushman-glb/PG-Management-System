import { PrismaClient, PG, RoomType, BedStatus, PGStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class PropertyRepository {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async findById(id: string): Promise<any | null> {
    return await this.db.pG.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, email: true, phone: true } },
        location: true,
        images: true,
        amenities: { include: { amenity: true } },
        floors: {
          include: {
            rooms: {
              include: { beds: true },
            },
          },
        },
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    return await this.db.pG.findMany({
      where: { ownerId },
      include: {
        location: true,
        images: true,
        floors: {
          include: {
            rooms: {
              include: { beds: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
