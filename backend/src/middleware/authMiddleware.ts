import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { Container } from '../container';
import { Role } from '@prisma/client';

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
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return next(new AppError('Authentication token required.', 401));
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
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Permission denied. Access unauthorized for your role.', 403));
    }
    next();
  };
};
