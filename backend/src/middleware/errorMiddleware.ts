import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
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
  const correlationId = (req.headers['x-correlation-id'] as string) || (res.getHeader('x-correlation-id') as string) || 'unknown';
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Server-side trace logging with Correlation ID
  if (env.NODE_ENV === 'production') {
    logger.error(`[${correlationId}] Error on ${req.method} ${req.originalUrl}: [${err?.name || 'Error'}] ${message}`, {
      correlationId,
      path: req.originalUrl,
      method: req.method,
      code: err.code || err.errorCode,
    });
  } else {
    logger.error(`[${correlationId}] Error on ${req.method} ${req.originalUrl}:`, err);
  }

  // 1. AppError (Domain & Business Logic Exceptions)
  if (err instanceof AppError) {
    const action = err.statusCode === 401 ? (err.errorCode === 'TOKEN_EXPIRED' ? 'refresh' : 'login') : err.statusCode === 403 ? 'contact_admin' : 'retry';
    return ApiResponse.error(res, err.message, [], err.statusCode, err.errorCode, action);
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.error(res, 'Validation failed: Invalid request payload', errors, 400, 'VALIDATION_ERROR', 'check_input');
  }

  // 3. Express / Body Parser JSON Syntax Errors
  if (err instanceof SyntaxError && 'body' in err && statusCode === 400) {
    return ApiResponse.error(res, 'Malformed JSON payload syntax', [], 400, 'INVALID_JSON', 'check_payload_format');
  }

  // 4. Prisma Specific Error Codes
  if (err.code === 'P2002') {
    return ApiResponse.error(res, 'A record with this unique field already exists.', [err.meta], 409, 'DUPLICATE_ENTRY', 'check_unique_fields');
  }
  if (err.code === 'P2025') {
    return ApiResponse.error(res, 'Requested resource was not found.', [], 404, 'NOT_FOUND', 'verify_resource_id');
  }
  if (err.code === 'P2003') {
    return ApiResponse.error(res, 'Database foreign key reference violation.', [], 400, 'FOREIGN_KEY_VIOLATION', 'check_relations');
  }
  if (err.code === 'P2023') {
    return ApiResponse.error(res, 'Malformed or invalid database identifier format provided.', [], 400, 'INVALID_IDENTIFIER', 'verify_resource_id');
  }

  // 5. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token signature.', [], 401, 'INVALID_TOKEN', 'login');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired. Please refresh session.', [], 401, 'TOKEN_EXPIRED', 'refresh');
  }

  // 6. Multer File Upload Errors
  if (err.name === 'MulterError') {
    return ApiResponse.error(res, `File upload error [Multer]: ${err.message}`, [], 400, 'MULTIPART_ERROR', 'check_form_field');
  }

  // 7. Generic / Unrecognized Exceptions Fallback (Always standard envelope, never raw Express HTML)
  return ApiResponse.error(
    res,
    env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message,
    [],
    statusCode,
    'INTERNAL_SERVER_ERROR',
    'retry'
  );
};
