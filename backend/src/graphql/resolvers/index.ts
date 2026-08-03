import { queryResolvers } from './queryResolvers';
import { mutationResolvers } from './mutationResolvers';
import { authGraphQLResolvers } from '../../modules/auth';
import { ownerGraphQLResolvers } from '../../modules/owners';
import { propertyGraphQLResolvers } from '../../modules/properties';
import { roomGraphQLResolvers } from '../../modules/rooms';
import { bedGraphQLResolvers } from '../../modules/beds';
import { residentGraphQLResolvers } from '../../modules/residents';
import { billingGraphQLResolvers } from '../../modules/billing';
import { complaintGraphQLResolvers } from '../../modules/complaints';
import { agreementGraphQLResolvers } from '../../modules/agreements';
import { searchGraphQLResolvers } from '../../modules/search';
import { notificationGraphQLResolvers } from '../../modules/notifications';
import { settingsGraphQLResolvers } from '../../modules/settings';

export const resolvers = {
  Query: {
    ...queryResolvers,
    ...(authGraphQLResolvers as any).Query,
    ...(ownerGraphQLResolvers as any).Query,
    ...(propertyGraphQLResolvers as any).Query,
    ...(roomGraphQLResolvers as any).Query,
    ...(bedGraphQLResolvers as any).Query,
    ...(residentGraphQLResolvers as any).Query,
    ...(billingGraphQLResolvers as any).Query,
    ...(complaintGraphQLResolvers as any).Query,
    ...(agreementGraphQLResolvers as any).Query,
    ...(searchGraphQLResolvers as any).Query,
    ...(notificationGraphQLResolvers as any).Query,
    ...(settingsGraphQLResolvers as any).Query,
  },
  Mutation: {
    ...mutationResolvers,
    ...(authGraphQLResolvers as any).Mutation,
    ...(roomGraphQLResolvers as any).Mutation,
    ...(bedGraphQLResolvers as any).Mutation,
    ...(residentGraphQLResolvers as any).Mutation,
    ...(billingGraphQLResolvers as any).Mutation,
    ...(agreementGraphQLResolvers as any).Mutation,
  }
};
