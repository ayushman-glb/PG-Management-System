import { IComplaintService, ICreateComplaintPayload } from '../../interfaces/services/IComplaintService';
import { IComplaintRepository, IComplaintFilters } from '../../interfaces/repositories/IComplaintRepository';
import { IResidentRepository } from '../../interfaces/repositories/IResidentRepository';
import { AppError } from '../../utils/appError';
import { Priority, TicketStatus } from '@prisma/client';
import crypto from 'crypto';
import { SocketServer } from '../../socket/socketServer';

export class ComplaintService implements IComplaintService {
  constructor(
    private readonly complaintRepository: IComplaintRepository,
    private readonly residentRepository: IResidentRepository
  ) {}

  async createComplaint(userId: string, data: ICreateComplaintPayload) {
    const resident = await this.residentRepository.findByUserId(userId);
    if (!resident) {
      throw new AppError('Resident profile not found', 404);
    }

    const ticketCode = `TICK-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    const complaint = await this.complaintRepository.create({
      ticketCode,
      residentId: resident.id,
      propertyId: resident.pgId || 'default-pg',
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority || Priority.MEDIUM,
      status: TicketStatus.OPEN
    });

    try {
      if (complaint.pgId) {
        SocketServer.emitToPg(complaint.pgId, 'complaint:created', complaint);
      }
    } catch {}

    return complaint;
  }

  async listComplaints(filters: IComplaintFilters) {
    return this.complaintRepository.findMany(filters);
  }

  async updateStatus(complaintId: string, status: TicketStatus) {
    const complaint = await this.complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new AppError('Complaint ticket not found', 404);
    }

    const updated = await this.complaintRepository.updateStatus(complaintId, status);

    try {
      if (complaint.pgId) {
        SocketServer.emitToPg(complaint.pgId, 'complaint:status_change', updated);
      }
    } catch {}

    return updated;
  }
}
