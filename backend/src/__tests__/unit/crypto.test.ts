import { BcryptCryptoService } from '../../infrastructure/crypto/BcryptCryptoService';

describe('BcryptCryptoService Unit Tests', () => {
  const dummyKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  let cryptoService: BcryptCryptoService;

  beforeEach(() => {
    cryptoService = new BcryptCryptoService(dummyKey);
  });

  describe('Password Hashing', () => {
    test('hashes password using bcrypt salt cost', async () => {
      const rawPassword = 'Password123!';
      const hash = await cryptoService.hashPassword(rawPassword);

      expect(hash).not.toBe(rawPassword);
      expect(hash).toMatch(/^\$2[ayb]\$/); // bcrypt hash signature
    });

    test('compares correct password successfully', async () => {
      const rawPassword = 'Password123!';
      const hash = await cryptoService.hashPassword(rawPassword);

      const isValid = await cryptoService.comparePassword(rawPassword, hash);
      expect(isValid).toBe(true);
    });

    test('rejects incorrect password comparison', async () => {
      const rawPassword = 'Password123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await cryptoService.hashPassword(rawPassword);

      const isValid = await cryptoService.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('AES-256-GCM Field Encryption & Decryption', () => {
    test('encrypts sensitive string into iv:authTag:ciphertext format', () => {
      const plaintext = '1234-5678-9012';
      const ciphertext = cryptoService.encrypt(plaintext);

      expect(ciphertext).not.toBe(plaintext);
      const parts = ciphertext.split(':');
      expect(parts.length).toBe(3);
      expect(parts[0]).toMatch(/^[0-9a-fA-F]{32}$/); // 16-byte IV in hex (32 chars)
    });

    test('decrypts encrypted text correctly back to original plaintext', () => {
      const plaintext = 'Sensitive-Aadhaar-1234-5678';
      const ciphertext = cryptoService.encrypt(plaintext);
      const decrypted = cryptoService.decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    test('throws error on tampered ciphertext or auth tag mismatch', () => {
      const plaintext = 'SecretData';
      const ciphertext = cryptoService.encrypt(plaintext);
      const parts = ciphertext.split(':');

      // Tamper ciphertext part
      const tamperedParts = [parts[0], parts[1], parts[2].slice(0, -2) + '00'];
      const tamperedCiphertext = tamperedParts.join(':');

      expect(() => cryptoService.decrypt(tamperedCiphertext)).toThrow();
    });

    test('decryptSafe handles plaintext legacy values seamlessly', () => {
      const legacyPlaintext = 'PlainValueNoColons';
      const decrypted = cryptoService.decryptSafe(legacyPlaintext);
      expect(decrypted).toBe(legacyPlaintext);
    });
  });
});
