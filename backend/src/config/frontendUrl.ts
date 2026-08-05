import { Request } from 'express';
import { env } from './env';

const PROD_GITHUB_PAGES_BASE = 'https://ayushman-glb.github.io/PG-Management-System';
const DEV_LOCAL_BASE = 'http://localhost:5173';

/**
 * Resolves the canonical frontend URL for OAuth redirects and CORS origins.
 * Guarantees that GitHub Pages subpath '/PG-Management-System' is NEVER stripped
 * by browser referrer header policies (e.g. strict-origin-when-cross-origin).
 */
export function resolveFrontendUrl(req?: Request, overrideUrl?: string): string {
  // 1. Direct explicit override if valid
  if (overrideUrl && typeof overrideUrl === 'string') {
    return normalizeFrontendUrl(overrideUrl);
  }

  // 2. Inspect request Referer / Origin header if present
  if (req) {
    const rawHeader = req.headers?.referer || req.headers?.origin;
    if (rawHeader && typeof rawHeader === 'string') {
      try {
        const parsed = new URL(rawHeader);
        // Handle local development hosts
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return `${parsed.protocol}//${parsed.host}`;
        }
        // Handle GitHub Pages production host
        if (parsed.hostname === 'ayushman-glb.github.io') {
          return PROD_GITHUB_PAGES_BASE;
        }
        // Any other custom production domain
        const cleanPath = parsed.pathname.replace(/\/$/, '');
        return `${parsed.protocol}//${parsed.host}${cleanPath}`;
      } catch {
        // Fall through on URL parse error
      }
    }
  }

  // 3. Fallback to configured environment variables
  const configuredUrl = env.FRONTEND_URL || env.CLIENT_URL;
  if (configuredUrl) {
    return normalizeFrontendUrl(configuredUrl);
  }

  // 4. Default environment fallback
  return env.NODE_ENV === 'production' ? PROD_GITHUB_PAGES_BASE : DEV_LOCAL_BASE;
}

/**
 * Normalizes frontend URLs to ensure correct repository subpathing
 */
export function normalizeFrontendUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return env.NODE_ENV === 'production' ? PROD_GITHUB_PAGES_BASE : DEV_LOCAL_BASE;
  }

  const clean = rawUrl.trim().replace(/\/$/, '');

  // Ensure ayushman-glb.github.io includes /PG-Management-System
  if (clean.includes('ayushman-glb.github.io') && !clean.includes('PG-Management-System')) {
    return `${clean}/PG-Management-System`;
  }

  return clean;
}
