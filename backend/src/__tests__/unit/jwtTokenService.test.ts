import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

describe('JwtTokenService Unit Tests', () => {
  const secret = 'super_secret_access_key_min_32_chars!';
  const refreshSecret = 'super_secret_refresh_key_min_32_chars!';
  let tokenService: JwtTokenService;

  beforeEach(() => {
    tokenService = new JwtTokenService(secret, refreshSecret);
  });

  describe('Access Tokens', () => {
    test('signs access token with correct payload claims', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        email: 'owner@roombae.com',
        role: 'OWNER',
        tokenVersion: 1,
      };

      const token = tokenService.generateAccessToken(payload as any);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = tokenService.verifyAccessToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.tokenVersion).toBe(payload.tokenVersion);
    });

    test('fails verification on invalid/tampered token', () => {
      const payload = { id: 'user1', email: 'u1@roombae.com', role: 'RESIDENT' };
      const token = tokenService.generateAccessToken(payload as any);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => tokenService.verifyAccessToken(tamperedToken)).toThrow();
    });
  });

  describe('Refresh Tokens', () => {
    test('signs refresh token using refresh secret', () => {
      const payload = { id: 'user1', email: 'u1@roombae.com', role: 'RESIDENT', tokenVersion: 2 };
      const refreshToken = tokenService.generateRefreshToken(payload as any);

      const decoded = tokenService.verifyRefreshToken(refreshToken);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.tokenVersion).toBe(payload.tokenVersion);

      // Access token verification secret should reject refresh token
      expect(() => tokenService.verifyAccessToken(refreshToken)).toThrow();
    });
  });

  describe('2FA Pre-Auth Tokens', () => {
    test('generates and verifies 5-minute 2FA pre-auth step-up token', () => {
      const preAuthPayload = { userId: '507f1f77bcf86cd799439011', role: 'ADMIN' };
      const preAuthToken = tokenService.generatePreAuthToken(preAuthPayload);

      const decoded = tokenService.verifyPreAuthToken(preAuthToken);
      expect(decoded.userId).toBe(preAuthPayload.userId);
      expect(decoded.role).toBe(preAuthPayload.role);
      expect(decoded.preAuth).toBe(true);
    });

    test('rejects standard access token as pre-auth token', () => {
      const standardPayload = { id: '507f1f77bcf86cd799439011', role: 'ADMIN' };
      const standardToken = tokenService.generateAccessToken(standardPayload as any);

      expect(() => tokenService.verifyPreAuthToken(standardToken)).toThrow('Invalid pre-auth token');
    });
  });
});
