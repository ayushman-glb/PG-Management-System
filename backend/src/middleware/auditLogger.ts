import { Response, NextFunction, Request } from "express";
import { AuthRequest } from "./authMiddleware";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export const logAudit = (actionName: string, resource: string = "API") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "Unknown";
    const userId = (req as AuthRequest).user?.id || null;

    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 400 && userId) {
        try {
          await prisma.auditLog.create({
            data: {
              actorId: userId,
              action: actionName,
              resource,
              ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
              userAgent,
              newState: JSON.stringify({
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
              }),
            },
          });
        } catch (err: any) {
          logger.warn("Failed to persist audit log:", err.message);
        }
      }
    });

    next();
  };
};
