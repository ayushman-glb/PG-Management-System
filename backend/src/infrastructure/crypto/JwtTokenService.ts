import jwt from 'jsonwebtoken';

export class JwtTokenService {
  constructor(
    private readonly accessSecret: string = process.env.JWT_SECRET || 'secret_jwt_access_token_min_32_characters_123',
    private readonly refreshSecret: string = process.env.JWT_REFRESH_SECRET || 'secret_jwt_refresh_token_min_32_characters_123'
  ) {}

  generateAccessToken(payload: Record<string, any>, expiresIn: string = '15m'): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: expiresIn as any });
  }

  generateRefreshToken(payload: Record<string, any>, expiresIn: string = '7d'): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: expiresIn as any });
  }

  generatePreAuthToken(payload: { userId: string; role: string }): string {
    return jwt.sign({ ...payload, preAuth: true }, this.accessSecret, { expiresIn: '5m' });
  }

  verifyAccessToken(token: string): any {
    return jwt.verify(token, this.accessSecret);
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.refreshSecret);
  }

  verifyPreAuthToken(token: string): any {
    const decoded: any = jwt.verify(token, this.accessSecret);
    if (!decoded || !decoded.preAuth) {
      throw new Error('Invalid pre-auth token');
    }
    return decoded;
  }
}
