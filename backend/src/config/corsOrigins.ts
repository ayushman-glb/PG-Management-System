import { CorsOptions } from "cors";
import { env } from "./env";

/**
 * Enterprise Cross-Origin Resource Sharing (CORS) Configuration
 * 
 * Single source of truth for allowed origins across Express REST API and Socket.IO servers.
 */
export const getRawAllowedOrigins = (): string[] => [
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
  env.CLIENT_URL,
  env.FRONTEND_URL,
  "https://ayushman-glb.github.io",
  "https://ayushman-glb.github.io/PG-Management-System",
  "https://pg-management-system-boxb.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

export const getAllowedOrigins = (): string[] => {
  const raw = getRawAllowedOrigins();
  return Array.from(
    new Set(
      raw
        .filter(Boolean)
        .map((item) => {
          const trimmed = item.trim();
          if (!trimmed) return "";
          try {
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
              return new URL(trimmed).origin.toLowerCase();
            }
            return trimmed.replace(/\/$/, "").toLowerCase();
          } catch {
            return trimmed.replace(/\/$/, "").toLowerCase();
          }
        })
        .filter(Boolean),
    ),
  );
};

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  let cleanOrigin = origin.trim().replace(/\/$/, "").toLowerCase();
  try {
    if (cleanOrigin.startsWith("http://") || cleanOrigin.startsWith("https://")) {
      cleanOrigin = new URL(cleanOrigin).origin.toLowerCase();
    }
  } catch {
    // fallback to trimmed
  }

  // 1. In development, allow any localhost / 127.0.0.1 port
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(cleanOrigin);
  if ((env.NODE_ENV || "development") === "development" && isLocalhost) {
    return true;
  }

  // 2. Dynamic subdomain pattern matching for trusted cloud deployment platforms
  const isRenderSubdomain = /^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(cleanOrigin);
  const isGitHubPages = /^https:\/\/[a-z0-9-]+\.github\.io$/.test(cleanOrigin);
  const isVercelSubdomain = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(cleanOrigin);
  const isNetlifySubdomain = /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(cleanOrigin);

  const allowed = getAllowedOrigins();
  return (
    allowed.includes(cleanOrigin) ||
    isLocalhost ||
    isRenderSubdomain ||
    isGitHubPages ||
    isVercelSubdomain ||
    isNetlifySubdomain
  );
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Return callback(null, false) to avoid crashing preflight with Express 500 error
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Visitor-Id",
    "X-Correlation-ID",
    "X-Request-ID",
    "X-CSRF-Token",
    "x-csrf-token",
    "Accept",
    "Idempotency-Key",
    "x-idempotency-key",
  ],
  exposedHeaders: [
    "X-Correlation-ID",
    "X-Request-ID",
    "X-CSRF-Token",
    "x-csrf-token",
    "Set-Cookie",
    "X-Idempotency-Hit",
  ],
  optionsSuccessStatus: 204,
};
