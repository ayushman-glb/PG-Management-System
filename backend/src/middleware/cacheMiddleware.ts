import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { AuthRequest } from "./authMiddleware";

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

let routeCacheHits = 0;
let routeCacheMisses = 0;
let routeCacheBypasses = 0;

export function getRouteCacheStats() {
  const total = routeCacheHits + routeCacheMisses;
  const hitRatePercent = total > 0 ? parseFloat(((routeCacheHits / total) * 100).toFixed(2)) : 0;
  return {
    hits: routeCacheHits,
    misses: routeCacheMisses,
    bypasses: routeCacheBypasses,
    totalRequests: total + routeCacheBypasses,
    hitRatePercent,
  };
}

export function cacheRoute(ttlSeconds: number = 300, keyPrefix: string = "route:") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const bypass = req.headers["x-cache-bypass"] || req.headers["cache-control"] === "no-cache";
    if (bypass) {
      routeCacheBypasses++;
      return next();
    }

    const userId = (req as AuthRequest).user?.id || "anon";
    const cacheKey = `${keyPrefix}${userId}:${req.originalUrl}`;

    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      routeCacheHits++;
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached.data);
    }

    routeCacheMisses++;
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(cacheKey, {
          data: body,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}
