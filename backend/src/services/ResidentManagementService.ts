import { ResidentStatus, BedStatus, BedHoldReason } from '@prisma/client';
import {
  IResidentManagementRepository,
  IUpdateResidentStatusPayload,
  ICreateBedHoldPayload,
  ICreateRoomTransferPayload,
  IApproveRoomTransferPayload
} from '../interfaces/IResidentManagementRepository';

export class ResidentManagementService {
  constructor(private readonly repo: IResidentManagementRepository) {}

  async updateResidentStatus(payload: IUpdateResidentStatusPayload, userRole: string, currentUserId: string): Promise<any> {
    // RBAC: Resident can only update self status to ACTIVE, INACTIVE, HOME, ON_LEAVE
    if (userRole === 'RESIDENT') {
      const allowedSelfStatuses: ResidentStatus[] = [
        ResidentStatus.ACTIVE,
        ResidentStatus.INACTIVE,
        ResidentStatus.HOME,
        ResidentStatus.ON_LEAVE
      ];

      if (!allowedSelfStatuses.includes(payload.status)) {
        throw new Error(`Residents are not authorized to transition status to ${payload.status}`);
      }
    }

    return this.repo.updateResidentStatus(payload);
  }

  async getResidentStatusHistory(residentId: string): Promise<any[]> {
    return this.repo.getResidentStatusHistory(residentId);
  }

  async updateBedStatus(bedId: string, status: BedStatus, updatedBy: string, userRole: string, notes?: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to modify bed status');
    }
    return this.repo.updateBedStatus(bedId, status, updatedBy, notes);
  }

  async createBedHold(payload: ICreateBedHoldPayload, userRole: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to place bed on hold');
    }
    return this.repo.createBedHold(payload);
  }

  async releaseBedHold(holdId: string, updatedBy: string, userRole: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to release bed hold');
    }
    return this.repo.releaseBedHold(holdId, updatedBy);
  }

  async getBedHolds(pgId?: string): Promise<any[]> {
    return this.repo.getBedHolds(pgId);
  }

  async getBedHistory(bedId: string): Promise<any[]> {
    return this.repo.getBedHistory(bedId);
  }

  async createRoomTransferRequest(payload: ICreateRoomTransferPayload): Promise<any> {
    return this.repo.createRoomTransferRequest(payload);
  }

  async getRoomTransferRequests(pgId?: string, residentId?: string): Promise<any[]> {
    return this.repo.getRoomTransferRequests(pgId, residentId);
  }

  async approveRoomTransferRequest(payload: IApproveRoomTransferPayload, userRole: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to approve room transfer request');
    }
    return this.repo.approveRoomTransferRequest(payload);
  }

  async rejectRoomTransferRequest(requestId: string, rejectionReason: string, performedBy: string, userRole: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to reject room transfer request');
    }
    return this.repo.rejectRoomTransferRequest(requestId, rejectionReason, performedBy);
  }

  async completeRoomTransfer(requestId: string, performedBy: string, userRole: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to complete room transfer');
    }
    return this.repo.completeRoomTransfer(requestId, performedBy);
  }

  async convertRoomType(roomId: string, newType: 'SINGLE' | 'DOUBLE' | 'TRIPLE', performedBy: string, userRole: string): Promise<any> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to convert room type');
    }
    return this.repo.convertRoomType(roomId, newType, performedBy);
  }

  async getAuditLogs(userRole: string, limit?: number): Promise<any[]> {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized to view audit logs');
    }
    return this.repo.getAuditLogs(limit);
  }

  async getNotifications(userId: string): Promise<any[]> {
    return this.repo.getNotifications(userId);
  }
}

