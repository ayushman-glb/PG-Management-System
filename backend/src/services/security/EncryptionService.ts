import crypto from 'crypto';

export class EncryptionService {
  private static masterKeys: Record<string, string> = {
    v1: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    v2: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  };

  public static encrypt(plainText: string, keyId: string = 'v1'): string {
    const keyHex = this.masterKeys[keyId] || this.masterKeys['v1'];
    const key = Buffer.from(keyHex, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plainText, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return `v1:${keyId}:${iv.toString('hex')}:${tag}:${ciphertext}`;
  }

  public static parseEnvelope(envelope: string): { version: string; keyId: string; iv: string; tag: string; ciphertext: string } {
    const parts = envelope.split(':');
    if (parts.length === 5) {
      return { version: parts[0], keyId: parts[1], iv: parts[2], tag: parts[3], ciphertext: parts[4] };
    }
    if (parts.length === 4) {
      return { version: parts[0], keyId: parts[0], iv: parts[1], tag: parts[2], ciphertext: parts[3] };
    }
    throw new Error('Invalid envelope structure');
  }

  public static decrypt(envelope: string): string {
    const parsed = this.parseEnvelope(envelope);
    const keyHex = this.masterKeys[parsed.keyId] || this.masterKeys['v1'];
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(parsed.iv, 'hex');
    const tag = Buffer.from(parsed.tag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(parsed.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public static rotate(envelope: string, newKeyId: string = 'v2'): string {
    const plain = this.decrypt(envelope);
    return this.encrypt(plain, newKeyId);
  }

  public static encryptObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result: any = { ...obj };
    for (const field of fields) {
      if (typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field]);
      }
    }
    return result;
  }

  public static decryptObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result: any = { ...obj };
    for (const field of fields) {
      if (typeof result[field] === 'string') {
        result[field] = this.decrypt(result[field]);
      }
    }
    return result;
  }
}
