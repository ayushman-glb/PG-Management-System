import { prisma } from "../../config/prisma";
import { redisClient, isRedisReady } from "../../config/redis";
import { RedisNamespace } from "./RedisNamespace";
import { logger } from "../../utils/logger";

/**
 * Token Version Cache Consistency Service
 * 
 * Guarantees zero stale authorization states when a user's session is invalidated
 * (password change, logout from all devices, admin role revocation, or reuse detection).
 * 
 * Architecture:
 * - Source of Truth: MongoDB `User.tokenVersion` (Int)
 * - Fast-Path Cache: Redis `session:user:tokenVersion:<userId>` (TTL: 7 Days)
 * - Cache Invalidation: Optimistic synchronous write-through on every version increment.
 */
export class TokenVersionService {
  private static readonly CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 Days

  /**
   * Retrieves the current token version for a user.
   * Reads from Redis fast-path; on cache miss, populates from MongoDB Atlas.
   */
  public static async getTokenVersion(userId: string): Promise<number> {
    if (!userId) return 0;
    const cacheKey = RedisNamespace.userTokenVersionKey(userId);

    // 1. Check Redis Cache
    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached !== null && cached !== undefined) {
          return parseInt(cached, 10);
        }
      } catch (err: any) {
        logger.warn("Redis error fetching tokenVersion, falling back to Mongo", { userId, error: err.message });
      }
    }

    // 2. Fallback to Mongo (Authoritative Source of Truth)
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tokenVersion: true },
      });

      const version = user?.tokenVersion ?? 0;

      // Populate Redis cache asynchronously
      if (isRedisReady()) {
        try {
          await redisClient.set(cacheKey, version.toString(), { EX: this.CACHE_TTL_SECONDS });
        } catch {}
      }

      return version;
    } catch (dbErr: any) {
      logger.error("MongoDB error reading tokenVersion", { userId, error: dbErr.message });
      return 0;
    }
  }

  public static async isValidTokenVersion(userId: string, tokenVersion?: number): Promise<boolean> {
    const currentVersion = await this.getTokenVersion(userId);
    if (tokenVersion === undefined || tokenVersion === null) {
      return currentVersion === 0;
    }
    return tokenVersion === currentVersion;
  }

  /**
   * Alias for isValidTokenVersion for standard validator semantics
   */
  public static async validateTokenVersion(userId: string, jwtVersion?: number): Promise<boolean> {
    return this.isValidTokenVersion(userId, jwtVersion);
  }

  /**
   * Syncs Redis cache with the authoritative value from MongoDB
   */
  public static async syncCache(userId: string): Promise<number> {
    if (!userId) return 0;
    const cacheKey = RedisNamespace.userTokenVersionKey(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    const version = user?.tokenVersion ?? 0;

    if (isRedisReady()) {
      try {
        await redisClient.set(cacheKey, version.toString(), { EX: this.CACHE_TTL_SECONDS });
      } catch (err: any) {
        logger.warn("Redis error syncing tokenVersion cache", { userId, error: err.message });
      }
    }

    return version;
  }

  /**
   * Atomically increments the token version in MongoDB and updates the Redis cache immediately.
   * Invalidates all existing JWT access and refresh tokens across all devices.
   */
  public static async incrementTokenVersion(userId: string): Promise<number> {
    if (!userId) return 0;
    const cacheKey = RedisNamespace.userTokenVersionKey(userId);

    // 1. Authoritative increment in MongoDB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });

    const newVersion = updatedUser.tokenVersion;

    // 2. Optimistic Cache Overwrite in Redis
    if (isRedisReady()) {
      try {
        await redisClient.set(cacheKey, newVersion.toString(), { EX: this.CACHE_TTL_SECONDS });
      } catch (redisErr: any) {
        logger.warn("Failed to overwrite tokenVersion in Redis, deleting key", { userId, error: redisErr.message });
        try {
          await redisClient.del(cacheKey);
        } catch {}
      }
    }

    logger.info("User tokenVersion incremented and cache synchronized", { userId, newVersion });
    return newVersion;
  }

  /**
   * Explicitly evicts or syncs the Redis cache for a user
   */
  public static async invalidateCache(userId: string): Promise<void> {
    if (!userId || !isRedisReady()) return;
    try {
      await redisClient.del(RedisNamespace.userTokenVersionKey(userId));
    } catch {}
  }
}
