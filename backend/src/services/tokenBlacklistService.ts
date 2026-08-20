import { prisma } from "../config/prisma";
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
 * Stores revoked JWT access tokens in authoritative MongoDB RevokedToken collection
 * backed by an in-memory process cache for high-throughput sub-millisecond lookups.
 */
export class TokenBlacklistService {
  // High-performance process-level cache: tokenHash -> expiration timestamp ms
  private inMemoryBlacklist: Map<string, number> = new Map();

  constructor() {
    // Periodic sweep for expired in-memory blacklist tokens every 5 minutes
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanupMemoryStore(), 300000).unref();
    }
  }

  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [hash, expMs] of this.inMemoryBlacklist.entries()) {
      if (now >= expMs) {
        this.inMemoryBlacklist.delete(hash);
      }
    }
  }

  /**
   * Hash a token with SHA-256 before storage to prevent raw secret exposure in logs/database.
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Blacklist an access token until its natural expiration date.
   * Derives remaining lifetime from token's exp claim.
   * If TTL <= 0, the token is already expired and is NOT stored.
   */
  async blacklistToken(token: string, expiresAtSeconds?: number, reason: string = "LOGOUT"): Promise<void> {
    if (!token) return;

    const nowUnix = Math.floor(Date.now() / 1000);
    let ttl = 0;
    let decodedUserId: string | undefined;

    if (expiresAtSeconds !== undefined && expiresAtSeconds !== null) {
      ttl = expiresAtSeconds - nowUnix;
    } else {
      try {
        const decoded = jwt.decode(token) as { exp?: number; id?: string; userId?: string };
        if (decoded?.exp) {
          ttl = decoded.exp - nowUnix;
        } else {
          ttl = parseDurationToSeconds(env.JWT_ACCESS_EXPIRATION || "15m");
        }
        decodedUserId = decoded?.id || decoded?.userId;
      } catch {
        ttl = parseDurationToSeconds(env.JWT_ACCESS_EXPIRATION || "15m");
      }
    }

    // If token has already naturally expired, discard immediately
    if (ttl <= 0) {
      return;
    }

    const tokenHash = this.hashToken(token);
    const expiresAt = new Date((nowUnix + ttl) * 1000);

    // 1. Save in local process memory for instant $O(1)$ hits
    this.inMemoryBlacklist.set(tokenHash, expiresAt.getTime());

    // 2. Persist in authoritative MongoDB RevokedToken table
    try {
      await prisma.revokedToken.upsert({
        where: { tokenHash },
        update: { expiresAt, revokedAt: new Date(), reason },
        create: {
          tokenHash,
          userId: decodedUserId,
          expiresAt,
          reason,
        },
      });

      logger.info("JWT access token blacklisted with dynamic TTL", {
        tokenHashPrefix: tokenHash.substring(0, 8),
        ttlSeconds: ttl,
      });
    } catch (err: any) {
      logger.error("Failed to persist revoked token in MongoDB", {
        tokenHashPrefix: tokenHash.substring(0, 8),
        error: err.message,
      });
    }
  }

  /**
   * Check if a token is blacklisted.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;
    const tokenHash = this.hashToken(token);
    const nowMs = Date.now();

    // 1. Fast process-level cache check
    const cachedExp = this.inMemoryBlacklist.get(tokenHash);
    if (cachedExp) {
      if (nowMs < cachedExp) {
        return true;
      }
      this.inMemoryBlacklist.delete(tokenHash);
      return false;
    }

    // 2. Authoritative check in MongoDB
    try {
      const record = await prisma.revokedToken.findUnique({
        where: { tokenHash },
      });

      if (record) {
        if (record.expiresAt.getTime() > nowMs) {
          // Warm local cache
          this.inMemoryBlacklist.set(tokenHash, record.expiresAt.getTime());
          return true;
        }
      }
      return false;
    } catch (dbErr: any) {
      logger.warn("Database lookup error during token blacklist check", {
        tokenHashPrefix: tokenHash.substring(0, 8),
        error: dbErr.message,
      });
      return false;
    }
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
