import { createClient, RedisClientType, RedisClientOptions } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

const REDIS_CONNECT_TIMEOUT_MS = 5000;

/**
 * Validates consistency between REDIS_URL protocol scheme and REDIS_TLS flag at startup.
 * Fails fast with descriptive error message if values conflict.
 */
export function validateRedisConfig(): void {
  const rawUrl = (env.REDIS_URL || process.env.REDIS_URL || "").trim();
  const tlsFlag = env.REDIS_TLS || process.env.REDIS_TLS;
  const isExplicitTlsTrue = tlsFlag === "true";
  const isExplicitTlsFalse = tlsFlag === "false";

  if (rawUrl && rawUrl !== "") {
    const isRedissScheme = rawUrl.startsWith("rediss://");
    const isRedisScheme = rawUrl.startsWith("redis://");

    if (isExplicitTlsTrue && isRedisScheme) {
      throw new Error(
        `Redis Configuration Mismatch: REDIS_TLS='true' but REDIS_URL uses plain 'redis://' (expected 'rediss://'). Check your environment configuration.`
      );
    }
    if (isExplicitTlsFalse && isRedissScheme) {
      throw new Error(
        `Redis Configuration Mismatch: REDIS_TLS='false' but REDIS_URL uses TLS 'rediss://' (expected 'redis://'). Check your environment configuration.`
      );
    }
  }
}

/**
 * Builds resilient Redis connection options with protocol-aware TLS handling:
 * - If REDIS_URL starts with rediss:// -> Enable TLS on socket
 * - If REDIS_URL starts with redis://  -> Plain TCP, NEVER force tls: true (prevents Node-Redis mismatch TypeError)
 * - If connecting via host/port without URL -> Respect REDIS_TLS boolean flag
 */
export function getRedisConfig(): RedisClientOptions {
  validateRedisConfig();

  const rawUrl = (env.REDIS_URL || process.env.REDIS_URL || "").trim();
  const isDev = (env.NODE_ENV || process.env.NODE_ENV || "development") === "development";
  const isTLS = rawUrl.startsWith("rediss://") || (rawUrl === "" && (env.REDIS_TLS === "true" || process.env.REDIS_TLS === "true"));

  const reconnectStrategy = (retries: number) => {
    // In development, avoid noisy endless retry loops if Docker Redis is not started
    if (isDev && retries > 3) {
      return new Error("Dev Redis max reconnect attempts reached. Active fallbacks running in-memory.");
    }
    if (retries > 10) {
      return new Error("Production Redis max reconnect attempts reached. Active fallbacks running in-memory.");
    }
    // Exponential backoff with jitter
    const baseDelay = Math.min(Math.pow(2, retries) * 100, 3000);
    const jitter = Math.floor(Math.random() * 200);
    return baseDelay + jitter;
  };

  if (rawUrl && rawUrl !== "") {
    return {
      url: rawUrl,
      socket: {
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy,
        ...(isTLS ? { tls: true } : {}),
      },
    };
  }

  // Fallback configuration if no URL string is provided
  const host = env.REDIS_HOST || process.env.REDIS_HOST || "localhost";
  const port = parseInt(env.REDIS_PORT || process.env.REDIS_PORT || "6379", 10);

  const config: RedisClientOptions = {
    socket: {
      host,
      port,
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      reconnectStrategy,
      ...(isTLS ? { tls: true } : {}),
    },
  };

  if (env.REDIS_PASSWORD || process.env.REDIS_PASSWORD) {
    config.password = env.REDIS_PASSWORD || process.env.REDIS_PASSWORD;
  }
  if (env.REDIS_DB || process.env.REDIS_DB) {
    config.database = parseInt(env.REDIS_DB || process.env.REDIS_DB || "0", 10);
  }

  return config;
}

/**
 * Safe initializer for the primary Redis client instance
 */
function initRedisClient(): RedisClientType {
  try {
    const config = getRedisConfig();
    return createClient(config);
  } catch (err: any) {
    logger.warn(`⚠️ Failed to initialize Redis client with config: ${err.message}. Operating in fallback mode.`);
    return createClient({
      url: "redis://localhost:6379",
      socket: {
        reconnectStrategy: () => new Error("Fallback Redis client offline"),
      },
    });
  }
}

export const redisClient: RedisClientType = initRedisClient();
export const redis: RedisClientType = redisClient;

let hasLoggedConnectError = false;
let connectPromise: Promise<boolean> | null = null;

redisClient.on("error", (err: Error) => {
  if (!hasLoggedConnectError) {
    hasLoggedConnectError = true;
    const isLocalhost = (env.REDIS_HOST || "").includes("localhost") || 
      (env.REDIS_URL || "").includes("localhost") || 
      (env.REDIS_URL || "").includes("127.0.0.1") ||
      (env.REDIS_URL || "").includes("redis://redis:6379");
    if (isLocalhost && (env.NODE_ENV || "development") === "development") {
      logger.warn(`⚠️ Redis not reachable at ${env.REDIS_HOST}:${env.REDIS_PORT}. (Run 'docker compose -f docker-compose.dev.yml up -d redis' to start Docker Redis). Operating with active in-memory fallback.`);
    } else {
      logger.warn(`⚠️ Redis Connection Warning: ${err.message}. Operating with active in-memory fallback.`);
    }
  }
});

redisClient.on("connect", () => {
  hasLoggedConnectError = false;
});

