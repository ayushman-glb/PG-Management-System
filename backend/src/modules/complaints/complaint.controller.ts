import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from './complaint.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId, roomId, category, title, description, priority } = req.body;
      if (!pgId || !category || !title || !description) {
        throw new BadRequestError('pgId, category, title, and description are required.');
      }

      const complaint = await this.complaintService.createComplaint({
        residentId: req.user.id,
        pgId,
        roomId,
        category,
        title,
        description,
        priority,
      });

      return ApiResponse.success(res, 'Complaint submitted to property management.', complaint, 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const complaints = await this.complaintService.getComplaints(req.user.id, req.user.role, pgId as string);
      return ApiResponse.success(res, 'Complaints retrieved.', complaints);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;
      if (!status) throw new BadRequestError('status is required.');

      const updated = await this.complaintService.updateComplaintStatus(id, req.user.id, req.user.role, status, resolutionNotes);
      return ApiResponse.success(res, `Complaint status updated to ${status}`, updated);
    } catch (error) {
      next(error);
    }
  };

  acknowledgeResolution = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { accepted, rejectionReason } = req.body;
      if (accepted === undefined) throw new BadRequestError('accepted (boolean) is required.');

      const updated = await this.complaintService.acknowledgeResolution(id, req.user.id, Boolean(accepted), rejectionReason);
      return ApiResponse.success(res, accepted ? 'Resolution acknowledged. Complaint closed.' : 'Complaint reopened for further review.', updated);
    } catch (error) {
      next(error);
    }
  };

  addMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { message, attachments } = req.body;
      if (!message) throw new BadRequestError('message is required.');

      const msg = await this.complaintService.addMessage(id, req.user.id, req.user.role, message, attachments);
      return ApiResponse.success(res, 'Message added to complaint thread.', msg, 201);
    } catch (error) {
      next(error);
    }
  };
}
