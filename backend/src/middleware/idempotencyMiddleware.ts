import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

interface CachedResponse {
  statusCode: number;
  body: any;
  expiresAt: number;
}

const idempotencyStore = new Map<string, CachedResponse>();

// Periodic memory purge every 15 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of idempotencyStore.entries()) {
    if (v.expiresAt < now) idempotencyStore.delete(k);
  }
}, 15 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

  // 1. Check in-memory store
  const existing = idempotencyStore.get(idempotencyKey);
  if (existing && existing.expiresAt > Date.now()) {
    logger.info('Idempotency cache hit, returning saved response', {
      key: idempotencyKey,
      route: req.originalUrl,
    });

    res.setHeader('X-Idempotency-Hit', 'true');
    res.status(existing.statusCode).json(existing.body);
    return;
  }

  // 2. Check database store if configured
  if ((prisma as any).idempotencyRequest?.findUnique) {
    try {
      const dbRecord = await (prisma as any).idempotencyRequest.findUnique({
        where: { key: idempotencyKey },
      });

      if (dbRecord) {
        res.setHeader('X-Idempotency-Hit', 'true');
        res.status(dbRecord.statusCode || 200).json(dbRecord.response || dbRecord.body);
        return;
      }
    } catch {
      // Non-blocking fallback
    }
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(idempotencyKey, {
        statusCode: res.statusCode,
        body,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      if ((prisma as any).idempotencyRequest?.create) {
        (prisma as any).idempotencyRequest.create({
          data: {
            key: idempotencyKey,
            statusCode: res.statusCode,
            response: body,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        }).catch(() => {});
      }
    }
    return originalJson(body);
  };

  return next();
};