redisClient.on("ready", () => {
  hasLoggedConnectError = false;
  logger.info("✓ Redis Connected");
});

redisClient.on("reconnecting", () => {
  logger.debug("🔄 Redis Client attempting reconnect...");
});

redisClient.on("end", () => {
  logger.debug("ℹ️ Redis Client connection closed");
});

/**
 * Initialize connection lazily, concurrently-safe, & idempotently
 */
export async function connectRedis(): Promise<boolean> {
  if (redisClient.isReady) return true;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      return true;
    } catch (err: any) {
      logger.warn(`⚠️ Redis connection could not be established (${err.message}). In-memory fallback is active.`);
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/**
 * Returns true if Redis connection is ready and healthy
 */
export function isRedisReady(): boolean {
  try {
    return Boolean(redisClient && redisClient.isOpen && redisClient.isReady);
  } catch {
    return false;
  }
}

/**
 * Returns true if Redis is declared as strictly required (e.g. in production)
 */
export function isRedisRequired(): boolean {
  return env.REDIS_REQUIRED === "true" || process.env.REDIS_REQUIRED === "true";
}

/**
 * Validates Redis connection during server startup
 */
export async function verifyRedisConnection(): Promise<{
  connected: boolean;
  host: string;
  port: string;
  database: string;
  latencyMs: number;
  error?: string;
}> {
  const rawUrl = env.REDIS_URL || process.env.REDIS_URL || "";
  let host = env.REDIS_HOST || process.env.REDIS_HOST || "localhost";
  let port = env.REDIS_PORT || process.env.REDIS_PORT || "6379";
  let database = env.REDIS_DB || process.env.REDIS_DB || "0";

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      host = parsed.hostname || host;
      port = parsed.port || port;
      if (parsed.pathname && parsed.pathname.length > 1) {
        database = parsed.pathname.replace(/^\//, "");
      }
    } catch {}
  }

  try {
    const isConnected = await connectRedis();
    if (!isConnected || !redisClient.isReady) {
      return {
        connected: false,
        host,
        port,
        database,
        latencyMs: -1,
        error: `Could not connect to Redis at ${host}:${port}`,
      };
    }

    const start = Date.now();
    const pong = await redisClient.ping();
    const latencyMs = pong === "PONG" ? Date.now() - start : -1;

    return {
      connected: latencyMs >= 0,
      host,
      port,
      database,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      host,
      port,
      database,
      latencyMs: -1,
      error: err.message,
    };
  }
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
 * Non-blocking approximate key counts for health/metrics endpoints.
 * Scans up to 1,000 keys per category using scanIterator (never uses blocking KEYS *).
 */
export async function getRedisKeyEstimates(): Promise<{
  rateLimitKeys: number;
  otpKeys: number;
  blacklistKeys: number;
}> {
  if (!isRedisReady()) {
    return { rateLimitKeys: 0, otpKeys: 0, blacklistKeys: 0 };
  }

  const counts = { rateLimitKeys: 0, otpKeys: 0, blacklistKeys: 0 };
  const SCAN_CAP = 1000;

  try {
    // Count rate limit keys (security:ratelimit:* and rl:*)
    for await (const _ of (redisClient as any).scanIterator({ MATCH: "security:ratelimit:*", COUNT: 100 })) {
      counts.rateLimitKeys++;
      if (counts.rateLimitKeys >= SCAN_CAP) break;
    }
    for await (const _ of (redisClient as any).scanIterator({ MATCH: "rl:*", COUNT: 100 })) {
      counts.rateLimitKeys++;
      if (counts.rateLimitKeys >= SCAN_CAP) break;
    }
    // Count otp keys (security:otp:* and otp:*)
    for await (const _ of (redisClient as any).scanIterator({ MATCH: "security:otp:*", COUNT: 100 })) {
      counts.otpKeys++;
      if (counts.otpKeys >= SCAN_CAP) break;
    }
    for await (const _ of (redisClient as any).scanIterator({ MATCH: "otp:*", COUNT: 100 })) {
      counts.otpKeys++;
      if (counts.otpKeys >= SCAN_CAP) break;
    }
    // Count blacklist keys (security:jwt:blacklist:* and jwt:blacklist:*)
    for await (const _ of (redisClient as any).scanIterator({ MATCH: "security:jwt:blacklist:*", COUNT: 100 })) {
      counts.blacklistKeys++;
      if (counts.blacklistKeys >= SCAN_CAP) break;
    }
    for await (const _ of (redisClient as any).scanIterator({ MATCH: "jwt:blacklist:*", COUNT: 100 })) {
      counts.blacklistKeys++;
      if (counts.blacklistKeys >= SCAN_CAP) break;
    }
  } catch (err: any) {
    logger.warn("Error collecting Redis key estimates for telemetry", { error: err.message });
  }

  return counts;
}

/**
 * Graceful shutdown helper
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch {
      await redisClient.disconnect();
    }
  }
}

// Attach graceful shutdown hooks
const handleExitSignal = async (signal: string) => {
  await disconnectRedis();
};

process.once("SIGINT", () => handleExitSignal("SIGINT"));
process.once("SIGTERM", () => handleExitSignal("SIGTERM"));

// Auto-trigger lazy connection in non-test environments
if (env.NODE_ENV !== "test") {
  connectRedis().catch(() => {});
}
