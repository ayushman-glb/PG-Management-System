export class ResidentManagementRepository {
  constructor(private db: any) {}

  async updateResidentStatus(data: { residentId: string; status: any; updatedBy: string; pgId?: string }) {
    const resident = await this.db.resident.findUnique({ where: { id: data.residentId } });
    if (!resident) throw new Error('Resident not found');
    if (data.pgId && resident.pgId !== data.pgId) {
      throw new Error('Unauthorized: Resident does not belong to specified PG tenant');
    }

    return await this.db.$transaction([
      this.db.resident.update({
        where: { id: data.residentId },
        data: { status: data.status },
      }),
      this.db.residentStatusHistory.create({
        data: {
          residentId: data.residentId,
          status: data.status,
          updatedBy: data.updatedBy,
        },
      }),
      this.db.activityLog.create({
        data: {
          action: 'UPDATE_RESIDENT_STATUS',
          details: { status: data.status, residentId: data.residentId },
          userId: data.updatedBy,
        },
      }),
    ]);
  }

  async convertRoomType(roomId: string, targetType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SHARING', updatedBy: string) {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      include: { beds: true, floor: { include: { building: { include: { pg: true } } } } },
    });
    if (!room) throw new Error('Room not found');

    const targetCounts: Record<string, number> = {
      SINGLE: 1,
      DOUBLE: 2,
      TRIPLE: 3,
      FOUR_SHARING: 4,
    };
    const targetCount = targetCounts[targetType] || 1;
    const currentBeds = room.beds || [];
    const currentCount = currentBeds.length;

    const ops: any[] = [];

    if (targetCount > currentCount) {
      // Add beds
      const diff = targetCount - currentCount;
      for (let i = 0; i < diff; i++) {
        const bedLetter = String.fromCharCode(65 + currentCount + i);
        ops.push(
          this.db.bed.create({
            data: {
              bedNumber: `${room.roomNumber}-${bedLetter}`,
              roomId: room.id,
              pgId: room.floor?.building?.pg?.id,
            },
          })
        );
      }
    } else if (targetCount < currentCount) {
      // Delete unoccupied beds
      const diff = currentCount - targetCount;
      const unoccupiedBeds = currentBeds.filter((b: any) => !b.isOccupied);
      if (unoccupiedBeds.length < diff) {
        throw new Error('Cannot reduce room capacity: occupied beds exceed target capacity');
      }
      const toDelete = unoccupiedBeds.slice(0, diff);
      for (const b of toDelete) {
        ops.push(this.db.bed.delete({ where: { id: b.id } }));
      }
    }

    if (ops.length > 0) {
      await this.db.$transaction(ops);
    }

    return await this.db.room.update({
      where: { id: roomId },
      data: { roomType: targetType },
    });
  }
}
