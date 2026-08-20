import { PrismaClient, User, Role } from "@prisma/client";
import {
  IUserRepository,
  ICreateUserData,
} from "../../interfaces/repositories/IUserRepository";
import { AppError } from "../../utils/appError";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

export class AuthRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) { }

  private get client(): any {
    return (global as any).prismaSingleton || this.db;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const clean = identifier.trim();
    const lower = clean.toLowerCase();
    const upper = clean.toUpperCase();
    const stripped = clean.replace(/\s+/g, "");
    const digitsOnly = clean.replace(/\D/g, "");

    const orConditions: any[] = [
      { email: lower },
      { residentCode: clean },
      { residentCode: upper },
      { residentCode: stripped },
      { residentCode: stripped.toUpperCase() },
      { phone: clean },
      { phone: stripped },
    ];

    if (digitsOnly.length >= 10) {
      const tenDigits = digitsOnly.slice(-10);
      orConditions.push(
        { phone: tenDigits },
        { phone: `+91${tenDigits}` },
        { phone: `+91 ${tenDigits}` },
        { phone: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}` },
        { phone: `91${tenDigits}` }
      );
    }

    return await this.client.user.findFirst({
      where: {
        OR: orConditions,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const clean = email.trim().toLowerCase();
    return await this.client.user.findFirst({
      where: { email: clean },
    });
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.client.user.findUnique({ where: { id } });
    } catch {
      return null;
    }
  }

  async findByGoogleSubId(googleSubId: string): Promise<User | null> {
    try {
      return await this.client.user.findFirst({ where: { googleSubId } });
    } catch {
      return null;
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      return await this.client.user.findFirst({ where: { phone } });
    } catch {
      return null;
    }
  }

  async findOrCreateGoogleUser(data: {
    googleSubId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role?: Role;
  }): Promise<User> {
    // 1. Try to find by Google sub id
    const bySub = await this.findByGoogleSubId(data.googleSubId);
    if (bySub) {
      await this.ensureUserProfile(bySub);
      return bySub;
    }

    // 2. Try to find by email and link the google sub id (preserves user's existing role!)
    const byEmail = await this.findByEmail(data.email);
    if (byEmail) {
      const updatedUser = await this.client.user.update({
        where: { id: byEmail.id },
        data: {
          googleSubId: data.googleSubId,
          avatarUrl: data.avatarUrl || byEmail.avatarUrl,
          emailVerified: true,
          authProvider: "GOOGLE",
        },
      });
      await this.ensureUserProfile(updatedUser);
      return updatedUser;
    }

    // 3. Auto-detect Role: default to RESIDENT if not provided
    const userRole = data.role && (data.role === Role.OWNER || data.role === Role.RESIDENT)
      ? data.role
      : Role.RESIDENT;

    const newUser = await this.client.user.create({
      data: {
        googleSubId: data.googleSubId,
        email: data.email.toLowerCase(),
        name: data.name,
        avatarUrl: data.avatarUrl,
        emailVerified: true,
        role: userRole,
        authProvider: "GOOGLE",
      },
    });

    // 4. Auto-create linked Owner or Resident profile record with real user data
    await this.ensureUserProfile(newUser);

    return newUser;
  }

  async ensureUserProfile(user: User): Promise<void> {
    try {
      if (user.role === Role.OWNER) {
        const existingOwner = await this.client.owner.findFirst({
          where: { OR: [{ userId: user.id }, { email: user.email }] },
        });
        if (!existingOwner) {
          try {
            await this.client.owner.create({
              data: {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                photo: user.avatarUrl || env.DEFAULT_OWNER_PHOTO_URL,
                address: "",
                aadhaarNumber: "",
                panNumber: "",
                upiId: "",
                bankName: "",
                accountNumber: "",
                ifscCode: "",
                emergencyContact: "",
              },
            });
          } catch (createErr: any) {
            logger.warn("Owner profile create note:", { userId: user.id, error: createErr?.message });
          }
        }
      } else if (user.role === Role.RESIDENT) {
        const existingResident = await this.client.resident.findFirst({
          where: { OR: [{ userId: user.id }, { email: user.email }] },
        });
        if (!existingResident) {
          try {
            await this.client.resident.create({
              data: {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                profilePicture: user.avatarUrl || env.DEFAULT_AVATAR_URL,
                status: "ACTIVE",
              },
            });
          } catch (createErr: any) {
            logger.warn("Resident profile create note:", { userId: user.id, error: createErr?.message });
          }
        }
      }
    } catch (profileErr: any) {
      logger.warn("Could not auto-create signup profile record:", { userId: user.id, error: profileErr?.message });
    }
  }

  async findOrCreatePhoneUser(data: {
    phone: string;
    name?: string;
    role?: Role;
  }): Promise<User> {
    const existing = await this.client.user.findFirst({
      where: { phone: data.phone },
    });

    if (existing) {
      return this.client.user.update({
        where: { id: existing.id },
        data: {
          phoneVerified: true,
          authProvider: existing.authProvider || "PHONE",
        },
      });
    }

    const cleanPhoneDigits = data.phone.replace(/\D/g, "");
    const generatedEmail = `phone_${cleanPhoneDigits}@roombae.user`;

    const byEmail = await this.client.user.findUnique({
      where: { email: generatedEmail },
    });

    if (byEmail) {
      return this.client.user.update({
        where: { id: byEmail.id },
        data: {
          phone: data.phone,
          phoneVerified: true,
          authProvider: "PHONE",
        },
      });
    }

    const newUser = await this.client.user.create({
      data: {
        name: data.name || `User ${cleanPhoneDigits.slice(-4)}`,
        email: generatedEmail,
        phone: data.phone,
        phoneVerified: true,
        role: data.role || Role.RESIDENT,
        authProvider: "PHONE",
      },
    });

    try {
      if (newUser.role === Role.RESIDENT) {
        await this.client.resident.create({
          data: {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || "",
            status: "ACTIVE",
          },
        });
      }
    } catch (err: any) {
      logger.warn("Could not auto-create phone resident profile:", { userId: newUser.id, error: err?.message });
    }

    return newUser;
  }

  async create(data: ICreateUserData): Promise<User> {
    const cleanEmail = data.email.trim().toLowerCase();
    const newUser = await this.client.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        passwordHash: data.passwordHash,
        phone: data.phone,
        role: data.role,
        residentCode: data.residentCode,
      },
    });

    try {
      if (newUser.role === Role.OWNER) {
        await this.client.owner.create({
          data: {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || "",
            photo: newUser.avatarUrl || env.DEFAULT_OWNER_PHOTO_URL,
            address: "",
            aadhaarNumber: "",
            panNumber: "",
            upiId: "",
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            emergencyContact: "",
          },
        });
      } else if (newUser.role === Role.RESIDENT) {
        await this.client.resident.create({
          data: {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || "",
            status: "ACTIVE",
          },
        });
      }
    } catch (err: any) {
      logger.warn("Could not auto-create profile for new user:", { userId: newUser.id, error: err?.message });
    }

    return newUser;
  }

  async updateOtp(
    id: string,
    otpSecret: string | null,
    otpExpiresAt: Date | null,
  ): Promise<User> {
    return this.client.user.update({
      where: { id },
      data: { otpSecret, otpExpiresAt },
    });
  }

  async updateOtpForPhone(phone: string, verified: boolean): Promise<User> {
    const user = await this.client.user.findFirst({
      where: { phone },
    });
    if (!user) throw new AppError("User not found", 404);

    return this.client.user.update({
      where: { id: user.id },
      data: { phoneVerified: verified, otpSecret: null, otpExpiresAt: null },
    });
  }

  async markEmailVerified(email: string): Promise<User> {
    const user = await this.client.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { email: email },
        ],
      },
    });
    if (!user) throw new AppError("User not found", 404);

    return this.client.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  async updateTwoFactor(
    id: string,
    secret: string | null,
    enabled: boolean,
    method?: string,
  ): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        twoFactorSecret: secret,
        is2FAEnabled: enabled,
        twoFactorMethod: method || (enabled ? "TOTP" : "NONE"),
      },
    });
  }
}