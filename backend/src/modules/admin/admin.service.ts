import { PrismaClient, User, Role, PGStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../core/errors/CustomErrors';

export class AdminService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async listUsers(role?: Role, query?: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;
    if (query?.trim()) {
      const q = query.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const [total, users] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          profile: true,
          subscriptions: { include: { plan: true }, take: 1, orderBy: { createdAt: 'desc' } },
          _count: { select: { ownedPGs: true, bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async setUserStatus(userId: string, isActive: boolean, isSuspended: boolean): Promise<User> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    return await this.db.user.update({
      where: { id: userId },
      data: {
        isActive,
        isSuspended,
        tokenVersion: { increment: 1 }, // Revoke active sessions on suspension
      },
    });
  }

  async getPGVerificationQueue(): Promise<any[]> {
    return await this.db.pG.findMany({
      where: {
        status: { in: [PGStatus.PENDING_ADMIN_VERIFICATION, PGStatus.CHANGES_REQUESTED] },
      },
      include: {
        owner: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        location: true,
        images: true,
        floors: { include: { rooms: { include: { beds: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyPG(pgId: string, status: PGStatus, rejectionReason?: string, adminNotes?: string): Promise<any> {
    const pg = await this.db.pG.findUnique({ where: { id: pgId } });
    if (!pg) throw new NotFoundError('PG property not found.');

    return await this.db.pG.update({
      where: { id: pgId },
      data: {
        status,
        rejectionReason,
        adminNotes,
      },
    });
  }

  async getKYCQueue(): Promise<any[]> {
    return await this.db.document.findMany({
      where: { status: VerificationStatus.PENDING },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, role: true, profile: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyKYCDocument(documentId: string, verifierId: string, status: VerificationStatus, rejectionReason?: string): Promise<any> {
    const doc = await this.db.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError('Document not found.');

    return await this.db.document.update({
      where: { id: documentId },
      data: {
        status,
        verifiedById: verifierId,
        verifiedAt: new Date(),
        rejectionReason,
      },
    });
  }

  async getAuditLogs(page: number = 1, limit: number = 50, resource?: string): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (resource) where.resource = resource;

    const [total, logs] = await Promise.all([
      this.db.auditLog.count({ where }),
      this.db.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { actor: { select: { id: true, username: true, email: true, role: true } } },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listAccountDeletionRequests(): Promise<User[]> {
    return await this.db.user.findMany({
      where: { deletionRequested: true },
      include: {
        profile: true,
        invoices: { where: { status: { in: ['UNPAID', 'OVERDUE'] } } },
        bookings: { where: { status: { in: ['APPLIED', 'WAITING', 'ACCEPTED', 'CONFIRMED'] } } },
      },
      orderBy: { deletionRequestedAt: 'desc' },
    });
  }
}
