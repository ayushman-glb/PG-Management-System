export class CascadeUpdateService {
  constructor(private db: any) {}

  async updateUserData(userId: string, data: any): Promise<{ ownerUpdated: boolean; residentUpdated: boolean }> {
    let ownerUpdated = false;
    let residentUpdated = false;

    await this.db.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data,
      });

      const owner = await tx.owner.findFirst({ where: { userId } });
      if (owner) {
        await tx.owner.update({
          where: { id: owner.id },
          data: {
            name: data.name,
            photo: data.avatarUrl,
          },
        });
        ownerUpdated = true;
      }

      const resident = await tx.resident.findFirst({ where: { userId } });
      if (resident) {
        await tx.resident.update({
          where: { id: resident.id },
          data: {
            name: data.name,
            profilePicture: data.avatarUrl,
          },
        });
        residentUpdated = true;
      }
    });

    return { ownerUpdated, residentUpdated };
  }
}
