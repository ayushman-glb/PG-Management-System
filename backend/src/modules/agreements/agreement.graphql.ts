import { Container } from '../../container';

export const agreementGraphQLResolvers = {
  Query: {
    agreements: async (_: any, { residentId, ownerId }: { residentId?: string; ownerId?: string }) => {
      const where: any = {};
      if (residentId) where.residentId = residentId;
      if (ownerId) where.ownerId = ownerId;
      return Container.db.agreement.findMany({ where, include: { signatures: true } });
    },
    agreement: async (_: any, { id }: { id: string }) => {
      return Container.agreementService.getAgreementById(id);
    }
  },
  Mutation: {
    signAgreement: async (_: any, { agreementId, input }: { agreementId: string; input: any }) => {
      const res = await Container.agreementService.signAgreement(agreementId, input);
      return res.agreement;
    }
  }
};
