import { env } from '../../config/env';
import { cacheService } from '../../services/cache.service';
import { redisClient, isRedisReady, pingRedis } from '../../config/redis';

describe('RoomBae Redis Development Configuration & Pipeline Suite', () => {
  describe('1. Environment & Credentials Validation', () => {
    it('should correctly parse Redis development environment variables', () => {
      expect(env.REDIS_HOST).toBeDefined();
      expect(env.REDIS_PORT).toBeDefined();
      expect(env.REDIS_URL).toBeDefined();
      expect(env.REDIS_DB).toBeDefined();
      expect(env.CACHE_TTL).toBeDefined();
      expect(env.SESSION_TTL).toBeDefined();
      expect(env.REDIS_TLS).toBe('false');
    });

    it('should have a properly structured Redis development password when configured', () => {
      if (env.REDIS_PASSWORD) {
        expect(env.REDIS_PASSWORD.length).toBeGreaterThan(8);
      }
    });

    it('should properly format the Redis connection URL with credentials', () => {
      expect(env.REDIS_URL.startsWith('redis://') || env.REDIS_URL.startsWith('rediss://')).toBe(true);
    });
  });

  describe('2. Redis Client Lifecycle & Ready Checks', () => {
    it('should export singleton redisClient instance', () => {
      expect(redisClient).toBeDefined();
      expect(typeof redisClient.connect).toBe('function');
      expect(typeof redisClient.ping).toBe('function');
    });

    it('should safely report Redis readiness state without crashing', () => {
      const ready = isRedisReady();
      expect(typeof ready).toBe('boolean');
    });

    it('should return valid latency or -1 if Redis is offline', async () => {
      const latency = await pingRedis();
      expect(typeof latency).toBe('number');
    });
  });

  describe('3. CacheService Memory Fallback Operational Integrity', () => {
    it('should set and get values with active in-memory fallback when Redis is offline', async () => {
      const testKey = 'test:dev:cache:1';
      const testVal = { id: 101, name: 'PG Test Suite', timestamp: Date.now() };

      await cacheService.set(testKey, testVal, 30);
      const retrieved = await cacheService.get<typeof testVal>(testKey);

      expect(retrieved).toEqual(testVal);

      await cacheService.del(testKey);
      const deleted = await cacheService.get(testKey);
      expect(deleted).toBeNull();
    });

    it('should support atomic increment and decrement operations', async () => {
      const counterKey = 'test:dev:counter:1';
      await cacheService.del(counterKey);

      const val1 = await cacheService.increment(counterKey);
      expect(val1).toBe(1);

      const val2 = await cacheService.increment(counterKey, 5);
      expect(val2).toBe(6);

      const val3 = await cacheService.decrement(counterKey, 2);
      expect(val3).toBe(4);

      await cacheService.del(counterKey);
    });

    it('should support existence checks and TTL checks', async () => {
      const key = 'test:dev:ttl_check';
      await cacheService.set(key, 'active', 60);

      const exists = await cacheService.exists(key);
      expect(exists).toBe(true);

      const ttl = await cacheService.ttl(key);
      expect(ttl).toBeGreaterThan(0);

      await cacheService.del(key);
    });
  });
});
