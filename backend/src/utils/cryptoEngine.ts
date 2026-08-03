import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Key derived from ENV JWT_SECRET or ENCRYPTION_SECRET
function getDerivedKey(): Buffer {
  const secret = env.JWT_SECRET || 'roombae-production-enterprise-secret-key-32b';
  return createHmac('sha256', 'roombae-salt').update(secret).digest();
}

export class CryptoEngine {
  /**
   * Encrypt sensitive PII string (e.g. Aadhaar, PAN, Bank Account Number)
   */
  public static encrypt(text: string): string {
    if (!text) return text;
    const iv = randomBytes(IV_LENGTH);
    const key = getDerivedKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt sensitive PII string
   */
  public static decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.includes(':')) return cipherText;
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return cipherText;

      const [ivHex, tagHex, encryptedText] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');
      const key = getDerivedKey();

      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      return cipherText;
    }
  }

  /**
   * Generate HMAC SHA-256 signature for document integrity verification
   */
  public static signDocument(payload: string): string {
    const key = getDerivedKey();
    return createHmac('sha256', key).update(payload).digest('hex');
  }

  /**
   * Verify document signature
   */
  public static verifyDocumentSignature(payload: string, signature: string): boolean {
    const expected = this.signDocument(payload);
    return expected === signature;
  }
}
