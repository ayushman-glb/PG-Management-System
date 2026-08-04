import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (error) {
    // Fallback to bcrypt if argon2 encounters platform issues
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, password);
    }
    // Fallback check for legacy bcrypt hashes
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('❌ Password verification error:', error);
    return false;
  }
}
