export interface ILockResult {
  lockAcquired: boolean;
  release: () => Promise<void>;
}

export interface IDistributedLockService {
  acquireLock(key: string, ttlMs?: number): Promise<ILockResult>;
}
