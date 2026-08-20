import { PreAuthChallengeService } from '../../services/security/PreAuthChallengeService';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    preAuthChallenge: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Security Remediation: PreAuth Challenge Token Authoritative Database Storage & Single Use', () => {
  const userId = 'usr_preauth_test';
  const visitorId = 'fp_stepup_123';
  let dbChallenges: Map<string, any>;
  let idCounter = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    dbChallenges = new Map<string, any>();
    idCounter = 1;

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
  });

  test('should create authoritative challenge token in MongoDB', async () => {
    const token = await PreAuthChallengeService.createChallenge(userId, visitorId);
    expect(token).toBeDefined();
    expect(token.startsWith('preauth_')).toBe(true);

    expect(prisma.preAuthChallenge.create).toHaveBeenCalled();
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
});
