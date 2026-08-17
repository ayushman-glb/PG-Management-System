import { createClient, RedisClientType } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Production-grade Redis Singleton Client Configuration
 */
const REDIS_CONNECT_TIMEOUT_MS = 5000;

export const redisClient: RedisClientType = createClient({
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  socket: {
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    ...(env.REDIS_TLS === "true" ? { tls: true } : {}),
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.warn("⚠️ Redis max reconnect attempts reached. Active fallbacks running in-memory.");
        return new Error("Max reconnect attempts reached");
      }
      // Exponential backoff with jitter: min 100ms, max 3000ms
      const baseDelay = Math.min(Math.pow(2, retries) * 100, 3000);
      const jitter = Math.floor(Math.random() * 200);
      return baseDelay + jitter;
    },
  } as any,
});

let isConnecting = false;

redisClient.on("error", (err: Error) => {
  logger.warn("⚠️ Redis Client Connection Warning:", { message: err.message });
});

redisClient.on("connect", () => {
  logger.info("✅ Redis Client socket connected");
});

redisClient.on("ready", () => {
  logger.info("✅ Redis Server READY & operational");
});

redisClient.on("reconnecting", () => {
  logger.info("🔄 Redis Client attempting reconnect...");
});

redisClient.on("end", () => {
  logger.info("ℹ️ Redis Client connection closed");
});

/**
 * Initialize connection lazily & idempotently
 */
export async function connectRedis(): Promise<boolean> {
  if (redisClient.isReady) return true;
  if (isConnecting) return false;

  isConnecting = true;
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return true;
  } catch (err: any) {
    logger.warn("⚠️ Redis connection failed. Operating with active fallback:", { message: err?.message || err });
    return false;
  } finally {
    isConnecting = false;
  }
}

/**
 * Returns true if Redis connection is ready and healthy
 */
export function isRedisReady(): boolean {
  return redisClient.isOpen && redisClient.isReady;
}

/**
 * Ping Redis and return round-trip latency in ms (-1 if disconnected)
 */
export async function pingRedis(): Promise<number> {
  if (!isRedisReady()) return -1;
  const start = Date.now();
  try {
    const res = await redisClient.ping();
    return res === "PONG" ? Date.now() - start : -1;
  } catch {
    return -1;
  }
}

/**
 * Graceful shutdown helper
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      logger.info("✅ Redis Client disconnected gracefully");
    } catch {
      await redisClient.disconnect();
    }
  }
}

// Attach graceful shutdown hooks
const handleExitSignal = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down Redis connection...`);
  await disconnectRedis();
};

process.once("SIGINT", () => handleExitSignal("SIGINT"));
process.once("SIGTERM", () => handleExitSignal("SIGTERM"));

// Auto-trigger lazy connection in non-test environments
if (env.NODE_ENV !== "test") {
  connectRedis().catch((err) => {
    logger.warn("Initial Redis connect trigger deferred:", { error: err?.message });
  });
}
