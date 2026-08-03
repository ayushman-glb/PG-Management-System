import { Container } from '../../container';

export const complaintGraphQLResolvers = {
  Query: {
    complaints: async (_: any, { pgId, status, priority }: { pgId?: string; status?: any; priority?: any }) => {
      return Container.complaintService.listComplaints({ propertyId: pgId, status, priority });
    }
  }
};
