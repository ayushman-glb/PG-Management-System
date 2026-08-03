import { PrismaClient } from '@prisma/client';
import { SearchService } from './search.service';

const prisma = new PrismaClient();
const searchService = new SearchService(prisma);

export const searchGraphQLResolvers = {
  Query: {
    globalSearch: async (_: any, { query, pgId }: { query: string; pgId?: string }) => {
      return searchService.globalSearch(query, pgId);
    }
  }
};
