import { Request, Response } from "express";
import { DeviceService } from "./device.service";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";

export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  identifyDevice = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for device identification",
      });
    }

    const { visitorId, provider, providerVersion, deviceLabel } = req.body;
    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const requestId = (req as any).correlationId;

    const result = await this.deviceService.identifyAndEvaluateDevice(
      userId,
      { visitorId, provider, providerVersion, deviceLabel },
      { ipAddress, userAgent, requestId },
    );

    return ApiResponse.success(res, "Device evaluated successfully", result);
  });

  getDevices = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const devices = await this.deviceService.getUserDevices(userId);
    return ApiResponse.success(res, "Devices retrieved successfully", { devices });
  });

  trustDevice = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { deviceId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const requestId = (req as any).correlationId;

    const device = await this.deviceService.trustDevice(userId, deviceId, {
      ipAddress,
      userAgent,
      requestId,
    });

    return ApiResponse.success(res, "Device trusted successfully", { device });
  });

  revokeDevice = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { deviceId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const requestId = (req as any).correlationId;

    const device = await this.deviceService.revokeDevice(userId, deviceId, {
      ipAddress,
      userAgent,
      requestId,
    });

    return ApiResponse.success(res, "Device access revoked successfully", { device });
  });

  blockDevice = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { deviceId } = req.params;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const requestId = (req as any).correlationId;

    const device = await this.deviceService.blockDevice(deviceId, user.id, {
      ipAddress,
      userAgent,
      requestId,
    });

    return ApiResponse.success(res, "Device blocked successfully", { device });
  });

  unblockDevice = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { deviceId } = req.params;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string);
    const userAgent = req.headers["user-agent"];
    const requestId = (req as any).correlationId;

    const device = await this.deviceService.unblockDevice(deviceId, user.id, {
      ipAddress,
      userAgent,
      requestId,
    });

    return ApiResponse.success(res, "Device unblocked successfully", { device });
  });

  getSecurityEvents = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const targetUserId = (user.role === "SUPER_ADMIN" || user.role === "ADMIN")
      ? (req.query.userId as string || user.id)
      : user.id;

    const events = await this.deviceService.getSecurityEvents(targetUserId);
    return ApiResponse.success(res, "Security events retrieved successfully", { events });
  });
}
