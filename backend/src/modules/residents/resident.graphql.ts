import { Container } from '../../container';

export const residentGraphQLResolvers = {
  Query: {
    residents: async (_: any, { pgId, status, search }: { pgId?: string; status?: string; search?: string }) => {
      return Container.residentService.getDirectory({ propertyId: pgId, status, search });
    },
    resident: async (_: any, { id }: { id: string }) => {
      return Container.db.resident.findUnique({ where: { id } });
    },
    residentStatusHistory: async (_: any, { residentId }: { residentId: string }) => {
      return Container.db.residentStatusHistory.findMany({ where: { residentId }, orderBy: { createdAt: 'desc' } });
    }
  },
  Mutation: {
    changeResidentStatus: async (_: any, { residentId, status, reason }: { residentId: string; status: string; reason?: string }) => {
      const updated = await Container.db.resident.update({
        where: { id: residentId },
        data: { status: status as any }
      });
      await Container.db.residentStatusHistory.create({
        data: {
          residentId,
          status: status as any,
          reason,
          updatedBy: 'GraphQL'
        }
      });
      return updated;
    }
  }
};
