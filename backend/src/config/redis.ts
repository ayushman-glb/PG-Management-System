import { createClient, RedisClientType, RedisClientOptions } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

const REDIS_CONNECT_TIMEOUT_MS = 5000;

/**
 * Builds resilient Redis connection options with URL priority and parameter fallback
 */
export function getRedisConfig(): RedisClientOptions {
  const isDev = (env.NODE_ENV || "development") === "development";
  const tlsEnabled = env.REDIS_TLS === "true" || env.REDIS_URL.startsWith("rediss://");

  let config: RedisClientOptions = {
    socket: {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      ...(tlsEnabled ? { tls: true } : {}),
      reconnectStrategy: (retries: number) => {
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
      },
    },
  };

  if (env.REDIS_URL && env.REDIS_URL.trim() !== "") {
    config.url = env.REDIS_URL.trim();
  } else {
    config.socket = {
      ...config.socket,
      host: env.REDIS_HOST || "localhost",
      port: parseInt(env.REDIS_PORT || "6379", 10),
    };
    if (env.REDIS_PASSWORD) {
      config.password = env.REDIS_PASSWORD;
    }
    if (env.REDIS_DB) {
      config.database = parseInt(env.REDIS_DB, 10);
    }
  }

  return config;
}

export const redisClient: RedisClientType = createClient(getRedisConfig());

let hasLoggedConnectError = false;
let isConnecting = false;

redisClient.on("error", (err: Error) => {
  if (!hasLoggedConnectError) {
    hasLoggedConnectError = true;
    const isLocalhost = env.REDIS_HOST === "localhost" || env.REDIS_URL.includes("localhost") || env.REDIS_URL.includes("127.0.0.1");
    if (isLocalhost && (env.NODE_ENV || "development") === "development") {
      logger.warn(`⚠️ Redis not reachable at ${env.REDIS_HOST}:${env.REDIS_PORT}. (Run 'docker compose -f docker-compose.dev.yml up -d redis' to start Docker Redis). Operating with active in-memory fallback.`);
    } else {
      logger.warn(`⚠️ Redis Connection Warning: ${err.message}`);
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
 * Validates Redis connection during server startup (Phase 5)
 */
export async function verifyRedisConnection(): Promise<{
  connected: boolean;
  host: string;
  port: string;
  database: string;
  latencyMs: number;
  error?: string;
}> {
  const host = env.REDIS_HOST || "localhost";
  const port = env.REDIS_PORT || "6379";
  const database = env.REDIS_DB || "0";

  try {
    const isConnected = await connectRedis();
    if (!isConnected) {
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
