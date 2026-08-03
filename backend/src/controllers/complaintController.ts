import { Response } from 'express';
import { IComplaintService } from '../interfaces/services/IComplaintService';
import { catchAsync } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/authMiddleware';
import { Priority, TicketStatus } from '@prisma/client';

export class ComplaintController {
  constructor(private readonly complaintService: IComplaintService) {}

  createComplaint = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const complaint = await this.complaintService.createComplaint(userId, req.body);
    return ApiResponse.success(res, 'Complaint ticket submitted successfully', complaint, 201);
  });

  listComplaints = catchAsync(async (req: AuthRequest, res: Response) => {
    const { propertyId, priority, status } = req.query;
    const complaints = await this.complaintService.listComplaints({
      propertyId: propertyId as string,
      priority: priority as Priority,
      status: status as TicketStatus
    });
    return ApiResponse.success(res, 'Complaints list retrieved', complaints);
  });

  updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await this.complaintService.updateStatus(id, status);
    return ApiResponse.success(res, 'Complaint ticket status updated', updated);
  });
}
