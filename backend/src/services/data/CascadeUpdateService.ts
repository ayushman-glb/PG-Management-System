import { PrismaClient, User, Role } from '@prisma/client';
import { prisma as defaultPrisma } from '../../config/prisma';
import { SocketServer } from '../../socket/socketServer';
import { TokenVersionService } from '../security/TokenVersionService';
import { logger } from '../../utils/logger';

export interface ICascadeUserUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: Role;
  accountStatus?: string;
  kycStatus?: string;
}

export interface ICascadeUpdateResult {
  user: User;
  ownerUpdated: boolean;
  residentUpdated: boolean;
  cacheInvalidated: boolean;
  tokenVersionIncremented: boolean;
}

export class CascadeUpdateService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  private get client(): PrismaClient {
    return (global as any).prismaSingleton || this.prisma;
  }

  /**
   * Atomically cascades user profile updates across User, Owner, Resident, TokenVersion, and WebSockets.
   */
  async updateUserData(
    userId: string,
    data: ICascadeUserUpdateInput,
    options: {
      incrementTokenVersion?: boolean;
      actorId?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<ICascadeUpdateResult> {
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : undefined;
    const cleanPhone = data.phone ? data.phone.trim() : undefined;

    let ownerUpdated = false;
    let residentUpdated = false;

    // Execute atomic relational updates across MongoDB collections
    const updatedUser = await this.client.$transaction(async (tx) => {
      // 1. Update the root User document
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(cleanEmail && { email: cleanEmail }),
          ...(cleanPhone && { phone: cleanPhone }),
          ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
          ...(data.role && { role: data.role }),
          ...(data.accountStatus && { accountStatus: data.accountStatus }),
          ...(data.kycStatus && { kycStatus: data.kycStatus }),
        },
      });

      // 2. Cascade update to Owner collection if present
      const owner = await tx.owner.findFirst({ where: { userId } });
      if (owner) {
        await tx.owner.update({
          where: { id: owner.id },
          data: {
            ...(data.name && { name: data.name }),
            ...(cleanEmail && { email: cleanEmail }),
            ...(cleanPhone && { phone: cleanPhone }),
            ...(data.avatarUrl && { photo: data.avatarUrl }),
          },
        });
        ownerUpdated = true;
      }

      // 3. Cascade update to Resident collection if present
      const resident = await tx.resident.findFirst({ where: { userId } });
      if (resident) {
        await tx.resident.update({
          where: { id: resident.id },
          data: {
            ...(data.name && { name: data.name }),
            ...(cleanEmail && { email: cleanEmail }),
            ...(cleanPhone && { phone: cleanPhone }),
            ...(data.avatarUrl && { profilePicture: data.avatarUrl }),
          },
        });
        residentUpdated = true;
      }

      // 4. Log Activity
      await tx.activityLog.create({
        data: {
          userId,
          action: 'USER_PROFILE_CASCADE_UPDATED',
          ipAddress: options.ipAddress || 'internal',
          userAgent: options.userAgent || 'RoomBae Cascade Engine',
          details: JSON.stringify({
            fieldsUpdated: Object.keys(data),
            ownerUpdated,
            residentUpdated,
          }),
        },
      });

      return user;
    });

    // 5. Invalidate local token version cache
    await TokenVersionService.invalidateCache(userId);
    const cacheInvalidated = true;

    // 6. Increment Token Version if requested (e.g. role, email, status changes)
    let tokenVersionIncremented = false;
    if (options.incrementTokenVersion || data.role || data.accountStatus) {
      try {
        await TokenVersionService.incrementTokenVersion(userId);
        tokenVersionIncremented = true;
      } catch (err: any) {
        logger.warn('⚠️ TokenVersion increment error:', err.message);
      }
    }

    // 7. Emit Real-time WebSocket Event to user's personal room
    try {
      const io = SocketServer.getIO();
      if (io) {
        io.to(`user_${userId}`).emit('profile_updated', {
          userId,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatarUrl: updatedUser.avatarUrl,
          role: updatedUser.role,
        });
      }
    } catch {
      // Socket emission is best-effort
    }

    return {
      user: updatedUser,
      ownerUpdated,
      residentUpdated,
      cacheInvalidated,
      tokenVersionIncremented,
    };
  }
}
