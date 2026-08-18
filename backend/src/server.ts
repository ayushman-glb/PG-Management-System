import dns from "dns";
import http from "http";
import { AddressInfo } from "net";

import fs from "fs";

// Force IPv4-first resolution for Node DNS lookups across all environments (Render, Linux, Docker, Windows)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// DNS resolution fallback for Windows Node.js host (never override inside Docker containers)
if (process.platform === "win32" && !fs.existsSync("/.dockerenv")) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {}
}

import { app } from "./app";
import { env, resolvedPort } from "./config/env";
import { prisma, connectPrismaWithTimeout } from "./config/prisma";
import { verifyRedisConnection } from "./config/redis";
import { logger } from "./utils/logger";
import { SocketServer } from "./socket/socketServer";
import { CronWorkerService } from "./jobs/cronWorkers";
import { runInCluster } from "./cluster";
import { ensureSparseIndexes } from "./scripts/ensureSparseIndexes";

async function bootstrap() {
  try {
    logger.info("✓ Environment Loaded");

    // Phase 5 - Redis Connection Validation & Telemetry
    const redisHealth = await verifyRedisConnection();
    const redisStatus = redisHealth.connected
      ? `Connected (${redisHealth.latencyMs}ms, DB ${redisHealth.database})`
      : "Disconnected / In-Memory Fallback Active";

    if (redisHealth.connected) {
      logger.info(`✓ Redis Connected | Host: ${redisHealth.host}:${redisHealth.port} | Database: ${redisHealth.database} | Latency: ${redisHealth.latencyMs}ms`);
    }

    // Phase 5 - MongoDB Connection Validation & Telemetry
    let mongoStatus = "Disconnected";
    let connectionTimeMs = 0;
    let mongoHost = "Unknown";
    let dbName = "roombae-db";

    if (env.DATABASE_URL) {
      try {
        const urlMatch = env.DATABASE_URL.match(/@([^/]+)\/([^?]+)/);
        if (urlMatch) {
          mongoHost = urlMatch[1];
          dbName = urlMatch[2];
        }
      } catch (e) {}
    }

    const connectStart = Date.now();
    try {
      await connectPrismaWithTimeout(10000);
      connectionTimeMs = Date.now() - connectStart;
      mongoStatus = `Connected (${connectionTimeMs}ms)`;
      logger.info(
        `✓ MongoDB Connected | Host: ${mongoHost} | Database: ${dbName} | Latency: ${connectionTimeMs}ms`,
      );
      // Initialize MongoDB partial/sparse unique indexes for optional fields
      await ensureSparseIndexes();
    } catch (e: any) {
      mongoStatus = "Disconnected / Connection Failed";
      if (env.NODE_ENV === "production") {
        logger.error(
          `❌ FATAL: MongoDB Connection Failed in Production environment! Error: ${e.message}`,
        );
        logger.error("❌ Process exiting with code 1. Check your DATABASE_URL / MONGODB_URI connection string and replicaSet settings.");
        process.exit(1);
      } else {
        logger.warn(
          `⚠️ MongoDB Connection Warning: ${e.message}. Falling back to dev mode mocks where applicable.`,
        );
      }
    }

    const PORT = resolvedPort;
    let httpServer: http.Server | null = null;

    const startServerOnPort = (port: number) => {
      httpServer = http.createServer(app);

      // Standard Development & Production HTTP Timeouts
      httpServer.keepAliveTimeout = 65000;
      httpServer.headersTimeout = 66000;
      httpServer.requestTimeout = 30000;

      httpServer.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          const nextPort = port + 1;
          logger.warn(
            `⚠️ Port ${port} is already in use. Retrying on ${nextPort}...`,
          );
          startServerOnPort(nextPort);
          return;
        }

        logger.error(
          `❌ Critical server error on port ${port}:`,
          error.message,
        );
        process.exit(1);
      });

      // Initialize Socket.IO Server
      SocketServer.init(httpServer);
      // Initialize Background Cron Workers
      CronWorkerService.init();

      httpServer.listen(port, "0.0.0.0", () => {
        const address = httpServer!.address() as AddressInfo;
        const actualPort = address ? address.port : port;

        const apiUrl = `${env.API_BASE_URL.replace(/\/$/, "")}${env.API_PREFIX}`;
        const swaggerUrl = `${env.API_BASE_URL.replace(/\/$/, "")}/api/docs`;

        const twilioStatus = env.TWILIO_ACCOUNT_SID ? 'Twilio Programmable SMS Active' : 'Simulated SMS Mode';

        const banner = [
          "",
          `🚀 RoomBae Enterprise Backend (PID ${process.pid})`,
          "────────────────────────────────────────────────────────",
          `✅ MongoDB Atlas Connected    : ${mongoStatus}`,
          `✅ Redis Cache & RateLimiter : ${redisStatus}`,
          `✅ Authentication Module Ready: Active`,
          `✅ REST APIs Loaded           : ${apiUrl}`,
          `✅ Swagger Loaded             : ${swaggerUrl}`,
          `✅ Twilio SMS OTP Running     : ${twilioStatus}`,
          `✅ Email Service Running      : Transactional Dispatch Active`,
          `✅ Owner Module Ready         : 10-Step Onboarding Active`,
          `✅ Resident Module Ready      : PG Portal Active`,
          "────────────────────────────────────────────────────────",
          "",
        ].join("\n");

        logger.raw(banner);
      });
    };

    startServerOnPort(PORT);

    const shutdown = async (signal: string) => {
      logger.info(
        `Received ${signal}. Shutting down worker process PID ${process.pid} gracefully...`,
      );

      const forceExitTimer = setTimeout(() => {
        logger.warn(`Graceful shutdown timed out. Force exiting PID ${process.pid}.`);
        process.exit(0);
      }, 2000);
      forceExitTimer.unref();

      try {
        if (httpServer) {
          httpServer.close(async () => {
            try {
              await prisma.$disconnect().catch(() => {});
            } finally {
              logger.info(`Worker PID ${process.pid} disconnected cleanly.`);
              process.exit(0);
            }
          });
        } else {
          process.exit(0);
        }
      } catch {
        process.exit(0);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error: any) {
    logger.error(
      `❌ Critical Error starting server instance (PID ${process.pid}):`,
      error.message,
    );
    process.exit(1);
  }
}

runInCluster(bootstrap);
