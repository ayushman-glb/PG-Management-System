import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  logger.error(`Error on ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, [], err.statusCode);
  }

  // Prisma or Mongoose specific errors
  if (err.code === 'P2002') {
    return ApiResponse.error(res, 'A record with this unique field already exists.', [err.meta], 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token.', [], 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired.', [], 401);
  }

  return ApiResponse.error(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    [],
    err.statusCode
  );
};
