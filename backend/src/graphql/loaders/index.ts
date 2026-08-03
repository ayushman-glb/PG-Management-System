import { PrismaClient } from '@prisma/client';
import { createPropertyLoader } from './propertyLoader';
import { createResidentLoader } from './residentLoader';

export interface GraphQLDataLoaders {
  propertyLoader: ReturnType<typeof createPropertyLoader>;
  residentLoader: ReturnType<typeof createResidentLoader>;
}

export function createLoaders(prisma: PrismaClient): GraphQLDataLoaders {
  return {
    propertyLoader: createPropertyLoader(prisma),
    residentLoader: createResidentLoader(prisma)
  };
}
