import { Response } from 'express';
import { IComplaintService } from '../../interfaces/services/IComplaintService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Priority, TicketStatus, Role } from '@prisma/client';
import { Container } from '../../container';

/** Returns the list of pgIds owned by the authenticated OWNER/MANAGER user. */
async function getOwnerPgIds(userId: string): Promise<string[]> {
  const owner = await Container.db.owner.findFirst({ where: { userId }, select: { id: true } });
  if (!owner) return [];
  const pgs = await Container.db.pG.findMany({ where: { ownerId: owner.id }, select: { id: true } });
  return pgs.map((p: any) => p.id);
}

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
    const role = req.user?.role as Role;

    let scopedPropertyId = propertyId as string | undefined;

    // OWNER/MANAGER: scope to their authorized PG IDs, never trust client-supplied propertyId blindly
    if (role === Role.OWNER || role === Role.MANAGER) {
      const ownerPgIds = await getOwnerPgIds(req.user!.id);
      if (scopedPropertyId && !ownerPgIds.includes(scopedPropertyId)) {
        return ApiResponse.error(res, 'Forbidden: you do not own the requested property', [], 403, 'FORBIDDEN');
      }
      if (!scopedPropertyId && ownerPgIds.length > 0) {
        scopedPropertyId = ownerPgIds[0];
      }
    }

    const complaints = await this.complaintService.listComplaints({
      propertyId: scopedPropertyId,
      priority: priority as Priority,
      status: status as TicketStatus,
    });
    return ApiResponse.success(res, 'Complaints retrieved', complaints);
  });

  updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const role = req.user?.role as Role;

    // OWNER/MANAGER: verify the complaint belongs to one of their PGs
    if (role === Role.OWNER || role === Role.MANAGER) {
      const complaint = await Container.db.complaint.findUnique({ where: { id }, select: { pgId: true } });
      if (complaint?.pgId) {
        const ownerPgIds = await getOwnerPgIds(req.user!.id);
        if (!ownerPgIds.includes(complaint.pgId)) {
          return ApiResponse.error(res, 'Forbidden: this complaint was not filed against your property', [], 403, 'FORBIDDEN');
        }
      }
    }

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
