import { Request } from 'express';
import { prisma } from '../../config/prisma';
import { createLoaders, GraphQLDataLoaders } from '../loaders';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

export interface GraphQLContext {
  prisma: typeof prisma;
  loaders: GraphQLDataLoaders;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const tokenService = new JwtTokenService();

export async function createContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization || '';
  let user: any = undefined;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      user = tokenService.verifyAccessToken(token);
    } catch {
      // Unauthenticated access permitted for public queries
    }
  }

  return {
    prisma,
    loaders: createLoaders(prisma),
    user
  };
}
