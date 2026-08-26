import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const resolveClientIp = (req: Request): string => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
};

const createLimiter = (
  windowMs: number,
  max: number,
  message: string,
  code: string = 'TOO_MANY_REQUESTS'
) => {
  const limiter = rateLimit({
    windowMs,
    max,
    skip: () => process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true',
    standardHeaders: true,
    legacyHeaders: true,
    statusCode: 429,
    validate: {
      trustProxy: false,
      xForwardedForHeader: false,
      default: false,
    },
    keyGenerator: (req) => resolveClientIp(req),
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
        error: {
          code,
          message,
        },
      });
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      return limiter(req, res, next);
    } catch (err: any) {
      logger.error('RATE_LIMITER_CONFIG_ERROR: Rate limiter caught exception', {
        code,
        error: err?.message,
        ip: resolveClientIp(req),
      });
      return next();
    }
  };
};

export const generalLimiter = createLimiter(
  15 * 60 * 1000,
  500,
  'Too many requests from this IP, please try again after 15 minutes.',
  'TOO_MANY_REQUESTS'
);

export const loginLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many login attempts. Please try again after 15 minutes.',
  'LOGIN_RATE_EXCEEDED'
);

export const registerLimiter = createLimiter(
  60 * 60 * 1000,
  50,
  'Too many registration attempts. Please try again after 1 hour.',
  'REGISTRATION_RATE_EXCEEDED'
);

export const sendOtpLimiter = createLimiter(
  10 * 60 * 1000,
  30,
  'Too many OTP requests. Please wait 10 minutes before requesting again.',
  'SEND_OTP_RATE_EXCEEDED'
);

export const resendOtpLimiter = createLimiter(
  60 * 60 * 1000,
  50,
  'Too many OTP resend attempts. Please wait 1 hour.',
  'RESEND_OTP_RATE_EXCEEDED'
);

export const verifyOtpLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many verification attempts. Account locked temporarily for security.',
  'VERIFY_OTP_RATE_EXCEEDED'
);

export const sendEmailCodeLimiter = createLimiter(
  10 * 60 * 1000,
  30,
  'Too many email verification code requests. Please wait 10 minutes.',
  'SEND_EMAIL_CODE_RATE_EXCEEDED'
);

export const verifyEmailCodeLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many email verification attempts.',
  'VERIFY_EMAIL_RATE_EXCEEDED'
);

export const uploadLimiter = createLimiter(
  60 * 60 * 1000,
  100,
  'Upload limit reached for this IP. Please wait before uploading more files.',
  'UPLOAD_RATE_EXCEEDED'
);

export const authLimiter = loginLimiter;
export const phoneVerifyLimiter = verifyOtpLimiter;

export const refreshTokenLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many token refresh attempts. Please try again after 15 minutes.',
  'REFRESH_RATE_EXCEEDED'
);

export const soapBillingLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many SOAP billing requests. Please try again after 15 minutes.',
  'SOAP_BILLING_RATE_EXCEEDED'
);

export const csrfBootstrapLimiter = createLimiter(
  15 * 60 * 1000,
  200,
  'Too many CSRF bootstrap requests. Please try again after 15 minutes.',
  'CSRF_RATE_EXCEEDED'
);

export const searchAutocompleteLimiter = createLimiter(
  1 * 60 * 1000,
  120,
  'Too many location autocomplete requests. Please slow down.',
  'AUTOCOMPLETE_RATE_EXCEEDED'
);

export const propertySearchLimiter = createLimiter(
  1 * 60 * 1000,
  60,
  'Too many property search requests. Please slow down.',
  'SEARCH_RATE_EXCEEDED'
);

