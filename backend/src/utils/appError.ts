import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode: string;
  public userFriendlyMessage?: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR', userFriendlyMessage?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    this.userFriendlyMessage = userFriendlyMessage;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ZeroTrustSecurityError extends AppError {
  constructor(message: string = 'Security context validation failed') {
    super(message, 403, 'SECURITY_VALIDATION_FAILED', 'Security context validation failed. Access restricted.');
  }
}

export class ConcurrencyLockError extends AppError {
  constructor(message: string = 'Resource is currently locked by another process') {
    super(message, 409, 'CONCURRENCY_LOCK_FAILED', 'This room/bed was just modified by another user. Please refresh and try again.');
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor(message: string = 'Database connection timed out or unavailable') {
    super(message, 503, 'DATABASE_UNAVAILABLE', 'Looks like your connection took a coffee break ☕. Please try again in a moment.');
  }
}

export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
