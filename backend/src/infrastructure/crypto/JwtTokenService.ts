import { ITokenService, ITokenPayload } from '../../interfaces/infrastructure/ITokenService';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export class JwtTokenService implements ITokenService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(jwtSecret?: string, jwtRefreshSecret?: string) {
    const accessSecret = jwtSecret || env.JWT_SECRET;
    const refreshSecret = jwtRefreshSecret || env.JWT_REFRESH_SECRET;

    if (!accessSecret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is required but not set. ' +
        'Set a strong random secret (min 32 chars) in your .env file.'
      );
    }
    if (!refreshSecret) {
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET environment variable is required but not set. ' +
        'Set a strong random secret (min 32 chars) in your .env file.'
      );
    }

    this.jwtSecret = accessSecret;
    this.jwtRefreshSecret = refreshSecret;
  }

  generateAccessToken(payload: ITokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '15m' });
  }

  generateRefreshToken(payload: ITokenPayload): string {
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): any {
    return jwt.verify(token, this.jwtSecret);
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.jwtRefreshSecret);
  }
}
