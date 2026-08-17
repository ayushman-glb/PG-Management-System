import dns from "dns";
import http from "http";
import { AddressInfo } from "net";

// DNS resolution fallback for Windows Node.js
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

import { app } from "./app";
import { env, resolvedPort } from "./config/env";
import { prisma, connectPrismaWithTimeout } from "./config/prisma";
import { logger } from "./utils/logger";
import { SocketServer } from "./socket/socketServer";
import { CronWorkerService } from "./jobs/cronWorkers";
import { runInCluster } from "./cluster";
import { ensureSparseIndexes } from "./scripts/ensureSparseIndexes";

async function bootstrap() {
  try {
    logger.info("✓ Environment Loaded");

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

        const banner = [
          "",
          `🚀 RoomBae Enterprise Backend (PID ${process.pid})`,
          "────────────────────────────────────────────────────────",
          `✅ MongoDB Atlas Connected    : ${mongoStatus}`,
          `✅ Authentication Module Ready: Active`,
          `✅ REST APIs Loaded           : ${apiUrl}`,
          `✅ Swagger Loaded             : ${swaggerUrl}`,
          `✅ OTP Service Running        : Phone & Email OTP Active`,
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
      if (httpServer) {
        httpServer.close(async () => {
          await prisma.$disconnect().catch(() => {});
          logger.info(`Worker PID ${process.pid} disconnected cleanly.`);
          process.exit(0);
        });
      } else {
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
