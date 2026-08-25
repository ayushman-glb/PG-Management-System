import { PrismaClient, Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export interface ICreateComplaintDTO {
  residentId: string;
  pgId: string;
  roomId?: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority?: ComplaintPriority;
}

export class ComplaintService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async createComplaint(data: ICreateComplaintDTO): Promise<Complaint> {
    if (!data.title || !data.description || !data.category) {
      throw new BadRequestError('Category, title, and description are required.');
    }

    const complaint = await this.db.complaint.create({
      data: {
        residentId: data.residentId,
        pgId: data.pgId,
        roomId: data.roomId,
        category: data.category,
        title: data.title,
        description: data.description,
        priority: data.priority || ComplaintPriority.MEDIUM,
        status: ComplaintStatus.OPEN,
      },
      include: {
        pg: { select: { id: true, name: true } },
        room: true,
      },
    });

    await this.db.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        fromStatus: ComplaintStatus.OPEN,
        toStatus: ComplaintStatus.OPEN,
        changedById: data.residentId,
        remarks: 'Complaint registered by resident.',
      },
    });

    return complaint;
  }

  async getComplaints(userId: string, userRole: Role, pgId?: string): Promise<Complaint[]> {
    const where: any = {};
    if (userRole === Role.RESIDENT) {
      where.residentId = userId;
    } else if (userRole === Role.PG_OWNER) {
      where.pg = { ownerId: userId };
      if (pgId) where.pgId = pgId;
    }

    return await this.db.complaint.findMany({
      where,
      include: {
        resident: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        pg: { select: { id: true, name: true, location: true } },
        room: true,
        messages: {
          include: { sender: { select: { id: true, username: true, role: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        histories: {
          include: { changedBy: { select: { id: true, username: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateComplaintStatus(complaintId: string, actorId: string, actorRole: Role, status: ComplaintStatus, resolutionNotes?: string): Promise<Complaint> {
    const complaint = await this.db.complaint.findUnique({
      where: { id: complaintId },
      include: { pg: true },
    });

    if (!complaint) throw new NotFoundError('Complaint not found.');

    if (actorRole === Role.PG_OWNER && complaint.pg.ownerId !== actorId) {
      throw new ForbiddenError('You do not own this PG property.');
    }

    const updated = await this.db.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        resolutionNotes: status === ComplaintStatus.RESOLVED ? resolutionNotes : complaint.resolutionNotes,
        resolvedAt: status === ComplaintStatus.RESOLVED ? new Date() : complaint.resolvedAt,
        closedAt: status === ComplaintStatus.CLOSED ? new Date() : complaint.closedAt,
      },
      include: { messages: true, histories: true },
    });

    await this.db.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: complaint.status,
        toStatus: status,
        changedById: actorId,
        remarks: resolutionNotes || `Status transitioned to ${status}`,
      },
    });

    return updated;
  }

  async acknowledgeResolution(complaintId: string, residentId: string, accepted: boolean, rejectionReason?: string): Promise<Complaint> {
    const complaint = await this.db.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundError('Complaint not found.');
    if (complaint.residentId !== residentId) throw new ForbiddenError('Only the resident who created the ticket can acknowledge resolution.');

    if (accepted) {
      return await this.updateComplaintStatus(complaintId, residentId, Role.RESIDENT, ComplaintStatus.CLOSED, 'Resident confirmed resolution.');
    } else {
      if (!rejectionReason) throw new BadRequestError('A reason must be provided when reopening an unresolved complaint.');

      const updated = await this.db.complaint.update({
        where: { id: complaintId },
        data: {
          status: ComplaintStatus.REOPENED,
          residentRejectionReason: rejectionReason,
        },
      });

      await this.db.complaintStatusHistory.create({
        data: {
          complaintId,
          fromStatus: complaint.status,
          toStatus: ComplaintStatus.REOPENED,
          changedById: residentId,
          remarks: `Resident rejected resolution: ${rejectionReason}`,
        },
      });

      return updated;
    }
  }

  async addMessage(complaintId: string, senderId: string, senderRole: Role, message: string, attachments?: string[]): Promise<any> {
    if (!message?.trim()) throw new BadRequestError('Message cannot be empty.');

    const complaint = await this.db.complaint.findUnique({
      where: { id: complaintId },
      include: { pg: true },
    });

    if (!complaint) throw new NotFoundError('Complaint not found.');

    return await this.db.complaintMessage.create({
      data: {
        complaintId,
        senderId,
        senderRole,
        message: message.trim(),
        attachments: attachments || [],
      },
      include: {
        sender: { select: { id: true, username: true, role: true, avatarUrl: true } },
      },
    });
  }

  async getComplaintById(complaintId: string, userId: string, userRole: Role): Promise<any> {
    const complaint = await this.db.complaint.findUnique({
      where: { id: complaintId },
      include: {
        pg: { select: { id: true, name: true, ownerId: true } },
        room: true,
        resident: { include: { profile: true } },
        messages: {
          include: {
            sender: { select: { id: true, username: true, role: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        histories: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!complaint) throw new NotFoundError('Complaint not found.');

    if (userRole === Role.RESIDENT && complaint.residentId !== userId) {
      throw new ForbiddenError('You are not authorized to view this complaint.');
    }
    if (userRole === Role.PG_OWNER && complaint.pg?.ownerId !== userId) {
      throw new ForbiddenError('You do not own the property for this complaint.');
    }

    return complaint;
  }
}
