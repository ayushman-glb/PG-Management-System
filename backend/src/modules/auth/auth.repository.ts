import { PrismaClient, User, Role, UserProfile, Device, Session, OTP, OTPType, LegalDocType, AuthProvider, AuthIdentity } from '@prisma/client';
import { prisma } from '../../config/prisma';
import crypto from 'crypto';

export interface ICreateUserData {
  email: string;
  phone?: string;
  username: string;
  passwordHash?: string;
  role: Role;
  currentAddress?: string;
  firstName: string;
  lastName: string;
  gender?: any;
  dateOfBirth?: Date;
  occupation?: string;
}

export interface ICreateGoogleUserData {
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  providerSubject: string;
  providerProfile?: any;
}

export interface ICompleteProfileData {
  phone: string;
  currentAddress?: string;
  firstName?: string;
  lastName?: string;
  gender?: any;
  dateOfBirth?: Date;
  occupation?: string;
  companyOrCollege?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export class AuthRepository {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    if (!identifier || typeof identifier !== 'string') return null;
    const clean = identifier.trim().toLowerCase();
    return await this.db.user.findFirst({
      where: {
        OR: [
          { email: clean },
          { username: clean },
          { phone: identifier.trim() },
        ],
      },
      include: {
        profile: true,
        devices: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { profile: true, devices: true },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { phone: phone.trim() },
      include: { profile: true, devices: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { username: username.trim().toLowerCase() },
      include: { profile: true, devices: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { id },
      include: { profile: true, devices: true },
    });
  }

  async createUser(data: ICreateUserData): Promise<User> {
    return await this.db.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : undefined,
        username: data.username.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        currentAddress: data.currentAddress,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            occupation: data.occupation,
          },
        },
      },
      include: { profile: true },
    });
  }

  async createOTP(identifier: string, codeHash: string, type: OTPType, userId?: string): Promise<OTP> {
    // Invalidate previous OTPs for this identifier & type
    await this.db.oTP.updateMany({
      where: { identifier, type, isUsed: false },
      data: { isUsed: true },
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    return await this.db.oTP.create({
      data: {
        identifier,
        codeHash,
        type,
        userId,
        expiresAt,
      },
    });
  }

  async findValidOTP(identifier: string, type: OTPType): Promise<OTP | null> {
    return await this.db.oTP.findFirst({
      where: {
        identifier,
        type,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markOTPUsed(otpId: string): Promise<void> {
    await this.db.oTP.update({
      where: { id: otpId },
      data: { isUsed: true },
    });
  }

  async incrementOTPAttempts(otpId: string): Promise<OTP> {
    return await this.db.oTP.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  async markPhoneVerified(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async createSession(userId: string, refreshTokenHash: string, deviceId?: string, userAgent?: string, ipAddress?: string): Promise<Session> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return await this.db.session.create({
      data: {
        userId,
        refreshTokenHash,
        deviceId,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }

  async findSessionByTokenHash(refreshTokenHash: string): Promise<(Session & { user: User }) | null> {
    return await this.db.session.findFirst({
      where: {
        refreshTokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.db.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.db.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async registerDevice(userId: string, visitorId: string, deviceLabel: string, ipAddress?: string, userAgent?: string, browser?: string, os?: string, screenResolution?: string): Promise<Device> {
    const existingDevices = await this.db.device.findMany({ where: { userId } });
    const isFirstDevice = existingDevices.length === 0;

    const existingThisDevice = existingDevices.find((d) => d.visitorId === visitorId);
    if (existingThisDevice) {
      return await this.db.device.update({
        where: { id: existingThisDevice.id },
        data: {
          lastActiveAt: new Date(),
          ipAddress,
          browser,
          os,
          screenResolution,
        },
      });
    }

    return await this.db.device.create({
      data: {
        userId,
        visitorId,
        deviceLabel,
        isPrimary: isFirstDevice,
        ipAddress,
        browser,
        os,
        screenResolution,
      },
    });
  }

  async transferPrimaryDevice(userId: string, currentPrimaryDeviceId: string, targetDeviceId: string): Promise<void> {
    await this.db.$transaction([
      this.db.device.update({
        where: { id: currentPrimaryDeviceId, userId },
        data: { isPrimary: false },
      }),
      this.db.device.update({
        where: { id: targetDeviceId, userId },
        data: { isPrimary: true },
      }),
    ]);
  }

  async recordLegalAcceptance(userId: string, documentType: LegalDocType, documentVersion: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const doc = await this.db.legalDocument.findFirst({
      where: { type: documentType, version: documentVersion },
    });

    if (doc) {
      await this.db.legalAcceptance.create({
        data: {
          userId,
          documentId: doc.id,
          documentType,
          documentVersion,
          ipAddress,
          userAgent,
        },
      });
    }
  }

  async findIdentityByProvider(provider: AuthProvider, providerSubject: string): Promise<(AuthIdentity & { user: User & { profile: UserProfile | null; devices: Device[] } }) | null> {
    return await this.db.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider,
          providerSubject,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
            devices: true,
          },
        },
      },
    });
  }

  async findIdentitiesByUserId(userId: string): Promise<AuthIdentity[]> {
    return await this.db.authIdentity.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createGoogleUserWithIdentity(data: ICreateGoogleUserData): Promise<User & { profile: UserProfile | null; devices: Device[]; authIdentities: AuthIdentity[] }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const usernameBase = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
    const uniqueUsername = `${usernameBase}_${crypto.randomBytes(3).toString('hex')}`;
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    return await this.db.user.create({
      data: {
        email: cleanEmail,
        username: uniqueUsername,
        role: data.role,
        avatarUrl: data.avatarUrl,
        emailVerified: true,
        phoneVerified: false,
        isProfileComplete: false,
        twoFactorEnabled: false,
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
        authIdentities: {
          create: {
            provider: AuthProvider.GOOGLE,
            providerSubject: data.providerSubject,
            providerEmail: cleanEmail,
            emailVerified: true,
            providerProfile: data.providerProfile || {},
          },
        },
      },
      include: {
        profile: true,
        devices: true,
        authIdentities: true,
      },
    });
  }

  async linkGoogleIdentity(userId: string, providerSubject: string, providerEmail: string, providerProfile?: any): Promise<AuthIdentity> {
    return await this.db.authIdentity.create({
      data: {
        userId,
        provider: AuthProvider.GOOGLE,
        providerSubject,
        providerEmail: providerEmail.toLowerCase(),
        emailVerified: true,
        providerProfile: providerProfile || {},
      },
    });
  }

  async unlinkGoogleIdentity(userId: string): Promise<void> {
    await this.db.authIdentity.deleteMany({
      where: {
        userId,
        provider: AuthProvider.GOOGLE,
      },
    });
  }

  async updateIdentityLastUsed(identityId: string): Promise<void> {
    await this.db.authIdentity.update({
      where: { id: identityId },
      data: { lastUsedAt: new Date() },
    });
  }

  async completeUserProfile(userId: string, data: ICompleteProfileData): Promise<User & { profile: UserProfile | null }> {
    return await this.db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          phone: data.phone.trim(),
          phoneVerified: true,
          isProfileComplete: true,
          currentAddress: data.currentAddress || undefined,
        },
      });

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          firstName: data.firstName || 'User',
          lastName: data.lastName || '',
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          occupation: data.occupation,
          companyOrCollege: data.companyOrCollege,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
        },
        update: {
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          gender: data.gender || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          occupation: data.occupation || undefined,
          companyOrCollege: data.companyOrCollege || undefined,
          emergencyContactName: data.emergencyContactName || undefined,
          emergencyContactPhone: data.emergencyContactPhone || undefined,
        },
      });

      return await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true },
      });
    });
  }
}