import { IDistributedLockService, ILockResult } from '../../interfaces/infrastructure/IDistributedLockService';
import { redisClient } from '../../config/redisStub';

export class RedisLockService implements IDistributedLockService {
  async acquireLock(key: string, ttlMs: number = 30000): Promise<ILockResult> {
    const lock = await redisClient.acquireLock(key, ttlMs);
    return {
      lockAcquired: lock.lockAcquired,
      release: async () => {
        await lock.release();
      }
    };
  }
}
