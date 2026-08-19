import { PreAuthChallengeService } from '../../services/security/PreAuthChallengeService';
import { prisma } from '../../config/prisma';
import { redisClient, isRedisReady } from '../../config/redis';

jest.mock('../../config/prisma', () => ({
  prisma: {
    preAuthChallenge: {
      create: jest.fn(),
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

describe('Security Remediation Issue 8: PreAuth Challenge Token Fallback & Single Use', () => {
  const userId = 'usr_preauth_test';
  const visitorId = 'fp_stepup_123';
  let dbChallenges: Map<string, any>;
  let redisStore: Map<string, string>;
  let idCounter = 1;

  beforeEach(() => {
    dbChallenges = new Map<string, any>();
    redisStore = new Map<string, string>();
    idCounter = 1;

    (isRedisReady as jest.Mock).mockReturnValue(true);

    (prisma.preAuthChallenge.create as jest.Mock).mockImplementation(async ({ data }: any) => {
      const record = { id: `preauth_id_${idCounter++}`, ...data };
      dbChallenges.set(data.tokenHash, record);
      dbChallenges.set(record.id, record);
      return record;
    });

    (prisma.preAuthChallenge.findUnique as jest.Mock).mockImplementation(async ({ where }: any) => {
      if (where.tokenHash) return dbChallenges.get(where.tokenHash) || null;
      if (where.id) return dbChallenges.get(where.id) || null;
      return null;
    });

    (prisma.preAuthChallenge.update as jest.Mock).mockImplementation(async ({ where, data }: any) => {
      let item = null;
      if (where.tokenHash) item = dbChallenges.get(where.tokenHash);
      if (where.id) item = dbChallenges.get(where.id);
      if (item) {
        Object.assign(item, data);
      }
      return item;
    });

    (redisClient.get as jest.Mock).mockImplementation(async (key: string) => redisStore.get(key) || null);
    (redisClient.set as jest.Mock).mockImplementation(async (key: string, val: string) => {
      redisStore.set(key, val);
      return 'OK';
    });
    (redisClient.del as jest.Mock).mockImplementation(async (key: string) => {
      const existed = redisStore.delete(key);
      return existed ? 1 : 0;
    });
  });

  test('should create dual-storage challenge token in both Redis and MongoDB', async () => {
    const token = await PreAuthChallengeService.createChallenge(userId, visitorId);
    expect(token).toBeDefined();
    expect(token.startsWith('preauth_')).toBe(true);

    expect(prisma.preAuthChallenge.create).toHaveBeenCalled();
    expect(redisClient.set).toHaveBeenCalled();
  });

  test('should verify and atomically consume challenge on first use', async () => {
    const token = await PreAuthChallengeService.createChallenge(userId, visitorId);

    const result = await PreAuthChallengeService.verifyAndConsumeChallenge(token, visitorId);
    expect(result).toBeDefined();
    expect(result?.userId).toBe(userId);
  });

  test('should reject replay attacks when token is consumed more than once', async () => {
    const token = await PreAuthChallengeService.createChallenge(userId, visitorId);

    const firstUse = await PreAuthChallengeService.verifyAndConsumeChallenge(token, visitorId);
    expect(firstUse).toBeDefined();
    expect(firstUse.userId).toBe(userId);

    await expect(PreAuthChallengeService.verifyAndConsumeChallenge(token, visitorId)).rejects.toThrow();
  });

  test('should fall back to MongoDB when Redis is down or experiences node restart', async () => {
    const token = await PreAuthChallengeService.createChallenge(userId, visitorId);

    // Simulate Redis cache wipe / outage
    redisStore.clear();
    (isRedisReady as jest.Mock).mockReturnValue(false);

    // Verification must still succeed from MongoDB authoritative record
    const result = await PreAuthChallengeService.verifyAndConsumeChallenge(token, visitorId);
    expect(result).toBeDefined();
    expect(result?.userId).toBe(userId);
  });
});
