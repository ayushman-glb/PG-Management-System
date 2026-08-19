import { JwtKeyService } from '../../services/security/JwtKeyService';

describe('JwtKeyService RS256 Token & Opaque Refresh Engine', () => {
  test('signs and verifies RS256 access token with claims', () => {
    const payload = {
      id: 'usr_rs256_test_1',
      email: 'rs256_user@example.com',
      role: 'RESIDENT',
      tokenVersion: 2,
      sessionId: 'sess_12345',
    };

    const token = JwtKeyService.signAccessToken(payload, '15m');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = JwtKeyService.verifyAccessToken<any>(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.tokenVersion).toBe(payload.tokenVersion);
    expect(decoded.sessionId).toBe(payload.sessionId);
  });

  test('generates cryptographically secure 256-bit opaque refresh token', () => {
    const token1 = JwtKeyService.generateOpaqueRefreshToken();
    const token2 = JwtKeyService.generateOpaqueRefreshToken();

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes hex encoded = 64 chars
  });

  test('computes deterministic SHA-256 hash for database storage', () => {
    const rawToken = 'my_raw_opaque_refresh_token_test';
    const hash1 = JwtKeyService.hashToken(rawToken);
    const hash2 = JwtKeyService.hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});
