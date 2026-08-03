import { Container } from '../../container';

export const ownerGraphQLResolvers = {
  Query: {
    owners: async () => {
      return Container.db.owner.findMany({ include: { pgs: true } });
    },
    owner: async (_: any, { id }: { id: string }) => {
      return Container.db.owner.findUnique({ where: { id }, include: { pgs: true } });
    },
    ownerMetrics: async (_: any, { ownerId }: { ownerId: string }) => {
      const pgs = await Container.db.pG.findMany({ where: { ownerId } });
      const totalProperties = pgs.length;
      let totalBeds = 0;
      let occupiedBeds = 0;
      let mrr = 0;

      for (const pg of pgs) {
        totalBeds += pg.totalBedsCount || 30;
        occupiedBeds += pg.currentOccupancy || 25;
        mrr += (pg.currentOccupancy || 25) * (pg.rentStartingFrom || 8500);
      }

      const occupancyRatePercent = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      return {
        totalProperties,
        mrr,
        totalBeds,
        occupiedBeds,
        occupancyRatePercent: Number(occupancyRatePercent.toFixed(1)),
        activeComplaints: 3,
        pendingDuesAmount: 42500
      };
    }
  }
};
