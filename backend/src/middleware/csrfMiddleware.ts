import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Endpoints exempt from CSRF validation (OAuth callbacks, webhooks).
// NOTE: /refresh-token is intentionally NOT exempt — it is cookie-authenticated
// and state-changing (token rotation), making it exactly the kind of endpoint
// CSRF protection is designed to defend. See Section 1 of csrf-jwks-risk-fix-log.
const CSRF_EXEMPT_PATHS = [
  '/api/v1/auth/google',
  '/api/v1/auth/google/callback',
  '/api/v1/payments/webhook',
  '/api/v1/payments/razorpay/webhook',
  '/api/v1/soap',
  '/.well-known',
];

/**
 * Generates an HMAC-signed CSRF token.
 * Token format: <32-byte-hex-random>.<hmac-sha256-signature>
 */
export const createSignedCsrfToken = (): string => {
  const raw = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', env.CSRF_SECRET)
    .update(raw)
    .digest('hex');
  return `${raw}.${signature}`;
};

/**
 * Validates the HMAC signature of a CSRF token using constant-time comparison.
 */
export const verifyCsrfTokenSignature = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  // Must strictly be signed tokens (<raw>.<signature>)
  if (parts.length === 2) {
    const [raw, signature] = parts;
    if (!raw || !signature) return false;
    const expectedSig = crypto
      .createHmac('sha256', env.CSRF_SECRET)
      .update(raw)
      .digest('hex');
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }
  return false;
};

/**
 * Generates a signed CSRF token and attaches it to response cookie & headers.
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token || !verifyCsrfTokenSignature(token)) {
    token = createSignedCsrfToken();
    const isProduction = env.NODE_ENV === 'production';
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by client JS to inject into header
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
  res.setHeader(CSRF_HEADER_NAME, token);
  next();
};

/**
 * Validates Double Submit CSRF token for state-mutating requests (POST, PUT, PATCH, DELETE).
 * - Enforces CSRF on cookie-dependent auth endpoints (register, login, logout, logout-all).
 * - Bypasses pure Bearer-token authenticated API requests.
 * - Exempts refresh-token and webhooks.
 */
export const validateCsrf = (req: Request, res: Response, next: NextFunction): void => {
  // Only validate state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check if path is exempt
  const isExempt = CSRF_EXEMPT_PATHS.some((path) => req.path.startsWith(path) || req.originalUrl?.startsWith(path));
  if (isExempt) {
    return next();
  }

  // Pure Bearer Token authenticated API requests do not require CSRF
  const authHeader = req.headers.authorization;
  const isBearerAuth = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
  const isAuthEntrypoint = req.path.includes('/auth/register') ||
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/logout') ||
    req.path.includes('/auth/logout-all');

  if (isBearerAuth && !isAuthEntrypoint) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers[CSRF_HEADER_NAME.toLowerCase()];

  if (!cookieToken || !headerToken || typeof headerToken !== 'string') {
    res.status(403).json({
      success: false,
      message: 'CSRF token missing or invalid',
      error: {
        code: 'CSRF_MISSING',
        message: 'A valid CSRF token must be provided via the x-csrf-token header',
        action: 'retry',
      },
    });
    return;
  }

  try {
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);

    if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
      res.status(403).json({
        success: false,
        message: 'CSRF token mismatch',
        error: {
          code: 'CSRF_INVALID',
          message: 'Supplied CSRF header does not match session cookie',
          action: 'retry',
        },
      });
      return;
    }

    if (!verifyCsrfTokenSignature(cookieToken)) {
      res.status(403).json({
        success: false,
        message: 'CSRF token signature invalid',
        error: {
          code: 'CSRF_SIGNATURE_INVALID',
          message: 'CSRF token failed cryptographic HMAC verification',
          action: 'retry',
        },
      });
      return;
    }
  } catch {
    res.status(403).json({
      success: false,
      message: 'CSRF validation error',
      error: {
        code: 'CSRF_ERROR',
        message: 'Error verifying CSRF token',
        action: 'retry',
      },
    });
    return;
  }

  next();
};

