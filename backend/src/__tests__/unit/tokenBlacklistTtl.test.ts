import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { redisClient, isRedisReady } from '../../config/redis';
import { RedisNamespace } from '../../services/security/RedisNamespace';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

jest.mock('../../config/redis', () => ({
  isRedisReady: jest.fn(),
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
}));

describe('Security Remediation Issue 1: Dynamic JWT Blacklist TTL', () => {
  const secret = 'test-secret-key-12345';
  let store: Map<string, { value: string; expireAt?: number }>;

  beforeEach(() => {
    store = new Map<string, { value: string; expireAt?: number }>();
    (isRedisReady as jest.Mock).mockReturnValue(true);

    (redisClient.set as jest.Mock).mockImplementation(async (key: string, value: string, opts?: { EX?: number }) => {
      const expireAt = opts?.EX ? Date.now() + opts.EX * 1000 : undefined;
      store.set(key, { value, expireAt });
      return 'OK';
    });

    (redisClient.get as jest.Mock).mockImplementation(async (key: string) => {
      const item = store.get(key);
      if (!item) return null;
      if (item.expireAt && Date.now() > item.expireAt) {
        store.delete(key);
        return null;
      }
      return item.value;
    });

    (redisClient.del as jest.Mock).mockImplementation(async (key: string) => {
      const existed = store.delete(key);
      return existed ? 1 : 0;
    });

    (redisClient.exists as jest.Mock).mockImplementation(async (key: string) => {
      const item = store.get(key);
      if (!item) return 0;
      if (item.expireAt && Date.now() > item.expireAt) {
        store.delete(key);
        return 0;
      }
      return 1;
    });
  });

  test('should blacklists a valid token with remaining TTL dynamically computed from exp', async () => {
    const remainingSeconds = 900; // 15 minutes
    const token = jwt.sign(
      { id: 'usr_123', email: 'test@example.com' },
      secret,
      { expiresIn: `${remainingSeconds}s` }
    );

    await tokenBlacklistService.blacklistToken(token);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expectedKey = RedisNamespace.jwtBlacklistKey(tokenHash);

    expect(redisClient.set).toHaveBeenCalledWith(
      expectedKey,
      JSON.stringify('revoked'),
      expect.objectContaining({
        EX: expect.any(Number),
      })
    );

    const callArgs = (redisClient.set as jest.Mock).mock.calls[0];
    const ttlPassed = callArgs[2].EX;
    expect(ttlPassed).toBeGreaterThanOrEqual(remainingSeconds - 2);
    expect(ttlPassed).toBeLessThanOrEqual(remainingSeconds);
  });

  test('should discard already-expired token without allocating Redis memory', async () => {
    // Generate an already expired token (exp in the past)
    const token = jwt.sign(
      { id: 'usr_expired', email: 'expired@example.com' },
      secret,
      { expiresIn: '-10s' }
    );

    await tokenBlacklistService.blacklistToken(token);
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  test('should accurately report blacklisted status using RedisNamespace key prefix', async () => {
    const token = jwt.sign({ id: 'usr_active' }, secret, { expiresIn: '120s' });
    await tokenBlacklistService.blacklistToken(token);

    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    expect(isBlacklisted).toBe(true);

    const nonBlacklistedToken = jwt.sign({ id: 'usr_other' }, secret, { expiresIn: '120s' });
    const isNonBlacklisted = await tokenBlacklistService.isTokenBlacklisted(nonBlacklistedToken);
    expect(isNonBlacklisted).toBe(false);
  });
});
