import { Response } from 'express';
import { IComplaintService } from '../../interfaces/services/IComplaintService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Priority, TicketStatus } from '@prisma/client';

export class ComplaintController {
  constructor(private readonly complaintService: IComplaintService) {}

  create = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const complaint = await this.complaintService.createComplaint(userId, req.body);
    return ApiResponse.success(res, 'Complaint ticket submitted', complaint, undefined, 201);
  });

  list = catchAsync(async (req: AuthRequest, res: Response) => {
    const { propertyId, priority, status } = req.query;
    const complaints = await this.complaintService.listComplaints({
      propertyId: propertyId as string,
      priority: priority as Priority,
      status: status as TicketStatus
    });
    return ApiResponse.success(res, 'Complaints retrieved', complaints);
  });

  updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const updated = await this.complaintService.updateStatus(id, status, resolutionNotes);
    return ApiResponse.success(res, 'Complaint status updated', updated);
  });

  sendSupportReply = catchAsync(async (req: AuthRequest, res: Response) => {
    const { ticketCode, message } = req.body;
    const repliedBy = req.user?.name || req.user?.email || 'Support Team';
    if (this.complaintService.sendSupportReply) {
      const result = await this.complaintService.sendSupportReply(ticketCode, message, repliedBy);
      return ApiResponse.success(res, 'Support reply sent successfully', result);
    }
    return ApiResponse.success(res, 'Support reply recorded', {});
  });
}
