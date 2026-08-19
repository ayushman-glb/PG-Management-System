/**
 * Redis Key Namespace Policy & Isolation Specification
 * 
 * Enforces strict prefix boundaries across security, session, cache, queue, lock, and socket domains
 * to guarantee that cache invalidations, evictions, or queue flush operations NEVER
 * compromise security keys (JWT blacklists, active rate limiters, or step-up challenges).
 */
export class RedisNamespace {
  // Security Namespaces
  public static readonly SECURITY_JWT_BLACKLIST = "security:jwt:blacklist:";
  public static readonly SECURITY_OTP = "security:otp:";
  public static readonly SECURITY_RATELIMIT = "security:ratelimit:";
  public static readonly SECURITY_PREAUTH = "security:preauth:";

  // Session & User Namespaces
  public static readonly SESSION_USER = "session:user:";
  public static readonly SESSION_TOKEN_VERSION = "session:user:tokenVersion:";

  // Cache & Mutex Namespaces
  public static readonly CACHE_PREFIX = "cache:";
  public static readonly CACHE_LOCK = "lock:cache:";

  // Queue Namespaces (BullMQ / Asynchronous Workers)
  public static readonly QUEUE_BULL_EMAIL = "queue:bull:email:";
  public static readonly QUEUE_BULL_SMS = "queue:bull:sms:";

  // ── Structured Namespace Builders ─────────────────────────────────────────────
  public static readonly security = {
    blacklist: (tokenHash: string) => `security:jwt:blacklist:${tokenHash}`,
    otp: (identifier: string) => `security:otp:${identifier}`,
    otpAttempts: (identifier: string) => `security:otp:${identifier}:attempts`,
    preAuth: (tokenHash: string) => `security:preauth:${tokenHash}`,
    rlIpLogin: (ip: string) => `security:rl:ip:login:${ip}`,
    rlUserLogin: (userId: string) => `security:rl:user:login:${userId}`,
    rlDevice: (deviceId: string) => `security:rl:device:${deviceId}`,
    rlOtp: (identifier: string) => `security:rl:otp:${identifier}`,
    rlPassword: (identifier: string) => `security:rl:password:${identifier}`,
    ratelimit: (endpoint: string, target: string) => `security:ratelimit:${endpoint}:${target}`,
  };

  public static readonly session = {
    user: (userId: string) => `session:user:${userId}`,
    tokenVersion: (userId: string) => `session:user:tokenVersion:${userId}`,
  };

  public static readonly cache = {
    property: (id: string) => `cache:properties:${id}`,
    propertiesList: (filter: string = "all") => `cache:properties:list:${filter}`,
    route: (path: string) => `cache:routes:${path}`,
    lock: (resource: string) => `lock:cache:${resource}`,
  };

  public static readonly lock = {
    cache: (resource: string) => `lock:cache:${resource}`,
    mutex: (key: string) => `lock:mutex:${key}`,
  };

  public static readonly queue = {
    email: (jobId: string) => `queue:bull:email:${jobId}`,
    sms: (jobId: string) => `queue:bull:sms:${jobId}`,
  };

  public static readonly socket = {
    user: (userId: string) => `socket:user:${userId}`,
  };

  // ── Legacy Static Helpers for Backward Compatibility ──────────────────────────
  public static queueBullEmailKey(jobId: string): string {
    return `${RedisNamespace.QUEUE_BULL_EMAIL}${jobId}`;
  }

  public static queueBullSmsKey(jobId: string): string {
    return `${RedisNamespace.QUEUE_BULL_SMS}${jobId}`;
  }

  public static jwtBlacklistKey(tokenHash: string): string {
    return `${RedisNamespace.SECURITY_JWT_BLACKLIST}${tokenHash}`;
  }

  public static otpKey(identifier: string): string {
    return `${RedisNamespace.SECURITY_OTP}${identifier}`;
  }

  public static otpAttemptsKey(identifier: string): string {
    return `${RedisNamespace.SECURITY_OTP}${identifier}:attempts`;
  }

  public static preAuthKey(tokenHash: string): string {
    return `${RedisNamespace.SECURITY_PREAUTH}${tokenHash}`;
  }

  public static rateLimitKey(endpoint: string, target: string): string {
    return `${RedisNamespace.SECURITY_RATELIMIT}${endpoint}:${target}`;
  }

  public static userTokenVersionKey(userId: string): string {
    return `${RedisNamespace.SESSION_TOKEN_VERSION}${userId}`;
  }

  public static cachePropertiesListKey(filterString: string = 'all'): string {
    return `${RedisNamespace.CACHE_PREFIX}properties:list:${filterString}`;
  }

  public static cacheLockKey(resource: string): string {
    return `${RedisNamespace.CACHE_LOCK}${resource}`;
  }
}
