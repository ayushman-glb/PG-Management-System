import { Request, Response, NextFunction } from "express";
import { cacheService } from "../services/cache.service";
import { logger } from "../utils/logger";
import { AuthRequest } from "./authMiddleware";

export interface CacheOptions {
  ttlSeconds?: number;
  keyPrefix?: string;
}

/**
 * Route Caching Middleware
 * Automatically caches JSON responses for GET requests.
 * Incorporates authenticated user ID into cache key for private endpoints.
 * Honours X-Cache-Bypass or Cache-Control: no-cache headers.
 */
export function cacheRoute(ttlSeconds: number = 300, keyPrefix: string = "route:") {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Check cache bypass headers
    const bypassHeader = req.headers["x-cache-bypass"];
    const cacheControlHeader = req.headers["cache-control"];
    if (bypassHeader === "true" || (typeof cacheControlHeader === "string" && cacheControlHeader.includes("no-cache"))) {
      res.setHeader("X-Cache", "BYPASS");
      return next();
    }

    // Build unique cache key
    const userId = req.user?.id ? `user:${req.user.id}:` : "anon:";
    const cleanUrl = req.originalUrl || req.url;
    const cacheKey = `${keyPrefix}${userId}${cleanUrl}`;

    try {
      const cachedResponse = await cacheService.get<any>(cacheKey);
      if (cachedResponse !== null && cachedResponse !== undefined) {
        res.setHeader("X-Cache", "HIT");
        return res.status(200).json(cachedResponse);
      }
    } catch (err: any) {
      logger.warn("Route cache read error", { cacheKey, error: err.message });
    }

    res.setHeader("X-Cache", "MISS");

    // Intercept res.json to capture response body before sending
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode === 200 && body && body.success !== false) {
        cacheService.set(cacheKey, body, ttlSeconds).catch((err) => {
          logger.warn("Route cache write error", { cacheKey, error: err.message });
        });
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Helper middleware to invalidate cache keys by pattern upon mutating operations (POST, PUT, PATCH, DELETE)
 */
export function invalidateCachePattern(pattern: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.invalidatePattern(pattern).catch((err) => {
          logger.warn("Cache invalidation pattern error", { pattern, error: err.message });
        });
      }
    });
    next();
  };
}
