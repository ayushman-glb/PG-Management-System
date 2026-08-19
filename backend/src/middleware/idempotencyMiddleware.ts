import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

/**
 * Idempotency Middleware for Financial & Mutating Transactions
 * 
 * Supports `Idempotency-Key` or `x-idempotency-key` HTTP header.
 * If a request with the same idempotency key was previously processed,
 * returns the cached response with identical status code.
 */
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only process state-changing HTTP methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!rawKey || typeof rawKey !== 'string') {
    return next();
  }

  const idempotencyKey = rawKey.trim();
  if (idempotencyKey.length < 8) {
    return next();
  }

  try {
    const existing = await prisma.idempotencyRequest.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      logger.info('Idempotency cache hit, returning saved response', {
        key: idempotencyKey,
        route: req.originalUrl,
      });

      res.setHeader('X-Idempotency-Hit', 'true');
      res.status(existing.statusCode).json(existing.response);
      return;
    }

    // Intercept res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Only cache successful or client-accepted operations (200, 201, 202)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = (req as any).user?.id || null;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours retention

        prisma.idempotencyRequest
          .create({
            data: {
              key: idempotencyKey,
              route: req.originalUrl || req.path,
              userId,
              statusCode: res.statusCode,
              response: body,
              expiresAt,
            },
          })
          .catch((err) => {
            logger.warn('Failed to save idempotency record', {
              key: idempotencyKey,
              error: err.message,
            });
          });
      }

      return originalJson(body);
    };

    next();
  } catch (error: any) {
    logger.warn('Idempotency middleware lookup error, proceeding normally', {
      error: error.message,
    });
    next();
  }
};
