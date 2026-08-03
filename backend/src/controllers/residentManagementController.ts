import { Request, Response } from 'express';
import { ResidentManagementService } from '../services/ResidentManagementService';
import { getSocketServer } from '../socket/socketServer';

export class ResidentManagementController {
  constructor(private readonly service: ResidentManagementService) {}

  public updateResidentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { residentId, status, reason } = req.body;
      const userRole = (req as any).user?.role || 'RESIDENT';
      const userId = (req as any).user?.id || 'system';

      if (!residentId || !status) {
        res.status(400).json({ success: false, message: 'residentId and status are required' });
        return;
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

      res.status(200).json({
        success: true,
        data: updatedResident,
        message: `Resident status successfully updated to ${status}`
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public getResidentStatusHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { residentId } = req.params;
      const history = await this.service.getResidentStatusHistory(residentId);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public updateBedStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bedId, status, notes } = req.body;
      const userRole = (req as any).user?.role || 'OWNER';
      const userId = (req as any).user?.id || 'system';

      if (!bedId || !status) {
        res.status(400).json({ success: false, message: 'bedId and status are required' });
        return;
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

      res.status(200).json({ success: true, data: updatedBed });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public createBedHold = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bedId, reason, holdStartDate, holdEndDate, notes } = req.body;
      const userRole = (req as any).user?.role || 'OWNER';
      const userId = (req as any).user?.id || 'system';

      if (!bedId || !reason) {
        res.status(400).json({ success: false, message: 'bedId and reason are required' });
        return;
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

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public releaseBedHold = async (req: Request, res: Response): Promise<void> => {
    try {
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

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public getBedHolds = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pgId } = req.query;
      const holds = await this.service.getBedHolds(pgId as string);
      res.status(200).json({ success: true, data: holds });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  };


  public createRoomTransferRequest = async (req: Request, res: Response): Promise<void> => {
    try {
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
        res.status(400).json({ success: false, message: 'residentId, pgId, currentBedId, and reason are required' });
        return;
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

      res.status(201).json({ success: true, data: request });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public getRoomTransferRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pgId, residentId } = req.query;
      const requests = await this.service.getRoomTransferRequests(pgId as string, residentId as string);
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  };


  public approveRoomTransferRequest = async (req: Request, res: Response): Promise<void> => {
    try {
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

      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public rejectRoomTransferRequest = async (req: Request, res: Response): Promise<void> => {
    try {
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

      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public completeRoomTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const userRole = (req as any).user?.role || 'OWNER';
      const userId = (req as any).user?.id || 'system';

      const result = await this.service.completeRoomTransfer(requestId, userId, userRole);

      const io = getSocketServer();
      if (io) {
        io.emit('transfer:status_updated', { action: 'COMPLETED', request: result.request, resident: result.resident });
      }

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public convertRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId, newType } = req.body;
      const userRole = (req as any).user?.role || 'OWNER';
      const userId = (req as any).user?.id || 'system';

      if (!roomId || !newType) {
        res.status(400).json({ success: false, message: 'roomId and newType are required' });
        return;
      }

      const updatedRoom = await this.service.convertRoomType(roomId, newType, userId, userRole);

      const io = getSocketServer();
      if (io) {
        io.emit('room:converted', { roomId, newType, room: updatedRoom });
      }

      res.status(200).json({ success: true, data: updatedRoom });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userRole = (req as any).user?.role || 'OWNER';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await this.service.getAuditLogs(userRole, limit);
      res.status(200).json({ success: true, data: logs });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  };

  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id || 'user_1';
      const notifications = await this.service.getNotifications(userId);
      res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] });
    }
  };
}


