import { Priority, TicketStatus } from '@prisma/client';
import { IComplaintFilters } from '../repositories/IComplaintRepository';

export interface ICreateComplaintPayload {
  category: string;
  title: string;
  description: string;
  priority?: Priority;
}

export interface IComplaintService {
  createComplaint(userId: string, data: ICreateComplaintPayload): Promise<any>;
  listComplaints(filters: IComplaintFilters): Promise<any[]>;
  updateStatus(complaintId: string, status: TicketStatus): Promise<any>;
}
