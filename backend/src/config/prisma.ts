import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prismaSingleton: PrismaClient | undefined;
}

export const prisma = global.prismaSingleton || new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (env.NODE_ENV !== 'production') {
  global.prismaSingleton = prisma;
}

/**
 * Attempts to connect Prisma to the database with a configurable timeout (default 5000ms).
 */
export async function connectPrismaWithTimeout(timeoutMs = 5000): Promise<void> {
  const connectPromise = prisma.$connect();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`MongoDB connection timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  await Promise.race([connectPromise, timeoutPromise]);
}

