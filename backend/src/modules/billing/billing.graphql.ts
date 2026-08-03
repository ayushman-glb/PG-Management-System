import { Container } from '../../container';

export const billingGraphQLResolvers = {
  Query: {
    payments: async (_: any, { pgId, status }: { pgId?: string; status?: string }) => {
      const where: any = {};
      if (pgId) where.pgId = pgId;
      if (status) where.status = status;
      return Container.db.payment.findMany({ where, orderBy: { createdAt: 'desc' } });
    },
    fineRules: async (_: any, { pgId }: { pgId: string }) => {
      return Container.db.fineRule.findMany({ where: { pgId, isActive: true } });
    },
    residentFines: async (_: any, { residentId }: { residentId: string }) => {
      return Container.db.fine.findMany({ where: { residentId }, orderBy: { createdAt: 'desc' } });
    }
  },
  Mutation: {
    createFineRule: async (_: any, args: any) => {
      return Container.db.fineRule.create({ data: args });
    },
    issueFine: async (_: any, args: any) => {
      return Container.db.fine.create({ data: { ...args, dueDate: new Date(args.dueDate) } });
    },
    waiveFine: async (_: any, { fineId, ownerId }: { fineId: string; ownerId: string }) => {
      return Container.db.fine.update({
        where: { id: fineId },
        data: { status: 'WAIVED', waivedBy: ownerId, waivedAt: new Date() }
      });
    }
  }
};
