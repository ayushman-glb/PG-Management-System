/**
 * Redis & Redlock Stub Interface
 * Provides clean fallback interfaces for caching, sessions, and Redlock distributed locks
 * so that the application runs 100% cleanly without requiring a live Redis server.
 */

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

export interface LockResult {
  lockAcquired: boolean;
  lockId?: string;
  release: () => Promise<void>;
}

class RedisStub implements CacheService {
  private memoryStore: Map<string, { value: any; expiresAt?: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Redlock Distributed Lock Stub
   * Simulates room/bed concurrency locking: bed:lock:{bedId}
   */
  async acquireLock(resource: string, ttlMs: number = 30000): Promise<LockResult> {
    const lockKey = `lock:${resource}`;
    const existing = await this.get<boolean>(lockKey);

    if (existing) {
      return {
        lockAcquired: false,
        release: async () => {}
      };
    }

    await this.set(lockKey, true, Math.ceil(ttlMs / 1000));
    return {
      lockAcquired: true,
      lockId: `stub-lock-${Date.now()}`,
      release: async () => {
        await this.del(lockKey);
      }
    };
  }
}

export const redisClient = new RedisStub();
