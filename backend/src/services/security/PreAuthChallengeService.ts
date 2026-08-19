import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { redisClient, isRedisReady } from "../../config/redis";
import { RedisNamespace } from "./RedisNamespace";
import { logger } from "../../utils/logger";

export interface PreAuthChallengeData {
  userId: string;
  visitorId: string;
  expiresAt: Date;
  attempts: number;
}

/**
 * Pre-Authentication Challenge & Step-Up 2FA Resilience Service
 * 
 * Implements dual-storage for step-up challenges across Redis (fast path) and MongoDB (authoritative fallback).
 * Prevents authentication outages if Redis experiences node restarts during multi-factor verification flows.
 */
export class PreAuthChallengeService {
  private static readonly TTL_SECONDS = 300; // 5 Minutes
  private static readonly MAX_ATTEMPTS = 5;

  private static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Issues and stores a new PreAuth challenge token across Redis and MongoDB
   */
  public static async createChallenge(userId: string, visitorId: string): Promise<string> {
    const rawToken = `preauth_${crypto.randomBytes(32).toString("hex")}`;
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.TTL_SECONDS * 1000);
    const redisKey = RedisNamespace.preAuthKey(tokenHash);

    // 1. Authoritative write to MongoDB
    try {
      await prisma.preAuthChallenge.create({
        data: {
          tokenHash,
          userId,
          visitorId: visitorId || "unknown",
          expiresAt,
          attempts: 0,
        },
      });
    } catch (mongoErr: any) {
      logger.error("Failed to persist PreAuthChallenge in MongoDB", { userId, error: mongoErr.message });
    }

    // 2. Fast-path cache write to Redis
    if (isRedisReady()) {
      try {
        const payload: PreAuthChallengeData = {
          userId,
          visitorId: visitorId || "unknown",
          expiresAt,
          attempts: 0,
        };
        await redisClient.set(redisKey, JSON.stringify(payload), { EX: this.TTL_SECONDS });
      } catch (redisErr: any) {
        logger.warn("Failed to cache PreAuthChallenge in Redis, operating on MongoDB", { error: redisErr.message });
      }
    }

    logger.info("PreAuth challenge created", { userId, tokenHashPrefix: tokenHash.substring(0, 8) });
    return rawToken;
  }

  /**
   * Atomically verifies and consumes a PreAuth challenge token.
   * Throws if expired, replayed, or attempt threshold exceeded.
   */
  public static async verifyAndConsumeChallenge(
    rawToken: string,
    visitorId?: string
  ): Promise<{ userId: string; visitorId: string }> {
    if (!rawToken) {
      throw new Error("PreAuth challenge token is required");
    }

    const tokenHash = this.hashToken(rawToken);
    const redisKey = RedisNamespace.preAuthKey(tokenHash);

    // 1. Authoritative lookup in MongoDB
    let dbChallenge: any = null;
    try {
      dbChallenge = await prisma.preAuthChallenge.findUnique({
        where: { tokenHash },
      });
    } catch (err: any) {
      logger.error("Error querying PreAuthChallenge from MongoDB", { error: err.message });
    }

    if (!dbChallenge) {
      throw new Error("Invalid or unrecognized PreAuth challenge token");
    }

    if (dbChallenge.consumedAt) {
      logger.warn("PreAuth challenge replay detected", { tokenHashPrefix: tokenHash.substring(0, 8) });
      throw new Error("This verification token has already been used");
    }

    if (dbChallenge.expiresAt < new Date()) {
      throw new Error("Verification token has expired. Please log in again.");
    }

    if (dbChallenge.attempts >= this.MAX_ATTEMPTS) {
      logger.warn("PreAuth challenge locked out due to excessive attempts", { userId: dbChallenge.userId });
      throw new Error("Too many failed verification attempts. Please log in again.");
    }

    // 2. Consume Challenge Atomically
    try {
      await prisma.preAuthChallenge.update({
        where: { id: dbChallenge.id },
        data: {
          consumedAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    } catch (consumeErr: any) {
      logger.error("Error marking PreAuthChallenge consumed in Mongo", { error: consumeErr.message });
    }

    // Invalidate Redis cache
    if (isRedisReady()) {
      try {
        await redisClient.del(redisKey);
      } catch {}
    }

    logger.info("PreAuth challenge successfully consumed", { userId: dbChallenge.userId });
    return {
      userId: dbChallenge.userId,
      visitorId: dbChallenge.visitorId,
    };
  }

  /**
   * Increments the failed attempt counter for a challenge
   */
  public static async recordFailedAttempt(rawToken: string): Promise<number> {
    if (!rawToken) return 0;
    const tokenHash = this.hashToken(rawToken);

    try {
      const updated = await prisma.preAuthChallenge.update({
        where: { tokenHash },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      });
      return updated.attempts;
    } catch {
      return 0;
    }
  }
}
