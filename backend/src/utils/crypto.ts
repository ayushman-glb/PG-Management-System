import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  let keyStr = env.ENCRYPTION_KEY || env.AES_256_KEY;
  if (!keyStr) {
    keyStr = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  }
  // Ensure exactly 32 bytes (256 bits)
  return crypto.createHash('sha256').update(keyStr).digest();
}

export function encryptSensitiveData(plainText: string): string {
  if (!plainText) return plainText;
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encryptedHex
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error: any) {
    console.error('❌ Encryption Error:', error.message);
    throw new Error('Failed to encrypt sensitive data field');
  }
}

export function decryptSensitiveData(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('❌ Decryption Error:', error.message);
    return '[ENCRYPTED_DATA]';
  }
}

export function computeSHA256Checksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
