import { cacheService } from "./cache.service";
import { logger } from "../utils/logger";
import jwt from "jsonwebtoken";

/**
 * Token Blacklist Service
 * Stores revoked JWT access tokens in Redis until their natural expiration time.
 */
export class TokenBlacklistService {
  private static readonly PREFIX = "jwt:blacklist:";

  /**
   * Blacklist an access token until its expiration date.
   */
  async blacklistToken(token: string, expiresAtSeconds?: number): Promise<void> {
    if (!token) return;

    let ttl = 900; // Default 15 minutes
    if (expiresAtSeconds) {
      ttl = Math.max(1, expiresAtSeconds - Math.floor(Date.now() / 1000));
    } else {
      try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (decoded?.exp) {
          ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
        }
      } catch {
        // Fallback default 15m
      }
    }

    const key = `${TokenBlacklistService.PREFIX}${token}`;
    await cacheService.set(key, "revoked", ttl);
    logger.info("JWT access token blacklisted", { ttlSeconds: ttl });
  }

  /**
   * Check if a token is blacklisted.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;
    const key = `${TokenBlacklistService.PREFIX}${token}`;
    const exists = await cacheService.exists(key);
    return exists;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
