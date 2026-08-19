import { JwksService } from '../../services/security/JwksService';
import { JwtKeyService } from '../../services/security/JwtKeyService';

describe('JwksService & RS256 Key Rotation', () => {
  beforeAll(() => {
    JwtKeyService.initKeys();
  });

  test('should return standard JWKS structure with valid RSA keys', () => {
    const jwks = JwksService.getJwks();
    expect(jwks).toHaveProperty('keys');
    expect(Array.isArray(jwks.keys)).toBe(true);
    expect(jwks.keys.length).toBeGreaterThanOrEqual(1);

    const firstKey = jwks.keys[0];
    expect(firstKey.kty).toBe('RSA');
    expect(firstKey.use).toBe('sig');
    expect(firstKey.alg).toBe('RS256');
    expect(typeof firstKey.kid).toBe('string');
    expect(typeof firstKey.n).toBe('string');
    expect(typeof firstKey.e).toBe('string');
  });

  test('should rotate key and retain previous keys for backward verification', () => {
    const initialJwks = JwksService.getJwks();
    const initialCount = initialJwks.keys.length;

    const newKid = JwksService.rotateKey();
    expect(typeof newKid).toBe('string');

    const updatedJwks = JwksService.getJwks();
    expect(updatedJwks.keys.length).toBe(initialCount + 1);
    expect(updatedJwks.keys.some((k: any) => k.kid === newKid)).toBe(true);
  });
});
