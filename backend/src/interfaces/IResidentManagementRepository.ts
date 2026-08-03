import { ResidentStatus, BedStatus, RoomTransferStatus, BedHoldReason } from '@prisma/client';

export interface IUpdateResidentStatusPayload {
  residentId: string;
  status: ResidentStatus;
  reason?: string;
  updatedBy: string;
}

export interface ICreateBedHoldPayload {
  bedId: string;
  reason: BedHoldReason;
  holdStartDate?: Date;
  holdEndDate?: Date;
  createdBy: string;
  notes?: string;
}

export interface ICreateRoomTransferPayload {
  residentId: string;
  pgId: string;
  currentBedId: string;
  preferredRoomType?: string;
  preferredSharingType?: string;
  preferredRoomNumber?: string;
  reason: string;
  budget?: number;
  preferredMoveDate?: Date;
  additionalNotes?: string;
  priority?: string;
  attachments?: string[];
}

export interface IApproveRoomTransferPayload {
  requestId: string;
  targetBedId?: string;
  scheduledDate?: Date;
  performedBy: string;
  notes?: string;
}

export interface IResidentManagementRepository {
  updateResidentStatus(payload: IUpdateResidentStatusPayload): Promise<any>;
  getResidentStatusHistory(residentId: string): Promise<any[]>;
  updateBedStatus(bedId: string, status: BedStatus, updatedBy: string, notes?: string): Promise<any>;
  createBedHold(payload: ICreateBedHoldPayload): Promise<any>;
  releaseBedHold(holdId: string, updatedBy: string): Promise<any>;
  getBedHolds(pgId?: string): Promise<any[]>;
  getBedHistory(bedId: string): Promise<any[]>;
  createRoomTransferRequest(payload: ICreateRoomTransferPayload): Promise<any>;
  getRoomTransferRequests(pgId?: string, residentId?: string): Promise<any[]>;
  getRoomTransferRequestById(requestId: string): Promise<any | null>;
  approveRoomTransferRequest(payload: IApproveRoomTransferPayload): Promise<any>;
  rejectRoomTransferRequest(requestId: string, rejectionReason: string, performedBy: string): Promise<any>;
  completeRoomTransfer(requestId: string, performedBy: string): Promise<any>;
  convertRoomType(roomId: string, newType: 'SINGLE' | 'DOUBLE' | 'TRIPLE', performedBy: string): Promise<any>;
  getAuditLogs(limit?: number): Promise<any[]>;
  getNotifications(userId: string): Promise<any[]>;
}

