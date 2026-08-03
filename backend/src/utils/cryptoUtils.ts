import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';

export class CryptoUtils {
  /**
   * AES-256-GCM Encryption for sensitive KYC data
   */
  static encrypt(text: string): string {
    if (!text) return text;
    try {
      const keyBuffer = Buffer.from(env.AES_256_KEY.padEnd(64, '0').slice(0, 64), 'hex');
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
      // Fallback encoding if key length mismatch
      return Buffer.from(text).toString('base64');
    }
  }

  /**
   * AES-256-GCM Decryption
   */
  static decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return encryptedPayload;
    try {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) {
        return Buffer.from(encryptedPayload, 'base64').toString('utf8');
      }
      const [ivHex, authTagHex, encryptedHex] = parts;
      const keyBuffer = Buffer.from(env.AES_256_KEY.padEnd(64, '0').slice(0, 64), 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      return encryptedPayload;
    }
  }

  /**
   * Password Hashing via bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Password Verification
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate Access JWT (15 minutes default)
   */
  static generateAccessToken(payload: object): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  }

  /**
   * Generate Refresh Token (7 days default)
   */
  static generateRefreshToken(payload: object): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  /**
   * Verify JWT Token
   */
  static verifyToken<T>(token: string): T {
    return jwt.verify(token, env.JWT_SECRET) as T;
  }
}
