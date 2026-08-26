import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class BcryptCryptoService {
  constructor(private readonly encryptionKey?: string) {}

  async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  encrypt(text: string): string {
    if (!this.encryptionKey) throw new Error('Encryption key not configured.');
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!this.encryptionKey) throw new Error('Encryption key not configured.');
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  decryptSafe(ciphertext: string): string {
    if (!ciphertext) return '';
    if (!ciphertext.includes(':')) {
      return ciphertext;
    }
    try {
      return this.decrypt(ciphertext);
    } catch {
      return ciphertext;
    }
  }
}
