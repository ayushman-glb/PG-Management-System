import { PrismaClient, PG, RoomType } from '@prisma/client';
import { IPropertyRepository, ISearchPropertiesQuery, ICreatePropertyData } from '../../interfaces/repositories/IPropertyRepository';

export class PropertyRepository implements IPropertyRepository {
  constructor(private readonly db: PrismaClient) {}

  async search(query: ISearchPropertiesQuery): Promise<{ properties: any[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (query.city) {
      whereClause.city = { contains: query.city, mode: 'insensitive' };
    }

    try {
      const fetchPromise = Promise.all([
        this.db.pG.findMany({
          where: whereClause,
          include: {
            buildings: {
              include: {
                floors: {
                  include: {
                    rooms: {
                      include: { beds: true }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit
        }),
        this.db.pG.count({ where: whereClause })
      ]);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Prisma Query Timeout')), 1500)
      );

      const [properties, total] = await Promise.race([fetchPromise, timeoutPromise]);
      return { properties, total };
    } catch {
      return {
        properties: [],
        total: 0
      };
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      return await this.db.pG.findUnique({
        where: { id },
        include: {
          buildings: {
            include: {
              floors: {
                include: {
                  rooms: {
                    include: {
                      beds: {
                        include: { resident: true }
                      }
                    }
                  }
                }
              }
            }
          },
          complaints: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch {
      return null;
    }
  }

  async create(data: ICreatePropertyData): Promise<PG> {
    const slug = data.slug || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    return this.db.pG.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        slug,
        logo: data.logo || 'https://res.cloudinary.com/roombae/image/upload/v1700000000/default-logo.png',
        galleryImages: data.galleryImages || data.images || [],
        description: data.description || `Luxury PG in ${data.city}`,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        latitude: data.latitude ?? 12.9716,
        longitude: data.longitude ?? 77.5946,
        rentStartingFrom: data.rentStartingFrom || 8500,
        securityDeposit: data.securityDeposit || 15000,
        capacity: data.totalBeds ?? data.capacity ?? 0,
        availableBeds: data.availableBeds ?? data.totalBeds ?? data.capacity ?? 0,
        amenities: data.amenities || ['WiFi', 'Laundry', 'CCTV', 'Security']
      }
    });
  }

  async createRoomWithBeds(pgId: string, roomNumber: string, bedsCount: number): Promise<any> {
    let building = await this.db.building.findFirst({ where: { pgId } });
    if (!building) {
      building = await this.db.building.create({
        data: { pgId, name: 'Main Block', floorsCount: 3 }
      });
    }

    let floor = await this.db.floor.findFirst({ where: { buildingId: building.id } });
    if (!floor) {
      floor = await this.db.floor.create({
        data: { buildingId: building.id, floorNumber: 1 }
      });
    }

    const createdRoom = await this.db.room.create({
      data: {
        floorId: floor.id,
        roomNumber,
        roomType: RoomType.DOUBLE,
        acType: 'NON_AC',
        washroomType: 'ATTACHED',
        rentAmount: 8500
      }
    });

    for (let b = 1; b <= bedsCount; b++) {
      await this.db.bed.create({
        data: {
          roomId: createdRoom.id,
          bedNumber: `${roomNumber}-${String.fromCharCode(64 + b)}`,
          isOccupied: false
        }
      });
    }

    return createdRoom;
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    try {
      return await this.db.pG.findMany({
        where: { ownerId },
        include: {
          residents: true,
          buildings: {
            include: { floors: { include: { rooms: { include: { beds: true } } } } }
          },
          complaints: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
          payments: { where: { status: 'PENDING' } }
        }
      });
    } catch {
      return [];
    }
  }
}
