export interface ICryptoService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  encrypt(text: string): string;
  decrypt(encryptedText: string): string;
}
