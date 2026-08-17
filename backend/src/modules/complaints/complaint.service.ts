import { IComplaintService, ICreateComplaintPayload } from '../../interfaces/services/IComplaintService';
import { IComplaintRepository, IComplaintFilters } from '../../interfaces/repositories/IComplaintRepository';
import { IResidentRepository } from '../../interfaces/repositories/IResidentRepository';
import { AppError } from '../../utils/appError';
import { Priority, TicketStatus } from '@prisma/client';
import crypto from 'crypto';
import { SocketServer } from '../../socket/socketServer';
import { emailService } from '../email';
import { prisma } from '../../config/prisma';

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

    // Dispatch email notification to resident
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await emailService.sendComplaintEmail({
          email: user.email,
          name: user.name || 'Resident',
          ticketCode: complaint.ticketCode,
          title: complaint.title,
          category: complaint.category,
          priority: complaint.priority,
          status: 'OPEN',
          description: complaint.description,
          createdAt: complaint.createdAt,
        });
      }
    } catch (err: any) {
      console.warn('Failed to send complaint confirmation email:', err.message);
    }

    return complaint;
  }

  async listComplaints(filters: IComplaintFilters) {
    return this.complaintRepository.findMany(filters);
  }

  async updateStatus(complaintId: string, status: TicketStatus, resolutionNotes?: string) {
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

    // Dispatch status update / resolution email
    try {
      const resident = await prisma.resident.findUnique({
        where: { id: complaint.residentId },
        include: { user: true },
      });
      if (resident?.user?.email) {
        await emailService.sendComplaintEmail({
          email: resident.user.email,
          name: resident.user.name || 'Resident',
          ticketCode: complaint.ticketCode,
          title: complaint.title,
          category: complaint.category,
          priority: complaint.priority,
          status: status.toString(),
          description: complaint.description,
          createdAt: complaint.createdAt,
          resolutionNotes,
        });
      }
    } catch (err: any) {
      console.warn('Failed to send complaint status email update:', err.message);
    }

    return updated;
  }

  async sendSupportReply(ticketCode: string, message: string, repliedBy: string) {
    const complaint = await prisma.complaint.findFirst({
      where: { ticketCode },
      include: { resident: { include: { user: true } } },
    });

    if (!complaint || !complaint.resident?.user?.email) {
      throw new AppError('Ticket not found or resident has no associated email address', 404);
    }

    await emailService.sendSupportReplyEmail({
      email: complaint.resident.user.email,
      name: complaint.resident.user.name || 'Resident',
      ticketCode,
      subject: `Re: ${complaint.title}`,
      message,
      repliedBy,
      repliedAt: new Date(),
    });

    return { success: true, message: 'Support reply email dispatched.' };
  }
}
