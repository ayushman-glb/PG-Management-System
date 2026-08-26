import crypto from 'crypto';
import { JwtKeyService } from './JwtKeyService';

export class JwksService {
  private static jwksStore: any[] = [];

  private static pemToJwk(pem: string, kid: string): any {
    const keyObject = crypto.createPublicKey(pem);
    const jwk = keyObject.export({ format: 'jwk' });
    return {
      kty: 'RSA',
      use: 'sig',
      alg: 'RS256',
      kid,
      n: jwk.n,
      e: jwk.e,
    };
  }

  public static getJwks() {
    JwtKeyService.initKeys();
    const keysMap = JwtKeyService.getKeysMap();
    const keys: any[] = [];

    for (const [kid, { publicKey }] of keysMap.entries()) {
      keys.push(this.pemToJwk(publicKey, kid));
    }

    return { keys };
  }

  public static rotateKey(): string {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const newKid = 'key_' + crypto.randomBytes(4).toString('hex');
    JwtKeyService.getKeysMap().set(newKid, { privateKey, publicKey });
    return newKid;
  }
}
