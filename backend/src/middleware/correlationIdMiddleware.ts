import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
  requestId?: string;
}

/**
 * Correlation & Request ID middleware for end-to-end distributed tracing.
 */
export const correlationIdMiddleware = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    `req_${crypto.randomBytes(16).toString('hex')}`;

  req.correlationId = correlationId;
  req.requestId = correlationId;

  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', correlationId);

  next();
};
