import { logger } from "../utils/logger";

interface MemoryCacheItem {
  value: any;
  expiresAt?: number;
}

/**
 * Enterprise In-Memory Cache Service (Redis-Free Architecture)
 * 
 * Provides fast $O(1)$ in-memory caching with automatic JSON serialization,
 * TypeScript generics, pattern invalidation, and thundering-herd/stampede-safe
 * Promise deduplication.
 */
export class CacheService {
  private static instance: CacheService;
  private memoryStore: Map<string, MemoryCacheItem> = new Map();
  private inFlightPromises: Map<string, Promise<any>> = new Map();

  private constructor() {
    // Periodic memory cleanup for expired items every 60 seconds
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanupMemoryStore(), 60000).unref();
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryStore.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Get cached item with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value as T;
  }

  /**
   * Set cached item with optional TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  /**
   * Cache remember pattern with Cache Stampede / Thundering Herd protection via Promise deduplication.
   */
  async remember<T>(key: string, ttlSeconds: number, callback: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // Deduplicate in-flight concurrent invocations for the same key
    let promise = this.inFlightPromises.get(key);
    if (!promise) {
      promise = (async () => {
        try {
          const freshValue = await callback();
          if (freshValue !== undefined && freshValue !== null) {
            await this.set(key, freshValue, ttlSeconds);
          }
          return freshValue;
        } finally {
          this.inFlightPromises.delete(key);
        }
      })();
      this.inFlightPromises.set(key, promise);
    }

    return promise;
  }

  /**
   * Delete specific cache key
   */
  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Check if cache key exists
   */
  async exists(key: string): Promise<boolean> {
    const item = this.memoryStore.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Set expiration TTL in seconds for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const item = this.memoryStore.get(key);
    if (!item) return false;
    item.expiresAt = Date.now() + ttlSeconds * 1000;
    return true;
  }

  /**
   * Get remaining TTL in seconds for a key (-1 if no expiry, -2 if key does not exist)
   */
  async ttl(key: string): Promise<number> {
    const item = this.memoryStore.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const diffSeconds = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return diffSeconds > 0 ? diffSeconds : -2;
  }

  /**
   * Increment integer value of a key
   */
  async increment(key: string, value: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const nextVal = current + value;
    await this.set(key, nextVal);
    return nextVal;
  }

  /**
   * Decrement integer value of a key
   */
  async decrement(key: string, value: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const nextVal = current - value;
    await this.set(key, nextVal);
    return nextVal;
  }

  /**
   * Invalidate all keys matching a glob pattern (e.g., "pg:list:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.memoryStore.keys()) {
      if (regexPattern.test(key)) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Flush all keys
   */
  async flush(): Promise<void> {
    this.memoryStore.clear();
  }
}

export const cacheService = CacheService.getInstance();
