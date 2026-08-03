import { IComplaintService, ICreateComplaintPayload } from '../interfaces/services/IComplaintService';
import { IComplaintRepository, IComplaintFilters } from '../interfaces/repositories/IComplaintRepository';
import { IResidentRepository } from '../interfaces/repositories/IResidentRepository';
import { AppError } from '../utils/appError';
import { Priority, TicketStatus } from '@prisma/client';
import crypto from 'crypto';

export class ComplaintService implements IComplaintService {
  constructor(
    private readonly complaintRepository: IComplaintRepository,
    private readonly residentRepository: IResidentRepository
  ) {}

  /**
   * Submit new complaint ticket with cryptographically unique ticket code.
   */
  async createComplaint(userId: string, data: ICreateComplaintPayload) {
    const resident = await this.residentRepository.findByUserId(userId);
    if (!resident) {
      throw new AppError('Resident profile not found', 404);
    }

    const ticketCode = `TICK-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    return this.complaintRepository.create({
      ticketCode,
      residentId: resident.id,
      propertyId: resident.propertyId,
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority || Priority.MEDIUM,
      status: TicketStatus.OPEN
    });
  }

  /**
   * List complaints filtered by priority, status, or property
   */
  async listComplaints(filters: IComplaintFilters) {
    return this.complaintRepository.findMany(filters);
  }

  /**
   * Update complaint status
   */
  async updateStatus(complaintId: string, status: TicketStatus) {
    const complaint = await this.complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new AppError('Complaint ticket not found', 404);
    }

    return this.complaintRepository.updateStatus(complaintId, status);
  }
}
