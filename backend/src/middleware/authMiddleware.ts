import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { Role } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';
import { tokenBlacklistService } from '../services/tokenBlacklistService';
import { Container } from '../container';
import { TokenVersionService } from '../services/security/TokenVersionService';
import { KycAuthorizationService } from '../services/security/KycAuthorizationService';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  residentCode?: string | null;
  name?: string;
  avatarUrl?: string | null;
  googleSubId?: string | null;
  tokenVersion?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    logger.warn("Auth Warning: No token provided on request", { path: `${req.method} ${req.originalUrl}` });
    return next(new AppError('Authentication token required.', 401, 'TOKEN_REQUIRED'));
  }

  const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
  if (isBlacklisted) {
    logger.warn("Auth Warning: Blacklisted token presented", { path: `${req.method} ${req.originalUrl}` });
    return next(new AppError('Authentication token has been revoked. Please log in again.', 401, 'TOKEN_INVALIDATED'));
  }

  try {
    // Use the singleton JwtTokenService — validated secrets, not raw process.env fallback
    const decoded = Container.tokenService.verifyAccessToken(token) as any;

    if (decoded.role === Role.PUBLIC || decoded.role === 'PUBLIC') {
      return next(new AppError('Permission denied. Invalid role.', 403, 'FORBIDDEN'));
    }

    // Verify tokenVersion and user account status against database if decoded.id exists
    if (decoded.id) {
      let dbUser: any = null;
      try {
        dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            role: true,
            residentCode: true,
            name: true,
            avatarUrl: true,
            tokenVersion: true,
            accountStatus: true,
            emailVerified: true
          }
        });
      } catch (dbErr) {
        logger.debug("DB user lookup skipped in middleware", { error: dbErr });
      }

      if (!dbUser && process.env.NODE_ENV !== 'test') {
        return next(new AppError('User account no longer exists.', 401, 'ACCOUNT_NOT_FOUND'));
      }

      if (dbUser) {
        if (dbUser.accountStatus !== 'ACTIVE') {
          return next(new AppError('This account has been deactivated.', 403, 'ACCOUNT_INACTIVE'));
        }

        const isVersionValid = await TokenVersionService.isValidTokenVersion(dbUser.id, decoded.tokenVersion);
        if (!isVersionValid) {
          return next(new AppError('Authentication token has been revoked. Please log in again.', 401, 'TOKEN_INVALIDATED'));
        }

        if (dbUser.role === Role.PUBLIC) {
          return next(new AppError('Permission denied. Invalid role.', 403, 'FORBIDDEN'));
        }

        const isVerificationRoute = req.originalUrl.includes('/verify-') || req.originalUrl.includes('/send-') || req.originalUrl.includes('/logout') || req.originalUrl.includes('/me');
        if (dbUser.emailVerified === false && !isVerificationRoute) {
          return next(new AppError('Please verify your email address before continuing.', 403, 'ACCOUNT_UNVERIFIED'));
        }

        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          residentCode: dbUser.residentCode,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
          tokenVersion: dbUser.tokenVersion,
        };
      } else {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          residentCode: decoded.residentCode,
          tokenVersion: decoded.tokenVersion,
        };
      }
    } else {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        residentCode: decoded.residentCode,
        tokenVersion: decoded.tokenVersion,
      };
    }

    // Set Cache-Control header to instruct CDN edge caches (Cloudflare/Render) never to store personalized user responses
    res.setHeader("Cache-Control", "private, no-store");

    next();
  } catch (err: any) {
    logger.error("Auth verification failed", { path: `${req.method} ${req.originalUrl}`, errorType: err.name, message: err.message });
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please refresh session.', 401, 'TOKEN_EXPIRED'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token signature.', 401, 'INVALID_TOKEN'));
    }
    return next(new AppError(`Authentication token verification failed: ${err.message}`, 401, 'AUTH_FAILED'));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Permission denied. Access unauthorized for your role.', 403, 'FORBIDDEN'));
    }
    next();
  };
};

export const requireRole = authorize;

/**
 * Middleware: Enforces KYC approval for financial and public property management actions.
 * Blocks unverified owners while allowing standard dashboard access and read-only navigation.
 * Uses KycAuthorizationService as the single authoritative source of truth.
 */
export const requireKycApproved = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'TOKEN_REQUIRED'));
  }

  // Admins and Super Admins bypass KYC gate
  if (req.user.role === Role.ADMIN || req.user.role === Role.SUPER_ADMIN) {
    return next();
  }

  // Only Owners are subject to Owner KYC review gate
  if (req.user.role !== Role.OWNER) {
    return next();
  }

  try {
    const isApproved = await KycAuthorizationService.isOwnerKycApproved(req.user.id);

    if (!isApproved) {
      return next(
        new AppError(
          'Your account KYC is currently pending review. Property listing and financial actions will be unlocked once your KYC is approved.',
          403,
          'KYC_PENDING_REVIEW'
        )
      );
    }
    next();
  } catch (err: any) {
    logger.error('Error verifying KYC status in middleware', { error: err.message });
    return next(
      new AppError(
        'Unable to verify account KYC status at this time. Please try again later.',
        500,
        'KYC_CHECK_FAILED'
      )
    );
  }
};
