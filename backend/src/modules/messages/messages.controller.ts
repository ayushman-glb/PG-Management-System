import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";
import { MessagesService } from "./messages.service";
import { prisma } from "../../config/prisma";

const service = new MessagesService(prisma);

export class MessagesController {
  getOrCreateThread = catchAsync(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.id;
    const { pgId } = req.body;
    if (!pgId) return ApiResponse.error(res, "pgId is required", undefined, 400);

    const thread = await service.getOrCreateThread(tenantId, pgId);
    return ApiResponse.success(res, "Chat thread retrieved", thread);
  });

  getUserThreads = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const threads = await service.getUserThreads(userId);
    return ApiResponse.success(res, "Threads retrieved", threads);
  });

  getThreadMessages = catchAsync(async (req: AuthRequest, res: Response) => {
    const { threadId } = req.params;
    const userId = req.user!.id;
    const messages = await service.getThreadMessages(threadId, userId);
    return ApiResponse.success(res, "Messages retrieved", messages);
  });

  sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
    const senderId = req.user!.id;
    const { threadId, content } = req.body;

    if (!threadId || !content) {
      return ApiResponse.error(res, "threadId and content are required", undefined, 400);
    }

    const message = await service.sendMessage(senderId, threadId, content);
    return ApiResponse.success(res, "Message sent", message, undefined, 201);
  });
}
