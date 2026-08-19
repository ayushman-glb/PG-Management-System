import crypto from 'crypto';
import jwt, { SignOptions, JwtHeader } from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
  sessionId?: string;
  residentCode?: string;
  preAuth?: boolean;
}

export interface KeyPairEntry {
  kid: string;
  privateKey: string;
  publicKey: string;
  createdAt: Date;
  /**
   * Timestamp after which this key should no longer be published in the JWKS
   * endpoint (but is still retained in the Map for token verification until
   * all tokens it signed have naturally expired).
   * Undefined means "publish indefinitely" (applies to the active signing key).
   */
  retireAfter?: Date;
}

export class JwtKeyService {
  private static keyStore: Map<string, KeyPairEntry> = new Map();
  private static currentKid: string = 'rb_key_primary';
  private static initialized = false;

  /**
   * Initializes RSA keypair for RS256 signing and verification.
   */
  public static initKeys(): void {
    if (this.initialized && this.keyStore.size > 0) {
      return;
    }

    if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
      const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
      const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
      const kid = 'rb_key_env_1';
      this.keyStore.set(kid, { kid, privateKey, publicKey, createdAt: new Date() });
      this.currentKid = kid;
      this.initialized = true;
      return;
    }

    // Auto-generate ephemeral RSA 2048-bit keypair for development / test environments
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const kid = `rb_key_${Date.now()}`;
    this.keyStore.set(kid, { kid, privateKey, publicKey, createdAt: new Date() });
    this.currentKid = kid;
    this.initialized = true;
    logger.info('Ephemeral RS256 RSA keypair initialized with kid', { kid });
  }

  /**
   * Signs an Access Token using RS256 asymmetric algorithm (15 min lifespan) with kid header.
   */
  public static signAccessToken(payload: AccessTokenPayload, expiresIn: string = '15m'): string {
    this.initKeys();
    const activeKey = this.keyStore.get(this.currentKid);
    if (!activeKey) {
      throw new Error('No active signing key found in JwtKeyService');
    }

    const options: SignOptions = {
      algorithm: 'RS256',
      expiresIn: expiresIn as any,
      keyid: activeKey.kid,
    };

    return jwt.sign(payload, activeKey.privateKey, options);
  }

  /**
   * Verifies and decodes an Access Token using RS256 (resolving key by kid header, with HS256 graceful fallback).
   */
  public static verifyAccessToken<T = AccessTokenPayload>(token: string): T {
    this.initKeys();

    try {
      const decodedComplete = jwt.decode(token, { complete: true });
      const headerKid = decodedComplete?.header?.kid;

      let keyToUse: string | null = null;
      if (headerKid && this.keyStore.has(headerKid)) {
        keyToUse = this.keyStore.get(headerKid)!.publicKey;
      } else {
        // Fallback to active key or first available key in keyStore
        const activeKey = this.keyStore.get(this.currentKid);
        keyToUse = activeKey ? activeKey.publicKey : null;
      }

      if (keyToUse) {
        try {
          return jwt.verify(token, keyToUse, { algorithms: ['RS256'] }) as T;
        } catch (rsaErr: any) {
          // If multiple keys exist, attempt verification against older valid keys
          for (const [kid, entry] of this.keyStore.entries()) {
            if (entry.publicKey !== keyToUse) {
              try {
                return jwt.verify(token, entry.publicKey, { algorithms: ['RS256'] }) as T;
              } catch {
                // Continue checking remaining keys
              }
            }
          }
          throw rsaErr;
        }
      }
    } catch (err: any) {
      // Graceful fallback to HMAC verification if token was signed with secret (e.g. during test migration)
      if (env.JWT_SECRET && (err.name === 'JsonWebTokenError' || err.message?.includes('algorithm') || err.message?.includes('invalid signature'))) {
        try {
          return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as T;
        } catch {
          throw err;
        }
      }
      throw err;
    }

    throw new Error('Access token verification failed: No matching key found');
  }

  /**
   * Rotates signing keys with zero downtime.
   * - Generates a new RSA-2048 keypair and makes it the active signing key.
   * - Sets retireAfter on the PREVIOUS active key so it is still published
   *   in JWKS for (2 x access-token lifetime) to allow in-flight tokens to
   *   verify, then drops from the published set (but stays for verification).
   * - Previous key remains in keyStore forever for verifyAccessToken().
   */
  public static rotateKey(): string {
    // Retire the current key from JWKS publication after 2 × access token lifetime.
    // JWT_ACCESS_EXPIRATION is e.g. "15m" — parse minutes.
    const expiryStr = process.env.JWT_ACCESS_EXPIRATION || '15m';
    const match = expiryStr.match(/(\d+)([smhd])/);
    let expiryMs = 15 * 60 * 1000; // default 15 minutes
    if (match) {
      const val = parseInt(match[1], 10);
      switch (match[2]) {
        case 's': expiryMs = val * 1000; break;
        case 'm': expiryMs = val * 60 * 1000; break;
        case 'h': expiryMs = val * 60 * 60 * 1000; break;
        case 'd': expiryMs = val * 24 * 60 * 60 * 1000; break;
      }
    }
    const retentionMs = 2 * expiryMs;

    const previousKid = this.currentKid;
    const previousEntry = this.keyStore.get(previousKid);
    if (previousEntry && !previousEntry.retireAfter) {
      previousEntry.retireAfter = new Date(Date.now() + retentionMs);
      this.keyStore.set(previousKid, previousEntry);
      logger.info('Previous JWT signing key scheduled for JWKS retirement', {
        kid: previousKid,
        retireAfter: previousEntry.retireAfter.toISOString(),
        retentionMs,
      });
    }

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const newKid = `rb_key_${Date.now()}`;
    this.keyStore.set(newKid, { kid: newKid, privateKey, publicKey, createdAt: new Date() });
    this.currentKid = newKid;
    logger.info('Rotated JWT RS256 signing key successfully', { newKid, totalActiveKeys: this.keyStore.size });
    return newKid;
  }

  /**
   * Generates JWKS (JSON Web Key Set) payload for all publishable public keys.
   * - Always includes the current active signing key.
   * - Includes previous keys until their retireAfter timestamp has passed,
   *   so tokens signed under those keys still verify during the transition window.
   * - Keys past retireAfter are omitted from JWKS (but remain in keyStore for
   *   verifyAccessToken(), which tries all known keys on miss).
   */
  public static getJwks(): { keys: any[] } {
    this.initKeys();
    const now = Date.now();
    const keys: any[] = [];

    for (const [kid, entry] of this.keyStore.entries()) {
      // Include key if: it is the current active key, OR its retireAfter has not yet passed.
      const isActive = kid === this.currentKid;
      const isWithinRetentionWindow = !entry.retireAfter || entry.retireAfter.getTime() > now;
      if (!isActive && !isWithinRetentionWindow) {
        continue; // retired — omit from published JWKS
      }
      try {
        const keyObject = crypto.createPublicKey(entry.publicKey);
        const exportedJwk = keyObject.export({ format: 'jwk' });
        keys.push({
          ...exportedJwk,
          use: 'sig',
          alg: 'RS256',
          kid,
        });
      } catch (err: any) {
        logger.warn('Failed to export JWK for key', { kid, error: err.message });
      }
    }

    return { keys };
  }

  /**
   * Generates a 256-bit cryptographically secure opaque refresh token.
   */
  public static generateOpaqueRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashes a refresh token using SHA-256 for secure database storage.
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
