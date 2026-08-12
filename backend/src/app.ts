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
import { swaggerSpec } from "./config/swagger";
import apiRouter from "./routes/apiRouter";
import { globalErrorHandler } from "./middleware/errorMiddleware";
import { generalLimiter } from "./middleware/rateLimiter";
import { correlationIdMiddleware } from "./middleware/correlationMiddleware";
import { setupSoapServer } from "./services/soapService";
import { APP_INFO, PathResolver } from "./utils/pathResolver";
import passport from "./config/passport";

export const app = express();

// Trust proxy setting when deployed behind Render / Cloudflare reverse proxies
app.set("trust proxy", 1);

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
    crossOriginEmbedderPolicy: env.NODE_ENV === "production" ? { policy: "require-corp" } : false,
    crossOriginOpenerPolicy: env.NODE_ENV === "production" ? { policy: "same-origin" } : false,
    crossOriginResourcePolicy: env.NODE_ENV === "production" ? { policy: "same-origin" } : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }),
);

const allowedOrigins = [
  env.CLIENT_URL,
  env.FRONTEND_URL,
  "https://ayushman-glb.github.io/PG-Management-System",
  "https://pg-management-system-boxb.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some((o) => o && o.replace(/\/$/, "") === cleanOrigin);
      if (isAllowed) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
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

// Global Rate Limiting
app.use(env.API_PREFIX, generalLimiter);


// Swagger Documentation Endpoints — only accessible in non-production environments
if (env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

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

  try {
    const dbStart = Date.now();
    const pingPromise = prisma.$runCommandRaw({ ping: 1 });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB Ping Timeout")), 500),
    );
    await Promise.race([pingPromise, timeoutPromise]);
    dbLatency = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "DISCONNECTED_OR_MOCK_FALLBACK";
  }

  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    status: "UP",
    version: "1.0.0",
    environment: env.NODE_ENV,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    memory: env.NODE_ENV === "production"
      ? { rssMB: "N/A", heapTotalMB: "N/A", heapUsedMB: "N/A" }
      : {
          rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
          heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        },
    database: {
      provider: "mongodb",
      status: dbStatus,
      latencyMs: env.NODE_ENV === "production" ? "N/A" : dbLatency,
    },
    services: {
      restApi: "READY",
      soapERP: "READY",
      webSocket: "READY",
      swaggerDocs: env.NODE_ENV !== "production" ? "READY" : "DISABLED_IN_PROD",
      prometheusMetrics: env.NODE_ENV !== "production" ? "READY" : "DISABLED_IN_PROD",
    },
  });
});

app.get("/ready", async (req, res) => {
  try {
    res.status(200).json({
      status: "READY",
      message: "Backend is accepting incoming traffic.",
    });
  } catch (e) {
    res.status(503).json({
      status: "NOT_READY",
      message: "Backend dependencies initializing.",
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
