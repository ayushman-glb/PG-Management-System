import { cacheService } from "./cache.service";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Parses a duration string (e.g. "15m", "1h", "7d", "900s") into integer seconds.
 */
export function parseDurationToSeconds(duration: string = "15m"): number {
  if (!duration) return 900;
  const match = String(duration).trim().match(/^(\d+)\s*([smhdwy])?$/i);
  if (!match) return 900;
  const val = parseInt(match[1], 10);
  const unit = (match[2] || "s").toLowerCase();
  switch (unit) {
    case "s": return val;
    case "m": return val * 60;
    case "h": return val * 3600;
    case "d": return val * 86400;
    case "w": return val * 604800;
    case "y": return val * 31536000;
    default: return val;
  }
}

/**
 * Token Blacklist Service
 * Stores revoked JWT access tokens in Redis until their natural expiration time.
 */
export class TokenBlacklistService {
  private static readonly PREFIX = "jwt:blacklist:";

  /**
   * Hash a token with SHA-256 before using as a Redis key to prevent raw secret exposure in keyspace.
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Blacklist an access token until its expiration date.
   * Derives TTL from token's exp claim, falling back to configured JWT_ACCESS_EXPIRATION.
   */
  async blacklistToken(token: string, expiresAtSeconds?: number): Promise<void> {
    if (!token) return;

    const configuredTtl = parseDurationToSeconds(env.JWT_ACCESS_EXPIRATION || "15m");
    let ttl = configuredTtl;

    if (expiresAtSeconds) {
      ttl = Math.max(1, expiresAtSeconds - Math.floor(Date.now() / 1000));
    } else {
      try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (decoded?.exp) {
          ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
        }
      } catch {
        ttl = configuredTtl;
      }
    }

    const tokenHash = this.hashToken(token);
    const key = `${TokenBlacklistService.PREFIX}${tokenHash}`;
    await cacheService.set(key, "revoked", ttl);
    logger.info("JWT access token blacklisted", { tokenHashPrefix: tokenHash.substring(0, 8), ttlSeconds: ttl });
  }

  /**
   * Check if a token is blacklisted.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;
    const tokenHash = this.hashToken(token);
    const key = `${TokenBlacklistService.PREFIX}${tokenHash}`;
    const exists = await cacheService.exists(key);
    return exists;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
