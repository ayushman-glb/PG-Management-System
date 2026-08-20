import { Request, Response } from 'express';
import { ResidentManagementService } from '../services/ResidentManagementService';
import { getSocketServer } from '../socket/socketServer';
import { catchAsync, AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';

export class ResidentManagementController {
  constructor(private readonly service: ResidentManagementService) {}

  public updateResidentStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { residentId, status, reason } = req.body;
    const userRole = (req as any).user?.role || 'RESIDENT';
    const userId = (req as any).user?.id || 'system';

    if (!residentId || !status) {
      throw new AppError('residentId and status are required', 400, 'FIELDS_REQUIRED');
    }

    const updatedResident = await this.service.updateResidentStatus(
      { residentId, status, reason, updatedBy: userId },
      userRole,
      userId
    );

    // Emit real-time Socket.IO event
    const io = getSocketServer();
    if (io) {
      io.emit('resident:status_updated', {
        residentId: updatedResident.id,
        status: updatedResident.status,
        residentName: updatedResident.name,
        pgId: updatedResident.pgId,
        reason,
        updatedAt: new Date().toISOString()
      });
    }

    ApiResponse.success(res, `Resident status successfully updated to ${status}`, updatedResident);
  });

  public getResidentStatusHistory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { residentId } = req.params;
    const history = await this.service.getResidentStatusHistory(residentId);
    ApiResponse.success(res, 'Resident status history retrieved successfully', history);
  });

  public updateBedStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { bedId, status, notes } = req.body;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    if (!bedId || !status) {
      throw new AppError('bedId and status are required', 400, 'FIELDS_REQUIRED');
    }

    const updatedBed = await this.service.updateBedStatus(bedId, status, userId, userRole, notes);

    // Socket.IO event
    const io = getSocketServer();
    if (io) {
      io.emit('bed:status_updated', {
        bedId: updatedBed.id,
        status: updatedBed.status,
        bedNumber: updatedBed.bedNumber,
        notes,
        updatedAt: new Date().toISOString()
      });
    }

    ApiResponse.success(res, 'Bed status updated successfully', updatedBed);
  });

  public createBedHold = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { bedId, reason, holdStartDate, holdEndDate, notes } = req.body;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    if (!bedId || !reason) {
      throw new AppError('bedId and reason are required', 400, 'FIELDS_REQUIRED');
    }

    const result = await this.service.createBedHold(
      {
        bedId,
        reason,
        holdStartDate: holdStartDate ? new Date(holdStartDate) : new Date(),
        holdEndDate: holdEndDate ? new Date(holdEndDate) : undefined,
        createdBy: userId,
        notes
      },
      userRole
    );

    const io = getSocketServer();
    if (io) {
      io.emit('bed:hold_updated', {
        action: 'CREATED',
        hold: result.hold,
        bed: result.bed
      });
    }

    ApiResponse.success(res, 'Bed hold created successfully', result, 201);
  });

  public releaseBedHold = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { holdId } = req.params;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    const result = await this.service.releaseBedHold(holdId, userId, userRole);

    const io = getSocketServer();
    if (io) {
      io.emit('bed:hold_updated', {
        action: 'RELEASED',
        hold: result.hold,
        bed: result.bed
      });
    }

    ApiResponse.success(res, 'Bed hold released successfully', result);
  });

  public getBedHolds = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { pgId } = req.query;
    const holds = await this.service.getBedHolds(pgId as string);
    ApiResponse.success(res, 'Bed holds retrieved successfully', holds || []);
  });

  public createRoomTransferRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const {
      residentId,
      pgId,
      currentBedId,
      preferredSharingType,
      preferredRoomNumber,
      reason,
      budget,
      preferredMoveDate,
      additionalNotes,
      priority,
      attachments
    } = req.body;

    if (!residentId || !pgId || !currentBedId || !reason) {
      throw new AppError('residentId, pgId, currentBedId, and reason are required', 400, 'FIELDS_REQUIRED');
    }

    const request = await this.service.createRoomTransferRequest({
      residentId,
      pgId,
      currentBedId,
      preferredSharingType,
      preferredRoomNumber,
      reason,
      budget: budget ? parseFloat(budget) : undefined,
      preferredMoveDate: preferredMoveDate ? new Date(preferredMoveDate) : undefined,
      additionalNotes,
      priority,
      attachments
    });

    const io = getSocketServer();
    if (io) {
      io.emit('transfer:requested', request);
    }

    ApiResponse.success(res, 'Room transfer request created successfully', request, 201);
  });

  public getRoomTransferRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { pgId, residentId } = req.query;
    const requests = await this.service.getRoomTransferRequests(pgId as string, residentId as string);
    ApiResponse.success(res, 'Room transfer requests retrieved successfully', requests || []);
  });

  public approveRoomTransferRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { requestId } = req.params;
    const { targetBedId, scheduledDate, notes } = req.body;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    const request = await this.service.approveRoomTransferRequest(
      {
        requestId,
        targetBedId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        performedBy: userId,
        notes
      },
      userRole
    );

    const io = getSocketServer();
    if (io) {
      io.emit('transfer:status_updated', { action: 'APPROVED', request });
    }

    ApiResponse.success(res, 'Room transfer request approved successfully', request);
  });

  public rejectRoomTransferRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    const request = await this.service.rejectRoomTransferRequest(
      requestId,
      rejectionReason || 'Request rejected by owner',
      userId,
      userRole
    );

    const io = getSocketServer();
    if (io) {
      io.emit('transfer:status_updated', { action: 'REJECTED', request });
    }

    ApiResponse.success(res, 'Room transfer request rejected successfully', request);
  });

  public completeRoomTransfer = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { requestId } = req.params;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    const result = await this.service.completeRoomTransfer(requestId, userId, userRole);

    const io = getSocketServer();
    if (io) {
      io.emit('transfer:status_updated', { action: 'COMPLETED', request: result.request, resident: result.resident });
    }

    ApiResponse.success(res, 'Room transfer completed successfully', result);
  });

  public convertRoomType = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { roomId, newType } = req.body;
    const userRole = (req as any).user?.role || 'OWNER';
    const userId = (req as any).user?.id || 'system';

    if (!roomId || !newType) {
      throw new AppError('roomId and newType are required', 400, 'FIELDS_REQUIRED');
    }

    const updatedRoom = await this.service.convertRoomType(roomId, newType, userId, userRole);

    const io = getSocketServer();
    if (io) {
      io.emit('room:converted', { roomId, newType, room: updatedRoom });
    }

    ApiResponse.success(res, 'Room type converted successfully', updatedRoom);
  });

  public getAuditLogs = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role || 'OWNER';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await this.service.getAuditLogs(userRole, limit);
    ApiResponse.success(res, 'Audit logs retrieved successfully', logs || []);
  });

  public getNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'user_1';
    const notifications = await this.service.getNotifications(userId);
    ApiResponse.success(res, 'Notifications retrieved successfully', notifications || []);
  });
}
