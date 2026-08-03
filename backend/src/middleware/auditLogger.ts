import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { Container } from "../container";
import { logger } from "../utils/logger";

export const logAudit = (actionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const userId = req.user?.id || null;

    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          await Container.db.activityLog.create({
            data: {
              userId,
              action: actionName,
              ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
              userAgent,
              details: JSON.stringify({
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
              }),
            },
          });
        } catch (err: any) {
          logger.error("Failed to persist audit log:", err.message);
        }
      }
    });

    next();
  };
};
