import { IDistributedLockService, ILockResult } from '../../interfaces/infrastructure/IDistributedLockService';

/**
 * In-Memory & Process-Safe Lock Service (Redis-Free Architecture)
 * 
 * Provides mutex acquisition with automatic TTL expiration to protect
 * critical financial operations and bed assignments against race conditions.
 */
export class DatabaseLockService implements IDistributedLockService {
  private static locks: Map<string, { expiresAt: number; lockId: string }> = new Map();

  async acquireLock(key: string, ttlMs: number = 30000): Promise<ILockResult> {
    const now = Date.now();
    const existing = DatabaseLockService.locks.get(key);

    if (existing && now < existing.expiresAt) {
      return {
        lockAcquired: false,
        release: async () => {},
      };
    }

    const lockId = Math.random().toString(36).substring(2);
    DatabaseLockService.locks.set(key, {
      expiresAt: now + ttlMs,
      lockId,
    });

    return {
      lockAcquired: true,
      release: async () => {
        const current = DatabaseLockService.locks.get(key);
        if (current && current.lockId === lockId) {
          DatabaseLockService.locks.delete(key);
        }
      },
    };
  }
}

export class RedisLockService extends DatabaseLockService {}
