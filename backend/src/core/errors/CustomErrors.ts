export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

export class ValidationError extends AppError {
  public readonly errors: any[];
  constructor(message: string, errors: any[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class TenantAccessError extends AppError {
  constructor(message = 'Cross-tenant data access prohibited') {
    super(message, 403, 'TENANT_ACCESS_DENIED');
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message = 'This account has been suspended. Please contact support.') {
    super(message, 403, 'AUTH_ACCOUNT_SUSPENDED');
  }
}

export class AccountInactiveError extends AppError {
  constructor(message = 'This account is inactive. Please contact support or sign up again.') {
    super(message, 403, 'AUTH_ACCOUNT_DEACTIVATED');
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "We couldn't find an account with these details. Would you like to sign up instead?") {
    super(message, 401, 'ACCOUNT_NOT_FOUND_OR_INVALID');
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(message, 401, 'SESSION_EXPIRED');
  }
}
