import { Container } from '../../container';

export const propertyGraphQLResolvers = {
  Query: {
    pgs: async (_: any, { city, status }: { city?: string; status?: string }) => {
      const result = await Container.propertyService.searchPublicProperties({ city, limit: 50 });
      return result.properties;
    },
    pg: async (_: any, { id }: { id: string }) => {
      return Container.propertyService.getPropertyById(id);
    },
  },
};
