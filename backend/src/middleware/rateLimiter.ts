import rateLimit, { Store, Options, IncrementResponse } from 'express-rate-limit';
import { cacheService } from '../services/cache.service';
import { redisClient, isRedisReady, isRedisRequired } from '../config/redis';
import { RedisNamespace } from '../services/security/RedisNamespace';
import { logger } from '../utils/logger';

const ATOMIC_RATE_LIMIT_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return current
`;

/**
 * Custom Distributed Redis Store for express-rate-limit with atomic Lua script and memory fallback
 */
class DistributedRedisStore implements Store {
  public prefix: string;
  private memoryFallbackStore: Map<string, { hits: number; resetTime: number }> = new Map();
  public windowMs: number = 60000;

  constructor(prefix: string = RedisNamespace.SECURITY_RATELIMIT) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = `${this.prefix}${key}`;
    const windowSeconds = Math.ceil(this.windowMs / 1000);

    if (isRedisReady()) {
      try {
        const rawHits = await redisClient.eval(ATOMIC_RATE_LIMIT_LUA, {
          keys: [fullKey],
          arguments: [windowSeconds.toString()],
        });
        const hits = typeof rawHits === 'number' ? rawHits : parseInt(String(rawHits), 10);
        const ttlSeconds = await redisClient.ttl(fullKey);
        const resetTime = new Date(Date.now() + (ttlSeconds > 0 ? ttlSeconds * 1000 : this.windowMs));
        return { totalHits: hits, resetTime };
      } catch (err: any) {
        logger.warn('Redis atomic rate limit increment failed, evaluating fallback policy', { error: err.message, key: fullKey });
      }
    }

    // Explicit Production vs Dev Fallback Policy
    if (isRedisRequired()) {
      logger.error('⚠️ Rate limiter failed closed: Redis is unreachable and REDIS_REQUIRED=true in production', { key: fullKey });
      // Fail-closed: return hit count exceeding limit so traffic is throttled rather than unbounded
      return {
        totalHits: 999999,
        resetTime: new Date(Date.now() + this.windowMs),
      };
    }

    // In-memory fallback for local development (REDIS_REQUIRED=false)
    logger.warn('Redis offline in development: Rate limiter using local in-memory store', { key: fullKey });
    const now = Date.now();
    let entry = this.memoryFallbackStore.get(fullKey);
    if (!entry || now > entry.resetTime) {
      entry = { hits: 1, resetTime: now + this.windowMs };
      this.memoryFallbackStore.set(fullKey, entry);
    } else {
      entry.hits += 1;
    }
    return { totalHits: entry.hits, resetTime: new Date(entry.resetTime) };
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (isRedisReady()) {
      try {
        await redisClient.decr(fullKey);
      } catch {}
    }
    const entry = this.memoryFallbackStore.get(fullKey);
    if (entry && entry.hits > 0) {
      entry.hits -= 1;
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (isRedisReady()) {
      try {
        await redisClient.del(fullKey);
      } catch {}
    }
    this.memoryFallbackStore.delete(fullKey);
  }
}

const createLimiter = (
  windowMs: number,
  max: number,
  message: string,
  code: string = 'TOO_MANY_REQUESTS',
  prefix: string = `${RedisNamespace.SECURITY_RATELIMIT}gen:`
) =>
  rateLimit({
    windowMs,
    max,
    skip: () => process.env.NODE_ENV === 'test',
    standardHeaders: true,
    legacyHeaders: true,
    statusCode: 429,
    store: new DistributedRedisStore(prefix),
    message: {
      success: false,
      error: {
        code,
        message,
      },
    },
  });

export const generalLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests from this IP, please try again after 15 minutes.',
  'TOO_MANY_REQUESTS',
  `${RedisNamespace.SECURITY_RATELIMIT}gen:`
);

export const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 attempts
  'Too many login attempts. Please try again after 15 minutes.',
  'LOGIN_RATE_EXCEEDED',
  `${RedisNamespace.SECURITY_RATELIMIT}login:`
);

export const registerLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many registration attempts. Please try again after 1 hour.',
  'REGISTRATION_RATE_EXCEEDED',
  'rl:reg:'
);

export const sendOtpLimiter = createLimiter(
  10 * 60 * 1000, // 10 minutes
  3,
  'Too many OTP requests. Please wait 10 minutes before requesting again.',
  'SEND_OTP_RATE_EXCEEDED',
  'rl:sendotp:'
);

export const resendOtpLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many OTP resend attempts. Please wait 1 hour.',
  'RESEND_OTP_RATE_EXCEEDED',
  'rl:resendotp:'
);

export const verifyOtpLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many verification attempts. Account locked temporarily for security.',
  'VERIFY_OTP_RATE_EXCEEDED',
  'rl:verifyotp:'
);

export const sendEmailCodeLimiter = createLimiter(
  10 * 60 * 1000, // 10 minutes
  3,
  'Too many email verification code requests. Please wait 10 minutes.',
  'SEND_EMAIL_CODE_RATE_EXCEEDED',
  'rl:sendemail:'
);

export const verifyEmailCodeLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many email verification attempts.',
  'VERIFY_EMAIL_RATE_EXCEEDED',
  'rl:verifyemail:'
);

export const uploadLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  'Upload limit reached for this IP. Please wait before uploading more files.',
  'UPLOAD_RATE_EXCEEDED',
  'rl:upload:'
);

export const authLimiter = loginLimiter;
export const phoneVerifyLimiter = verifyOtpLimiter;
export const refreshTokenLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many token refresh attempts. Please try again after 15 minutes.',
  'REFRESH_RATE_EXCEEDED',
  'rl:refresh:'
);

// Dedicated limiter for the SOAP billing endpoint.
// Tighter than generalLimiter because this endpoint exposes financial data.
export const soapBillingLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  20,             // 20 calls per window (ERP internal callers should not burst)
  'Too many SOAP billing requests. Please try again after 15 minutes.',
  'SOAP_BILLING_RATE_EXCEEDED',
  'rl:soap:billing:'
);

// Dedicated limiter for CSRF token bootstrapping.
// Generous allowance to prevent blocking legitimate page boots and refresh flows.
export const csrfBootstrapLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  60,             // 60 requests per 15 min per IP
  'Too many CSRF bootstrap requests. Please try again after 15 minutes.',
  'CSRF_RATE_EXCEEDED',
  'rl:csrf:'
);

