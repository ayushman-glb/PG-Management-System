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

  // In production: log message only (no stack). In development: log full error object.
  if (env.NODE_ENV === 'production') {
    logger.error(`Error on ${req.method} ${req.originalUrl}: [${err?.name || 'Error'}] ${err?.message}`);
  } else {
    logger.error(`Error on ${req.method} ${req.originalUrl}:`, err);
  }

  if (err instanceof AppError) {
    const action = err.statusCode === 401 ? (err.errorCode === 'TOKEN_EXPIRED' ? 'refresh' : 'login') : err.statusCode === 403 ? 'contact_admin' : 'retry';
    return ApiResponse.error(res, err.message, [], err.statusCode, err.errorCode, action);
  }

  // Prisma or Mongoose specific errors
  if (err.code === 'P2002') {
    return ApiResponse.error(res, 'A record with this unique field already exists.', [err.meta], 409, 'DUPLICATE_ENTRY', 'check_unique_fields');
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token signature.', [], 401, 'INVALID_TOKEN', 'login');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired. Please refresh session.', [], 401, 'TOKEN_EXPIRED', 'refresh');
  }

  if (err.name === 'MulterError') {
    return ApiResponse.error(res, `File upload error [Multer]: ${err.message}`, [], 400, 'MULTIPART_ERROR', 'check_form_field');
  }

  return ApiResponse.error(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    [],
    err.statusCode,
    'INTERNAL_SERVER_ERROR',
    'retry'
  );
};
