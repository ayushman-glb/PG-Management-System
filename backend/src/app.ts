import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
// @ts-ignore
const hpp = require("hpp");
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import apiRouter from "./routes/apiRouter";
import { globalErrorHandler } from "./middleware/errorMiddleware";
import { generalLimiter } from "./middleware/rateLimiter";
import { correlationIdMiddleware } from "./middleware/correlationMiddleware";
import { idempotencyMiddleware } from "./middleware/idempotencyMiddleware";
import { validateCsrf } from "./middleware/csrfMiddleware";
import { corsOptions } from "./config/corsOrigins";

export const app = express();

// Trust proxy setting when deployed behind reverse proxies
app.set("trust proxy", 1);

// ── 1. CORS Middleware ──
const corsMiddleware = cors(corsOptions);
app.use(corsMiddleware);
app.options("*", corsMiddleware);

// ── 2. Correlation ID & Distributed Tracing ──
app.use(correlationIdMiddleware);

// ── 3. Security & Optimization Middlewares ──
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

// ── 4. NoSQL & Parameter Pollution Defenses ──
app.use(mongoSanitize({ allowDots: false, replaceWith: '_' }));
app.use(hpp());

// ── 5. Idempotency & CSRF Protection ──
app.use(idempotencyMiddleware);
app.use(validateCsrf);

// ── 6. Global Rate Limiting ──
app.use(env.API_PREFIX, generalLimiter);

// ── 7. Health, Readiness & Root Probes ──
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

  res.status(isDbHealthy ? 200 : 503).json({
    success: isDbHealthy,
    status: isDbHealthy ? "UP" : "DEGRADED",
    version: "1.0.0",
    environment: env.NODE_ENV,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    database: {
      provider: "mongodb",
      status: dbStatus,
      latencyMs: dbLatency,
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

  if (dbConnected) {
    return res.status(200).json({
      status: "READY",
      message: "Backend and database are accepting incoming traffic.",
      database: "CONNECTED",
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(503).json({
      status: "NOT_READY",
      message: "Database connection unreachable.",
      database: "DISCONNECTED",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/live", (req, res) => {
  res.status(200).json({ status: "ALIVE", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "RoomBae PG Management System API",
    description: "Enterprise REST backend for RoomBae PG discovery & management platform",
    status: "Running",
    environment: env.NODE_ENV,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api/v1",
    health: "/health",
  });
});

// ── 8. REST API v1 Routes ──
app.use(env.API_PREFIX, apiRouter);

// ── 9. Catch-all 404 handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
      action: "verify_endpoint_url",
    },
  });
});

// ── 10. Global Error Handler ──
app.use(globalErrorHandler);
