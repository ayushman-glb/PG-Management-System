import { Complaint, Priority, TicketStatus } from '@prisma/client';

export interface ICreateComplaintData {
  ticketCode: string;
  residentId: string;
  propertyId: string;
  category: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
}

export interface IComplaintFilters {
  propertyId?: string;
  priority?: Priority;
  status?: TicketStatus;
}

export interface IComplaintRepository {
  create(data: ICreateComplaintData): Promise<Complaint>;
  findMany(filters: IComplaintFilters): Promise<any[]>;
  findById(id: string): Promise<Complaint | null>;
  updateStatus(id: string, status: TicketStatus): Promise<Complaint>;
}
