import { CorsOptions } from "cors";
import { env } from "./env";

/**
 * Enterprise Cross-Origin Resource Sharing (CORS) Configuration
 * 
 * Strict, explicit allow-list for cross-origin credentials to prevent
 * cross-site data theft and CSRF from multi-tenant hosting platforms.
 */
export const getRawAllowedOrigins = (): string[] => [
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
  env.CLIENT_URL,
  env.FRONTEND_URL,
  "https://ayushman-glb.github.io",
  "https://pg-management-system-boxb.onrender.com",
  ...(env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
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

  // 1. In development, allow localhost / 127.0.0.1 on any port
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(cleanOrigin);
  if ((env.NODE_ENV || "development") !== "production" && isLocalhost) {
    return true;
  }

  const allowed = getAllowedOrigins();
  return allowed.includes(cleanOrigin);
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Return callback(null, false) to reject unallowed origin safely
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
