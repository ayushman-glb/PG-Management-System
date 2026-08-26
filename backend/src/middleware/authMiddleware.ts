import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError, UnauthorizedError, ForbiddenError } from '../core/errors/CustomErrors';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export type AuthRequest = Request;

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization || (req.headers as any)['Authorization'] || (req.headers as any)['AUTHORIZATION'];
  if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication token required.', 'NO_ACCESS_TOKEN'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return next(new UnauthorizedError('Invalid token payload.', 'TOKEN_INVALID'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
        isSuspended: true,
        isActive: true,
      },
    });

    if (!user) {
      return next(new UnauthorizedError('User account associated with token not found.', 'USER_NOT_FOUND'));
    }

    if (user.isSuspended || !user.isActive) {
      return next(new UnauthorizedError('Account is inactive or suspended.', 'ACCOUNT_INACTIVE'));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new UnauthorizedError('Session has been revoked. Please sign in again.', 'SESSION_INVALID'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired.', 'TOKEN_EXPIRED'));
    }
    return next(new UnauthorizedError('Invalid token signature.', 'TOKEN_INVALID'));
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError('Authentication required.', 'NO_ACCESS_TOKEN'));
    }

    if (!roles.includes(user.role)) {
      return next(new ForbiddenError(`Access denied. Requires one of roles: [${roles.join(', ')}]`));
    }

    return next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireOwner = requireRole(Role.PG_OWNER);
export const requireResident = requireRole(Role.RESIDENT);
