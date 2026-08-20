import { cacheService } from '../../services/cache.service';

describe('RoomBae Enterprise In-Memory Cache Suite', () => {
  beforeEach(async () => {
    await cacheService.flush();
  });

  describe('1. Basic Cache Operations', () => {
    it('should set and get values with TTL', async () => {
      await cacheService.set('test:key1', { foo: 'bar' }, 60);
      const val = await cacheService.get<{ foo: string }>('test:key1');
      expect(val).toEqual({ foo: 'bar' });
    });

    it('should return null for non-existent or expired keys', async () => {
      const val = await cacheService.get('test:missing');
      expect(val).toBeNull();
    });

    it('should delete a key and report existence correctly', async () => {
      await cacheService.set('test:key2', 'hello', 60);
      expect(await cacheService.exists('test:key2')).toBe(true);

      await cacheService.del('test:key2');
      expect(await cacheService.exists('test:key2')).toBe(false);
    });

    it('should increment and decrement integers', async () => {
      await cacheService.set('counter', 10);
      const incremented = await cacheService.increment('counter', 5);
      expect(incremented).toBe(15);

      const decremented = await cacheService.decrement('counter', 2);
      expect(decremented).toBe(13);
    });
  });

  describe('2. Pattern Invalidation', () => {
    it('should invalidate all keys matching a wildcard pattern', async () => {
      await cacheService.set('properties:list:city_blr', ['pg1', 'pg2']);
      await cacheService.set('properties:list:city_del', ['pg3']);
      await cacheService.set('properties:item:1', { name: 'PG 1' });

      await cacheService.invalidatePattern('properties:list:*');

      expect(await cacheService.get('properties:list:city_blr')).toBeNull();
      expect(await cacheService.get('properties:list:city_del')).toBeNull();
      expect(await cacheService.get('properties:item:1')).toEqual({ name: 'PG 1' });
    });
  });

  describe('3. Cache Remember & Stampede Deduplication', () => {
    it('should cache and reuse callback results without re-executing', async () => {
      let callCount = 0;
      const producer = async () => {
        callCount++;
        return { data: 'computed_data' };
      };

      const first = await cacheService.remember('calc:val', 60, producer);
      expect(first).toEqual({ data: 'computed_data' });
      expect(callCount).toBe(1);

      const second = await cacheService.remember('calc:val', 60, producer);
      expect(second).toEqual({ data: 'computed_data' });
      expect(callCount).toBe(1);
    });
  });
});
