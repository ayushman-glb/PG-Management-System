import rateLimit, { Store, Options, IncrementResponse } from 'express-rate-limit';
import { cacheService } from '../services/cache.service';
import { isRedisReady } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Custom Distributed Redis Store for express-rate-limit with memory fallback
 */
class DistributedRedisStore implements Store {
  public prefix: string;
  private memoryFallbackStore: Map<string, { hits: number; resetTime: number }> = new Map();
  public windowMs: number = 60000;

  constructor(prefix: string = 'rl:') {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = `${this.prefix}${key}`;

    if (isRedisReady()) {
      try {
        const hits = await cacheService.increment(fullKey, 1);
        if (hits === 1) {
          await cacheService.expire(fullKey, Math.ceil(this.windowMs / 1000));
        }
        const ttlSeconds = await cacheService.ttl(fullKey);
        const resetTime = new Date(Date.now() + (ttlSeconds > 0 ? ttlSeconds * 1000 : this.windowMs));
        return { totalHits: hits, resetTime };
      } catch (err: any) {
        logger.warn('Redis rate limit increment failed, using in-memory store', { error: err.message });
      }
    }

    // In-memory fallback
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
        await cacheService.decrement(fullKey, 1);
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
        await cacheService.del(fullKey);
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
  prefix: string = 'rl:'
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
  'rl:gen:'
);

export const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes — matches DESIGN.md §8.3 spec: 5 req/15min
  5,
  'Too many login attempts. Please try again after 15 minutes.',
  'LOGIN_RATE_EXCEEDED',
  'rl:login:'
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
