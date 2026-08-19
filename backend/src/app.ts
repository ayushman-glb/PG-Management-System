import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { pingRedis, isRedisReady, getRedisKeyEstimates } from "./config/redis";
import { getRouteCacheStats } from "./middleware/cacheMiddleware";
import { getSmtpHealth } from "./modules/email";
import { swaggerSpec } from "./config/swagger";
import apiRouter from "./routes/apiRouter";
import { globalErrorHandler } from "./middleware/errorMiddleware";
import { generalLimiter, soapBillingLimiter } from "./middleware/rateLimiter";
import { correlationIdMiddleware } from "./middleware/correlationMiddleware";
import { setupSoapServer, soapBillingAuthMiddleware, soapXxePreFilter } from "./services/soapService";
import { APP_INFO, PathResolver } from "./utils/pathResolver";
import passport from "./config/passport";
import { JwksService } from "./services/security/JwksService";
import { idempotencyMiddleware } from "./middleware/idempotencyMiddleware";

export const app = express();

// Trust proxy setting when deployed behind Render / Cloudflare reverse proxies
app.set("trust proxy", 1);

// ── 1. CORS Middleware (MUST BE REGISTERED FIRST BEFORE HELMET / AUTH / OTHER MIDDLEWARES) ──
const rawOrigins = [
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
  env.CLIENT_URL,
  env.FRONTEND_URL,
  "https://ayushman-glb.github.io",
  "https://pg-management-system-boxb.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const allowedOrigins = Array.from(
  new Set(
    rawOrigins
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
      .filter(Boolean)
  )
);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "").toLowerCase();

    // In development or local testing, allow any localhost/127.0.0.1 port
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(cleanOrigin);
    if ((env.NODE_ENV || "development") === "development" && isLocalhost) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.includes(cleanOrigin) || isLocalhost;
    if (isAllowed) {
      return callback(null, true);
    }
    // Return callback(null, false) instead of passing an Error to avoid triggering Express 500 error handler
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Visitor-Id", "X-Correlation-ID", "X-Request-ID", "X-CSRF-Token", "Accept"],
  exposedHeaders: ["X-Correlation-ID", "X-Request-ID", "X-CSRF-Token", "Set-Cookie"],
  optionsSuccessStatus: 204,
});

app.use(corsMiddleware);
app.options("*", corsMiddleware);

// Correlation ID & Distributed Tracing
app.use(correlationIdMiddleware);

// Security & Optimization Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());

// ── NoSQL Injection Prevention ────────────────────────────────────────────────
// Strips keys that begin with '$' or contain '.' from req.body, req.query, req.params.
// Provides defense-in-depth even though Prisma parameterises most queries.
app.use(mongoSanitize({ allowDots: false, replaceWith: '_' }));

// ── HTTP Parameter Pollution Prevention ───────────────────────────────────────
app.use(hpp());

// ── Idempotency Protection ───────────────────────────────────────────────────
app.use(idempotencyMiddleware);

// Global Rate Limiting
app.use(env.API_PREFIX, generalLimiter);
// SOAP billing endpoint: text body parser for XML inspection + dedicated rate limiter + API-key auth + XXE pre-filter
app.use(
  "/soap/billing",
  express.text({ type: ["text/xml", "application/xml", "application/soap+xml", "text/plain", "*/*"], limit: "1mb" }),
  soapBillingLimiter,
  soapBillingAuthMiddleware,
  soapXxePreFilter
);


// Swagger Documentation Endpoints — only accessible in non-production environments
if (env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

// Public JWKS Endpoint for Asymmetric RS256 Verification
app.get("/.well-known/jwks.json", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).json(JwksService.getJwks());
});

