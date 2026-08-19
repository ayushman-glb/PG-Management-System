import { tokenBlacklistService, parseDurationToSeconds } from '../../services/tokenBlacklistService';
import { cacheService } from '../../services/cache.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('TokenBlacklistService Unit Tests', () => {
  const testSecret = 'dev_test_secret_key_minimum_32_characters!';

  beforeEach(async () => {
    // Clear in-memory / cache keys before each test
    await cacheService.flush();
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

  describe('2. Dynamic Blacklist TTL Calculation', () => {
    it('should calculate blacklist TTL matching the remaining token lifetime (exp - now)', async () => {
      // Create a token expiring in 300 seconds (5 minutes)
      const payload = { id: 'user_123', email: 'test@roombae.com', role: 'RESIDENT' };
      const token = jwt.sign(payload, testSecret, { expiresIn: '300s' });

      const setSpy = jest.spyOn(cacheService, 'set');

      await tokenBlacklistService.blacklistToken(token);

      expect(setSpy).toHaveBeenCalled();
      const calledArgs = setSpy.mock.calls[0];
      const keyArg = calledArgs[0];
      const valArg = calledArgs[1];
      const ttlArg = calledArgs[2];

      const expectedHash = crypto.createHash('sha256').update(token).digest('hex');
      expect(keyArg).toBe(`jwt:blacklist:${expectedHash}`);
      expect(valArg).toBe('revoked');
      // TTL should be around 295-300 seconds (remaining lifetime)
      expect(ttlArg).toBeGreaterThan(290);
      expect(ttlArg).toBeLessThanOrEqual(300);

      setSpy.mockRestore();
    });

    it('should fallback to configured access token expiration if token has no exp claim', async () => {
      const unexpiredToken = jwt.sign({ id: 'user_no_exp' }, testSecret);
      const setSpy = jest.spyOn(cacheService, 'set');

      await tokenBlacklistService.blacklistToken(unexpiredToken);

      expect(setSpy).toHaveBeenCalled();
      const ttlArg = setSpy.mock.calls[0][2];
      expect(ttlArg).toBe(900); // default 15m fallback

      setSpy.mockRestore();
    });
  });

  describe('3. Token Blacklist Verification', () => {
    it('should correctly report blacklisted status using SHA-256 key', async () => {
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
