import { Response, NextFunction } from 'express';
import { MessageService } from './message.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  getOrCreateThread = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const pgId = req.body.pgId || req.body.propertyId;
      const thread = await this.messageService.getOrCreateThread(req.user.id, pgId);
      return ApiResponse.success(res, 'Message thread retrieved/created.', thread);
    } catch (error) {
      next(error);
    }
  };

  getThreads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const threads = await this.messageService.getThreads(req.user.id, req.user.role);
      return ApiResponse.success(res, 'Message threads retrieved successfully.', threads);
    } catch (error) {
      next(error);
    }
  };

  getThreadMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const messages = await this.messageService.getThreadMessages(req.params.id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Messages retrieved successfully.', messages);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { threadId, content, attachments } = req.body;
      if (!threadId) throw new BadRequestError('threadId is required.');

      const message = await this.messageService.sendMessage(req.user.id, threadId, content, attachments || []);
      return ApiResponse.success(res, 'Message sent successfully.', message, 201);
    } catch (error) {
      next(error);
    }
  };
}
