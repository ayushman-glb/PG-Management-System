import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { swaggerSpec } from "./config/swagger";
import apiRouter from "./routes/apiRouter";
import { globalErrorHandler } from "./middleware/errorMiddleware";
import { generalLimiter } from "./middleware/rateLimiter";
import { correlationIdMiddleware } from "./middleware/correlationMiddleware";
import { setupGraphQLServer } from "./graphql/apolloServer";
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
    contentSecurityPolicy: false, // Allows Apollo GraphQL Studio and Swagger UI in dev
  }),
);
const allowedOrigins = [
  env.CLIENT_URL,
  env.FRONTEND_URL,
  "https://ayushman-glb.github.io",
  "https://ayushman-glb.github.io/PG-Management-System",
  "https://ayushman-glb.github.io/PG-Management-System/",
  "https://pg-management-system-boxb.onrender.com",
  "http://localhost:8443",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:8443",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some((o) => o && o.replace(/\/$/, "") === cleanOrigin);
      if (
        isAllowed ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
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

// Global Rate Limiting
app.use(env.API_PREFIX, generalLimiter);

// Swagger Documentation Endpoints
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Phase 15 - System Health, Readiness, Liveness, & Prometheus Metrics Probes
app.get("/metrics", (req, res) => {
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
    memory: {
      rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
    },
    database: {
      provider: "mongodb",
      status: dbStatus,
      latencyMs: dbLatency,
    },
    services: {
      restApi: "READY",
      graphQL: "READY",
      soapERP: "READY",
      webSocket: "READY",
      swaggerDocs: "READY",
      prometheusMetrics: "READY",
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
    graphql: "/graphql",
    health: "/health",
  });
});

// REST API v1 Routes
app.use(env.API_PREFIX, apiRouter);

// Initialize Dual API Services: GraphQL & SOAP ERP
setupGraphQLServer(app);
setupSoapServer(app);

// Global Error Handler
app.use(globalErrorHandler);
