import { EncryptionService } from '../../services/security/EncryptionService';

describe('AES-256-GCM Envelope Encryption & Key Rotation', () => {
  test('should encrypt and decrypt plaintext string accurately using versioned envelope', () => {
    const sensitiveData = '987654321012'; // 12-digit Aadhaar / Account number
    const encrypted = EncryptionService.encrypt(sensitiveData);

    expect(encrypted).toBeDefined();
    expect(encrypted.startsWith('v1:')).toBe(true);
    expect(encrypted.split(':').length).toBe(5); // v1:keyId:iv:tag:ciphertext

    const decrypted = EncryptionService.decrypt(encrypted);
    expect(decrypted).toBe(sensitiveData);
  });

  test('should transparently parse and decrypt legacy 4-part envelope for zero-downtime migration', () => {
    // Manually construct legacy 4-part envelope
    const legacy = 'v1:a1b2c3d4e5f6a1b2c3d4e5f6:0123456789abcdef0123456789abcdef:deadbeef';
    const parsed = EncryptionService.parseEnvelope(legacy);
    expect(parsed.version).toBe('v1');
    expect(parsed.keyId).toBe('v1');
    expect(parsed.iv).toBeDefined();
  });

  test('should produce distinct ciphertexts with different IVs for identical plaintext inputs', () => {
    const plain = 'SBIN0001234';
    const enc1 = EncryptionService.encrypt(plain);
    const enc2 = EncryptionService.encrypt(plain);

    expect(enc1).not.toBe(enc2);
    expect(EncryptionService.decrypt(enc1)).toBe(plain);
    expect(EncryptionService.decrypt(enc2)).toBe(plain);
  });

  test('should support key rotation from v1 to v2', () => {
    const plain = '50100123456789';
    const encV1 = EncryptionService.encrypt(plain, 'v1');
    expect(encV1.startsWith('v1:v1:')).toBe(true);

    const rotatedToV2 = EncryptionService.rotate(encV1, 'v2');
    expect(rotatedToV2.startsWith('v1:v2:')).toBe(true);

    const decrypted = EncryptionService.decrypt(rotatedToV2);
    expect(decrypted).toBe(plain);
  });

  test('should throw an authentication error when ciphertext or auth tag is tampered with', () => {
    const original = 'confidential_financial_token';
    const encrypted = EncryptionService.encrypt(original);

    const parts = encrypted.split(':');
    // Tamper with the ciphertext component (index 4 for 5-part format)
    parts[4] = (parseInt(parts[4], 16) ^ 0xff).toString(16);
    const tampered = parts.join(':');

    expect(() => EncryptionService.decrypt(tampered)).toThrow();
  });

  test('should encrypt and decrypt objects accurately', () => {
    const accountDetails = {
      accountNumber: '112233445566',
      ifscCode: 'HDFC0000123',
      upiId: 'owner@okhdfcbank',
    };

    const encryptedObj = EncryptionService.encryptObject(accountDetails, ['accountNumber', 'ifscCode', 'upiId']);
    expect(encryptedObj.accountNumber.startsWith('v1:')).toBe(true);
    expect(encryptedObj.ifscCode.startsWith('v1:')).toBe(true);
    expect(encryptedObj.upiId.startsWith('v1:')).toBe(true);

    const decryptedObj = EncryptionService.decryptObject(encryptedObj, ['accountNumber', 'ifscCode', 'upiId']);
    expect(decryptedObj).toEqual(accountDetails);
  });
});