// Phase 15 - System Health, Readiness, Liveness, & Prometheus Metrics Probes
app.get("/metrics", (req, res) => {
  if (env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  const mem = process.memoryUsage();
  const metrics = [
    "# HELP node_memory_rss_bytes Resident Set Size in bytes",
    "# TYPE node_memory_rss_bytes gauge",
    `node_memory_rss_bytes ${mem.rss}`,
    "# HELP node_memory_heap_used_bytes Heap used in bytes",
    "# TYPE node_memory_heap_used_bytes gauge",
    `node_memory_heap_used_bytes ${mem.heapUsed}`,
    "# HELP node_uptime_seconds Process uptime in seconds",
    "# TYPE node_uptime_seconds counter",
    `node_uptime_seconds ${Math.floor(process.uptime())}`,
    "# HELP roombae_active_workers Number of active worker process instances",
    "# TYPE roombae_active_workers gauge",
    `roombae_active_workers 1`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; version=0.0.4");
  res.send(metrics);
});

app.get("/health", async (req, res) => {
  const startTime = Date.now();
  let dbStatus = "CONNECTED";
  let dbLatency = 0;
  let isDbHealthy = true;

  try {
    const dbStart = Date.now();
    const pingPromise = prisma.$runCommandRaw({ ping: 1 });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB Ping Timeout")), 2000),
    );
    await Promise.race([pingPromise, timeoutPromise]);
    dbLatency = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "DISCONNECTED";
    isDbHealthy = false;
  }

  const redisLatency = await pingRedis();
  const redisConnected = isRedisReady();
  const redisKeyCounts = await getRedisKeyEstimates();
  const routeCacheStats = getRouteCacheStats();

  const memoryUsage = process.memoryUsage();
  const isHealthy = isDbHealthy;
  const statusCode = isHealthy ? 200 : (env.NODE_ENV === "production" ? 503 : 200);

  const smtpHealth = getSmtpHealth();
  const smtpResponse = smtpHealth.status === "healthy"
    ? {
        status: "healthy",
        host: smtpHealth.host || env.MAIL_HOST || "smtp.gmail.com",
        port: smtpHealth.port || parseInt(String(env.MAIL_PORT || "587"), 10),
        latency: smtpHealth.latency ?? 0,
        lastVerifiedAt: smtpHealth.lastVerifiedAt || new Date().toISOString(),
      }
    : {
        status: "degraded",
        reason: smtpHealth.reason || "UNVERIFIED",
      };

  res.status(statusCode).json({
    success: isHealthy,
    status: isHealthy ? "UP" : "DEGRADED",
    version: "1.0.0",
    environment: env.NODE_ENV,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    redis: {
      status: redisConnected ? "CONNECTED" : "DISCONNECTED_MEMORY_FALLBACK",
      latencyMs: redisLatency >= 0 ? redisLatency : "N/A",
      readyState: redisConnected,
      keyEstimates: {
        rateLimitKeys: redisKeyCounts.rateLimitKeys,
        otpKeys: redisKeyCounts.otpKeys,
        blacklistKeys: redisKeyCounts.blacklistKeys,
      },
    },
    cache: {
      routeCache: routeCacheStats,
    },
    database: {
      provider: "mongodb",
      status: dbStatus,
      latencyMs: dbLatency,
    },
    mongodb: {
      provider: "mongodb",
      status: dbStatus,
      latencyMs: env.NODE_ENV === "production" ? "N/A" : dbLatency,
    },
    smtp: smtpResponse,
    memory: env.NODE_ENV === "production"
      ? { rssMB: "N/A", heapTotalMB: "N/A", heapUsedMB: "N/A" }
      : {
          rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
          heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        },
    services: {
      restApi: isHealthy ? "READY" : "DEGRADED",
      soapERP: "READY",
      webSocket: "READY",
      swaggerDocs: env.NODE_ENV !== "production" ? "READY" : "DISABLED_IN_PROD",
      prometheusMetrics: env.NODE_ENV !== "production" ? "READY" : "DISABLED_IN_PROD",
    },
  });
});

app.get("/ready", async (req, res) => {
  let dbConnected = false;
  try {
    const pingPromise = prisma.$runCommandRaw({ ping: 1 });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB Ping Timeout")), 2000),
    );
    await Promise.race([pingPromise, timeoutPromise]);
    dbConnected = true;
  } catch (e) {
    dbConnected = false;
  }

  const redisConnected = isRedisReady();

  if (dbConnected) {
    return res.status(200).json({
      status: "READY",
      message: "Backend and database are accepting incoming traffic.",
      database: "CONNECTED",
      redis: redisConnected ? "CONNECTED" : "DISCONNECTED_MEMORY_FALLBACK",
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(503).json({
      status: "NOT_READY",
      message: "Database connection unreachable. Backend cannot process transactional requests.",
      database: "DISCONNECTED",
      redis: redisConnected ? "CONNECTED" : "DISCONNECTED",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/live", (req, res) => {
  res
    .status(200)
    .json({ status: "ALIVE", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: APP_INFO.name,
    description: APP_INFO.description,
    status: "Running",
    environment: env.NODE_ENV,
    version: APP_INFO.version,
    timestamp: new Date().toISOString(),
    documentation: "/api/v1",
    health: "/health",
  });
});

// REST API v1 Routes
app.use(env.API_PREFIX, apiRouter);

// Initialize SOAP ERP Service
setupSoapServer(app);

// Global Error Handler
app.use(globalErrorHandler);
