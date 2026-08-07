import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { Container } from '../container';
import { Role } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    residentCode?: string | null;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // SECURITY: JWT tokens must NEVER be accepted via URL query parameters.
  // Tokens in URLs get logged by servers, stored in browser history, and
  // leaked in Referer headers. All clients must use Authorization header.

  if (!token) {
    logger.warn("Auth Warning: No token provided on request", { path: `${req.method} ${req.originalUrl}` });
    return next(new AppError('Authentication token required.', 401, 'TOKEN_REQUIRED'));
  }

  try {
    const decoded = Container.tokenService.verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as Role,
      residentCode: decoded.residentCode
    };
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
