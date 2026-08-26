export class CacheService {
  private store = new Map<string, { value: any; expiresAt: number }>();

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  async increment(key: string, by: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const nextVal = current + by;
    await this.set(key, nextVal, 3600);
    return nextVal;
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const nextVal = current - by;
    await this.set(key, nextVal, 3600);
    return nextVal;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regexPattern = '^' + pattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async remember<T = any>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const val = await producer();
    await this.set(key, val, ttlSeconds);
    return val;
  }

  async flush(): Promise<void> {
    this.store.clear();
  }
}

export const cacheService = new CacheService();
