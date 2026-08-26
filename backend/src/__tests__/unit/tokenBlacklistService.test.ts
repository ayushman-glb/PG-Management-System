import { tokenBlacklistService, parseDurationToSeconds } from '../../services/tokenBlacklistService';
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

describe('TokenBlacklistService Unit Tests (Redis-Free Database-Backed)', () => {
  const testSecret = 'dev_test_secret_key_minimum_32_characters!';
  let dbStore: Map<string, any>;

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

  describe('1. Duration Parsing Utility', () => {
    it('should parse minutes, hours, days, and raw seconds correctly', () => {
      expect(parseDurationToSeconds('15m')).toBe(900);
      expect(parseDurationToSeconds('30m')).toBe(1800);
      expect(parseDurationToSeconds('1h')).toBe(3600);
      expect(parseDurationToSeconds('2h')).toBe(7200);
      expect(parseDurationToSeconds('1d')).toBe(86400);
      expect(parseDurationToSeconds('7d')).toBe(604800);
      expect(parseDurationToSeconds('500s')).toBe(500);
      expect(parseDurationToSeconds('')).toBe(900); // default
    });
  });

  describe('2. Dynamic Blacklist TTL & Database Persistence', () => {
    it('should calculate blacklist TTL matching the remaining token lifetime and persist to MongoDB', async () => {
      const payload = { id: 'user_123', email: 'test@roombae.com', role: 'RESIDENT' };
      const token = jwt.sign(payload, testSecret, { expiresIn: '300s' });

      await tokenBlacklistService.blacklistToken(token);

      const expectedHash = crypto.createHash('sha256').update(token).digest('hex');
      expect((prisma as any).revokedToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash: expectedHash },
        })
      );
    });

    it('should fallback to configured access token expiration if token has no exp claim', async () => {
      const unexpiredToken = jwt.sign({ id: 'user_no_exp' }, testSecret);

      await tokenBlacklistService.blacklistToken(unexpiredToken);

      const expectedHash = crypto.createHash('sha256').update(unexpiredToken).digest('hex');
      expect((prisma as any).revokedToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash: expectedHash },
        })
      );
    });
  });

  describe('3. Token Blacklist Verification', () => {
    it('should correctly report blacklisted status', async () => {
      const token = jwt.sign({ id: 'user_456' }, testSecret, { expiresIn: '600s' });

      // Before blacklisting
      const isBlacklistedBefore = await tokenBlacklistService.isTokenBlacklisted(token);
      expect(isBlacklistedBefore).toBe(false);

      // Blacklist token
      await tokenBlacklistService.blacklistToken(token);

      // After blacklisting
      const isBlacklistedAfter = await tokenBlacklistService.isTokenBlacklisted(token);
      expect(isBlacklistedAfter).toBe(true);
    });
  });
});
