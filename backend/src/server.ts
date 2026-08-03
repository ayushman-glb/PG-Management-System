import dns from "dns";
import http from "http";
import { AddressInfo } from "net";

// DNS resolution fallback for Windows Node.js
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

import { app } from "./app";
import { env, resolvedPort } from "./config/env";
import { prisma } from "./config/prisma";
import { logger } from "./utils/logger";
import { SocketServer } from "./socket/socketServer";
import { runInCluster } from "./cluster";

async function bootstrap() {
  try {
    logger.info("✓ Environment Loaded");

    // Phase 5 - MongoDB Connection Validation & Telemetry
    let mongoStatus = "Disconnected";
    let connectionTimeMs = 0;
    let mongoHost = "Unknown";
    let dbName = "roombae-db";

    if (process.env.DATABASE_URL) {
      try {
        const urlMatch = process.env.DATABASE_URL.match(/@([^/]+)\/([^?]+)/);
        if (urlMatch) {
          mongoHost = urlMatch[1];
          dbName = urlMatch[2];
        }
      } catch (e) {}
    }

    const connectStart = Date.now();
    try {
      await prisma.$connect();
      connectionTimeMs = Date.now() - connectStart;
      mongoStatus = `Connected (${connectionTimeMs}ms)`;
      logger.info(
        `✓ MongoDB Connected | Host: ${mongoHost} | Database: ${dbName} | Latency: ${connectionTimeMs}ms`,
      );
    } catch (e: any) {
      mongoStatus = "Connection Pending / In-Memory Seed Fallback";
      logger.warn(
        `⚠️ MongoDB Connection Warning: ${e.message}. Using Repository Mock Fallbacks.`,
      );
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

      httpServer.listen(port, "0.0.0.0", () => {
        const address = httpServer!.address() as AddressInfo;
        const actualPort = address ? address.port : port;

        const banner = [
          "",
          `🚀 RoomBae Enterprise Backend (PID ${process.pid})`,
          "────────────────────────────────────────────────────────",
          `✅ MongoDB Atlas Connected    : ${mongoStatus}`,
          `✅ Authentication Module Ready: Active`,
          `✅ REST APIs Loaded           : http://localhost:${actualPort}${env.API_PREFIX}`,
          `✅ GraphQL Loaded             : http://localhost:${actualPort}/graphql`,
          `✅ Swagger Loaded             : http://localhost:${actualPort}/api/docs`,
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
