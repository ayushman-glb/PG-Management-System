import { PrismaClient, User, Role } from "@prisma/client";
import {
  IUserRepository,
  ICreateUserData,
} from "../../interfaces/repositories/IUserRepository";

export class AuthRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) { }

  async findByIdentifier(identifier: string): Promise<User | null> {
    try {
      return await this.db.user.findFirst({
        where: {
          OR: [{ email: identifier }, { residentCode: identifier }],
        },
      });
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({ where: { email } });
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({ where: { id } });
    } catch {
      return null;
    }
  }

  async findByGoogleSubId(googleSubId: string): Promise<User | null> {
    try {
      return await this.db.user.findFirst({ where: { googleSubId } });
    } catch {
      return null;
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      return await this.db.user.findFirst({ where: { phone } });
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
    if (bySub) return bySub;

    // 2. Try to find by email and link the google sub id
    const byEmail = await this.findByEmail(data.email);
    if (byEmail) {
      return this.db.user.update({
        where: { id: byEmail.id },
        data: {
          googleSubId: data.googleSubId,
          avatarUrl: data.avatarUrl || byEmail.avatarUrl,
          emailVerified: true,
          authProvider: "GOOGLE",
        },
      });
    }

    // 3. Create a brand-new user
    return this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        googleSubId: data.googleSubId,
        avatarUrl: data.avatarUrl,
        role: data.role || Role.OWNER,
        emailVerified: true,
        authProvider: "GOOGLE",
      },
    });
  }

  async findOrCreatePhoneUser(data: {
    phone: string;
    name?: string;
    role?: Role;
  }): Promise<User> {
    const existing = await this.db.user.findFirst({
      where: { phone: data.phone },
    });

    if (existing) {
      return this.db.user.update({
        where: { id: existing.id },
        data: {
          phoneVerified: true,
          authProvider: existing.authProvider || "PHONE",
        },
      });
    }

    const cleanPhoneDigits = data.phone.replace(/\D/g, "");
    const generatedEmail = `phone_${cleanPhoneDigits}@roombae.user`;

    const byEmail = await this.db.user.findUnique({
      where: { email: generatedEmail },
    });

    if (byEmail) {
      return this.db.user.update({
        where: { id: byEmail.id },
        data: {
          phone: data.phone,
          phoneVerified: true,
          authProvider: "PHONE",
        },
      });
    }

    return this.db.user.create({
      data: {
        name: data.name || `User ${cleanPhoneDigits.slice(-4)}`,
        email: generatedEmail,
        phone: data.phone,
        phoneVerified: true,
        role: data.role || Role.RESIDENT,
        authProvider: "PHONE",
      },
    });
  }

  async create(data: ICreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        role: data.role,
        residentCode: data.residentCode,
      },
    });
  }

  async updateOtp(
    id: string,
    otpSecret: string | null,
    otpExpiresAt: Date | null,
  ): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { otpSecret, otpExpiresAt },
    });
  }
}
