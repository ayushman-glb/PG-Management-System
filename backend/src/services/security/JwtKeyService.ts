import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class JwtKeyService {
  private static privateKey: string;
  private static publicKey: string;
  private static currentKid: string = 'key_v1';
  private static keysMap: Map<string, { privateKey: string; publicKey: string }> = new Map();

  public static initKeys() {
    if (!this.privateKey) {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.privateKey = privateKey;
      this.publicKey = publicKey;
      this.currentKid = 'key_' + crypto.randomBytes(4).toString('hex');
      this.keysMap.set(this.currentKid, { privateKey, publicKey });
    }
  }

  public static signAccessToken(payload: Record<string, any>, expiresIn: string = '15m'): string {
    this.initKeys();
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      keyid: this.currentKid,
      expiresIn: expiresIn as any,
    });
  }

  public static verifyAccessToken<T = any>(token: string): T {
    this.initKeys();
    return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] }) as T;
  }

  public static generateOpaqueRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static getCurrentKid(): string {
    this.initKeys();
    return this.currentKid;
  }

  public static getPublicKeyPem(): string {
    this.initKeys();
    return this.publicKey;
  }

  public static getKeysMap() {
    this.initKeys();
    return this.keysMap;
  }
}
