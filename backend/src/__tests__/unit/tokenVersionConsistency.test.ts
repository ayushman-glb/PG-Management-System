import { TokenVersionService } from '../../services/security/TokenVersionService';
import { prisma } from '../../config/prisma';
import { redisClient, isRedisReady } from '../../config/redis';

jest.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../config/redis', () => ({
  isRedisReady: jest.fn(),
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe('Security Remediation Issue 3: Token Version Cache Consistency', () => {
  const userId = 'usr_version_test';
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    (isRedisReady as jest.Mock).mockReturnValue(true);

    (redisClient.get as jest.Mock).mockImplementation(async (key: string) => store.get(key) ?? null);
    (redisClient.set as jest.Mock).mockImplementation(async (key: string, val: any) => {
      store.set(key, String(val));
      return 'OK';
    });
    (redisClient.del as jest.Mock).mockImplementation(async (key: string) => {
      const existed = store.delete(key);
      return existed ? 1 : 0;
    });
  });

  test('should return true on matching token version from cache', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 2 });

    // Prime cache
    const initialVersion = await TokenVersionService.getTokenVersion(userId);
    expect(initialVersion).toBe(2);

    // Subsequent call should hit cache without calling MongoDB
    (prisma.user.findUnique as jest.Mock).mockClear();
    const isValid = await TokenVersionService.isValidTokenVersion(userId, 2);
    expect(isValid).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test('should return false when decoded token version does not match authoritative version', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 3 });

    const isValid = await TokenVersionService.isValidTokenVersion(userId, 1);
    expect(isValid).toBe(false);
  });

  test('should atomically increment token version in MongoDB and synchronize Redis cache', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 4 });

    const newVersion = await TokenVersionService.incrementTokenVersion(userId);
    expect(newVersion).toBe(4);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });
    expect(redisClient.set).toHaveBeenCalled();
  });

  test('should invalidate cache when explicitly requested', async () => {
    await TokenVersionService.invalidateCache(userId);
    expect(redisClient.del).toHaveBeenCalled();
  });

  test('should gracefully fall back to MongoDB if Redis is unavailable', async () => {
    (isRedisReady as jest.Mock).mockReturnValue(false);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 5 });

    const version = await TokenVersionService.getTokenVersion(userId);
    expect(version).toBe(5);
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });
});
