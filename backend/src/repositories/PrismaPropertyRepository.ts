export class PrismaPropertyRepository {
  constructor(private db: any) {}

  async search(filters: { city?: string; page?: number; limit?: number } = {}) {
    const where: any = {};
    if (filters.city) {
      where.city = { contains: filters.city };
    }

    const [properties, total] = await Promise.all([
      this.db.pG.findMany({
        where,
        skip: ((filters.page || 1) - 1) * (filters.limit || 10),
        take: filters.limit || 10,
      }),
      this.db.pG.count({ where }),
    ]);

    return { properties, total };
  }

  async createRoomWithBeds(pgId: string, roomNumber: string, bedCount: number = 2) {
    const building = await this.db.building.findFirst({ where: { pgId } });
    const floor = await this.db.floor.findFirst({ where: { buildingId: building?.id } });
    const room = await this.db.room.create({
      data: {
        roomNumber,
        floorId: floor?.id,
      },
    });

    const bedOps = Array.from({ length: bedCount }, (_, i) =>
      this.db.bed.create({
        data: {
          bedNumber: `${roomNumber}-${String.fromCharCode(65 + i)}`,
          roomId: room.id,
          pgId,
        },
      })
    );

    await this.db.$transaction(bedOps);
    return room;
  }
}
