import { ICryptoService } from '../../interfaces/infrastructure/ICryptoService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../../config/env';

export class BcryptCryptoService implements ICryptoService {
  private readonly encryptionKey: string;

  constructor(encryptionKey?: string) {
    const key = encryptionKey || env.KYC_ENCRYPTION_KEY || env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        'FATAL: KYC_ENCRYPTION_KEY environment variable is required but not set. ' +
        'Set a strong random 64-char hex key in your .env file.',
      );
    }
    this.encryptionKey = key;
  }

  // ── Key Derivation ────────────────────────────────────────────────────────
  /**
   * Derive a 32-byte AES key from the env key.
   * • If env key is a 64-char hex string → decode directly (preferred — no scrypt overhead).
   * • Otherwise → SHA-256 digest of the raw string (deterministic, no hardcoded scrypt salt).
   */
  private deriveKey(): Buffer {
    const hex = this.encryptionKey.replace(/\s/g, '');
    if (/^[0-9a-fA-F]{64}$/.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
    return crypto.createHash('sha256').update(this.encryptionKey, 'utf8').digest();
  }

  // ── Password Hashing ───────────────────────────────────────────────────────
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12); // cost=12 per spec
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ── AES-256-GCM Field Encryption ──────────────────────────────────────────
  /**
   * Encrypt text using AES-256-GCM with a random 16-byte IV.
   * Output format: "iv_hex:authTag_hex:ciphertext_hex"
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = this.deriveKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt a value produced by encrypt().
   * Throws on tampered ciphertext (GCM auth tag mismatch).
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format — expected iv:authTag:ciphertext');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const key = this.deriveKey();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Safe variant: returns the original value if it is NOT in encrypted format
   * (i.e., legacy plain-text records written before encryption was wired).
   * Returns null only on a genuine decryption failure of what looked encrypted.
   */
  decryptSafe(value: string): string | null {
    if (!value) return null;
    // Encrypted values have exactly 3 colon-separated hex segments
    const parts = value.split(':');
    if (parts.length !== 3 || parts.some((p) => !/^[0-9a-fA-F]+$/.test(p))) {
      // Plaintext legacy record — return as-is
      return value;
    }
    try {
      return this.decrypt(value);
    } catch {
      // Looks encrypted but failed — return raw (may be plaintext with colons)
      return value;
    }
  }
}
