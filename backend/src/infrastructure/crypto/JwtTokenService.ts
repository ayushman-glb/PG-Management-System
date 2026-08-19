import { ITokenService, ITokenPayload } from '../../interfaces/infrastructure/ITokenService';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtKeyService } from '../../services/security/JwtKeyService';

export class JwtTokenService implements ITokenService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(jwtSecret?: string, jwtRefreshSecret?: string) {
    this.jwtSecret = jwtSecret || env.JWT_SECRET || 'dev_jwt_access_secret_min_32_chars_fallback';
    this.jwtRefreshSecret = jwtRefreshSecret || env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_min_32_chars_fallback';
  }

  generateAccessToken(payload: ITokenPayload): string {
    const expires: any = env.JWT_ACCESS_EXPIRATION || '15m';
    try {
      return JwtKeyService.signAccessToken(payload as any, expires);
    } catch {
      return jwt.sign(payload, this.jwtSecret, { expiresIn: expires });
    }
  }

  generateRefreshToken(payload: ITokenPayload): string {
    const expires: any = env.JWT_REFRESH_EXPIRATION || '7d';
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: expires });
  }

  generateOpaqueRefreshToken(): string {
    return JwtKeyService.generateOpaqueRefreshToken();
  }

  generatePreAuthToken(payload: any): string {
    return jwt.sign({ ...payload, preAuth: true }, this.jwtSecret, { expiresIn: '5m' });
  }

  verifyAccessToken(token: string): any {
    try {
      return JwtKeyService.verifyAccessToken(token);
    } catch {
      return jwt.verify(token, this.jwtSecret);
    }
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.jwtRefreshSecret);
  }

  verifyPreAuthToken(token: string): any {
    let decoded: any;
    try {
      decoded = JwtKeyService.verifyAccessToken(token);
    } catch {
      try {
        decoded = jwt.verify(token, this.jwtSecret);
      } catch {
        throw new Error('Invalid pre-auth token');
      }
    }
    if (!decoded || !decoded.preAuth) {
      throw new Error('Invalid pre-auth token');
    }
    return decoded;
  }
}
