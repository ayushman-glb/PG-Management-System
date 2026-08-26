import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { prisma } from '../../config/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

jest.mock('../../config/prisma', () => ({
  prisma: {
    revokedToken: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Security Remediation: Database-Backed JWT Blacklist with In-Memory Fast Cache', () => {
  const secret = 'test-secret-key-12345';
  let dbStore: Map<string, { tokenHash: string; expiresAt: Date; reason?: string }>;

  beforeEach(() => {
    jest.clearAllMocks();
    dbStore = new Map();

    ((prisma as any).revokedToken.upsert as jest.Mock).mockImplementation(async ({ where, create, update }: any) => {
      const record = {
        tokenHash: where.tokenHash,
        expiresAt: create?.expiresAt || update?.expiresAt,
        reason: create?.reason || update?.reason,
      };
      dbStore.set(where.tokenHash, record);
      return record;
    });

    ((prisma as any).revokedToken.findUnique as jest.Mock).mockImplementation(async ({ where }: any) => {
      return dbStore.get(where.tokenHash) || null;
    });
  });

  test('should blacklist a valid token with remaining TTL dynamically computed from exp', async () => {
    const remainingSeconds = 900; // 15 minutes
    const token = jwt.sign(
      { id: 'usr_123', email: 'test@example.com' },
      secret,
      { expiresIn: `${remainingSeconds}s` }
    );

    await tokenBlacklistService.blacklistToken(token);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    expect((prisma as any).revokedToken.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash },
      })
    );

    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    expect(isBlacklisted).toBe(true);
  });

  test('should discard already-expired token without writing to database', async () => {
    const token = jwt.sign(
      { id: 'usr_expired', email: 'expired@example.com' },
      secret,
      { expiresIn: '-10s' }
    );

    await tokenBlacklistService.blacklistToken(token);
    expect((prisma as any).revokedToken.upsert).not.toHaveBeenCalled();
  });

  test('should accurately report blacklisted and non-blacklisted tokens', async () => {
    const token = jwt.sign({ id: 'usr_active' }, secret, { expiresIn: '120s' });
    await tokenBlacklistService.blacklistToken(token);

    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    expect(isBlacklisted).toBe(true);

    const nonBlacklistedToken = jwt.sign({ id: 'usr_other' }, secret, { expiresIn: '120s' });
    const isNonBlacklisted = await tokenBlacklistService.isTokenBlacklisted(nonBlacklistedToken);
    expect(isNonBlacklisted).toBe(false);
  });
});
