import { redisClient, isRedisReady } from "../config/redis";
import { logger } from "../utils/logger";

interface MemoryCacheItem {
  value: any;
  expiresAt?: number;
}

/**
 * Enterprise Production Cache Service
 * Wraps Redis with automatic JSON serialization, TypeScript generics,
 * pattern invalidation, remember cache pattern, and a resilient in-memory fallback.
 */
export class CacheService {
  private static instance: CacheService;
  private inMemoryFallback: Map<string, MemoryCacheItem> = new Map();

  private constructor() {
    // Periodic memory cleanup for expired items in fallback mode
    setInterval(() => this.cleanupMemoryStore(), 60000).unref();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, item] of this.inMemoryFallback.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.inMemoryFallback.delete(key);
      }
    }
  }

  /**
   * Get cached item with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    if (isRedisReady()) {
      try {
        const raw = await redisClient.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch (err: any) {
        logger.warn("Redis GET failed, attempting memory fallback", { key, error: err.message });
      }
    }

    // In-memory fallback
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.value as T;
  }

  /**
   * Set cached item with optional TTL in seconds and automatic JSON stringification
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (isRedisReady()) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await redisClient.set(key, serialized, { EX: ttlSeconds });
        } else {
          await redisClient.set(key, serialized);
        }
        return;
      } catch (err: any) {
        logger.warn("Redis SET failed, using memory fallback", { key, error: err.message });
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryFallback.set(key, { value, expiresAt });
  }

  /**
   * Cache remember pattern: Return cached value if present, else call callback, cache result, and return.
   */
  async remember<T>(key: string, ttlSeconds: number, callback: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshValue = await callback();
    if (freshValue !== undefined && freshValue !== null) {
      await this.set(key, freshValue, ttlSeconds);
    }
    return freshValue;
  }

  /**
   * Delete specific cache key
   */
  async del(key: string): Promise<void> {
    if (isRedisReady()) {
      try {
        await redisClient.del(key);
      } catch (err: any) {
        logger.warn("Redis DEL failed", { key, error: err.message });
      }
    }
    this.inMemoryFallback.delete(key);
  }

  /**
   * Check if cache key exists
   */
  async exists(key: string): Promise<boolean> {
    if (isRedisReady()) {
      try {
        const count = await redisClient.exists(key);
        return count > 0;
      } catch (err: any) {
        logger.warn("Redis EXISTS failed", { key, error: err.message });
      }
    }

    const item = this.inMemoryFallback.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Set expiration TTL in seconds for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (isRedisReady()) {
      try {
        const res = await redisClient.expire(key, ttlSeconds);
        return Boolean(res);
      } catch (err: any) {
        logger.warn("Redis EXPIRE failed", { key, error: err.message });
      }
    }

    const item = this.inMemoryFallback.get(key);
    if (!item) return false;
    item.expiresAt = Date.now() + ttlSeconds * 1000;
    return true;
  }

  /**
   * Get remaining TTL in seconds for a key (-1 if no expiry, -2 if key does not exist)
   */
  async ttl(key: string): Promise<number> {
    if (isRedisReady()) {
      try {
        return await redisClient.ttl(key);
      } catch (err: any) {
        logger.warn("Redis TTL failed", { key, error: err.message });
      }
    }

    const item = this.inMemoryFallback.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const diffSeconds = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return diffSeconds > 0 ? diffSeconds : -2;
  }

  /**
   * Increment integer value of a key
   */
  async increment(key: string, value: number = 1): Promise<number> {
    if (isRedisReady()) {
      try {
        if (value === 1) {
          return await redisClient.incr(key);
        }
        return await redisClient.incrBy(key, value);
      } catch (err: any) {
        logger.warn("Redis INCR failed", { key, error: err.message });
      }
    }

    const current = (await this.get<number>(key)) || 0;
    const nextVal = current + value;
    await this.set(key, nextVal);
    return nextVal;
  }

  /**
   * Decrement integer value of a key
   */
  async decrement(key: string, value: number = 1): Promise<number> {
    if (isRedisReady()) {
      try {
        if (value === 1) {
          return await redisClient.decr(key);
        }
        return await redisClient.decrBy(key, value);
      } catch (err: any) {
        logger.warn("Redis DECR failed", { key, error: err.message });
      }
    }

    const current = (await this.get<number>(key)) || 0;
    const nextVal = current - value;
    await this.set(key, nextVal);
    return nextVal;
  }

  /**
   * Invalidate all keys matching a glob pattern (e.g., "pg:list:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (isRedisReady()) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (err: any) {
        logger.warn("Redis pattern invalidation failed", { pattern, error: err.message });
      }
    }

    // In-memory fallback pattern match (convert glob pattern to regex)
    const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.inMemoryFallback.keys()) {
      if (regexPattern.test(key)) {
        this.inMemoryFallback.delete(key);
      }
    }
  }

  /**
   * Flush all keys (Caution)
   */
  async flush(): Promise<void> {
    if (isRedisReady()) {
      try {
        await redisClient.flushDb();
      } catch (err: any) {
        logger.warn("Redis FLUSHDB failed", { error: err.message });
      }
    }
    this.inMemoryFallback.clear();
  }
}

export const cacheService = CacheService.getInstance();
