import { PrismaClient, User, Role } from "@prisma/client";
import {
  IUserRepository,
  ICreateUserData,
} from "../../interfaces/repositories/IUserRepository";

export class AuthRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) { }

  async findByIdentifier(identifier: string): Promise<User | null> {
    try {
      const clean = identifier.trim();
      const lower = clean.toLowerCase();
      return await this.db.user.findFirst({
        where: {
          OR: [
            { email: { equals: clean, mode: "insensitive" } },
            { email: { equals: lower, mode: "insensitive" } },
            { residentCode: { equals: clean, mode: "insensitive" } },
            { email: clean },
            { residentCode: clean },
          ],
        },
      });
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const clean = email.trim().toLowerCase();
      return await this.db.user.findFirst({
        where: {
          OR: [
            { email: { equals: clean, mode: "insensitive" } },
            { email: clean },
          ],
        },
      });
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
    const newUser = await this.db.user.create({
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

    // 4. Auto-create linked Owner or Resident profile record
    try {
      if (newUser.role === Role.OWNER) {
        const existingOwner = await this.db.owner.findFirst({ where: { userId: newUser.id } });
        if (!existingOwner) {
          await this.db.owner.create({
            data: {
              userId: newUser.id,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone || "+919876543210",
              photo: newUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
              address: "Indiranagar, Bengaluru",
              aadhaarNumber: "452189012345",
              panNumber: "ABCDE1234F",
              upiId: "owner@okaxis",
              bankName: "HDFC Bank",
              accountNumber: "5010023456789",
              ifscCode: "HDFC0001234",
              emergencyContact: "+919123456789",
            },
          });
        }
      } else if (newUser.role === Role.RESIDENT) {
        const existingResident = await this.db.resident.findFirst({ where: { userId: newUser.id } });
        if (!existingResident) {
          const defaultPg = await this.db.pG.findFirst();
          const defaultBed = await this.db.bed.findFirst();
          await this.db.resident.create({
            data: {
              userId: newUser.id,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone || "+919800000000",
              profilePicture: newUser.avatarUrl || "https://images.unsplash.com/photo-1500000000000?w=300",
              pgId: defaultPg?.id || null,
              bedId: defaultBed?.id || null,
              gender: "Male",
              age: 22,
              permanentAddress: "Indiranagar, Bengaluru",
              occupation: "Software Engineer",
              bloodGroup: "O+",
              status: "ACTIVE",
            },
          });
        }
      }
    } catch (profileErr) {
      console.warn("⚠️ Could not auto-create signup profile record:", profileErr);
    }

    return newUser;
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

    const newUser = await this.db.user.create({
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
        const defaultPg = await this.db.pG.findFirst();
        const defaultBed = await this.db.bed.findFirst();
        await this.db.resident.create({
          data: {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || "+919800000000",
            pgId: defaultPg?.id || null,
            bedId: defaultBed?.id || null,
            status: "ACTIVE",
          },
        });
      }
    } catch (err) {
      console.warn("⚠️ Could not auto-create phone resident profile:", err);
    }

    return newUser;
  }

  async create(data: ICreateUserData): Promise<User> {
    const newUser = await this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        role: data.role,
        residentCode: data.residentCode,
      },
    });

    try {
      if (newUser.role === Role.OWNER) {
        await this.db.owner.create({
          data: {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || "+919876543210",
            photo: newUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
            address: "Indiranagar, Bengaluru",
            aadhaarNumber: "452189012345",
            panNumber: "ABCDE1234F",
            upiId: "owner@okaxis",
            bankName: "HDFC Bank",
            accountNumber: "5010023456789",
            ifscCode: "HDFC0001234",
            emergencyContact: "+919123456789",
          },
        });
      } else if (newUser.role === Role.RESIDENT) {
        const defaultPg = await this.db.pG.findFirst();
        const defaultBed = await this.db.bed.findFirst();
        await this.db.resident.create({
          data: {
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || "+919800000000",
            pgId: defaultPg?.id || null,
            bedId: defaultBed?.id || null,
            status: "ACTIVE",
          },
        });
      }
    } catch (err) {
      console.warn("⚠️ Could not auto-create profile for new user:", err);
    }

    return newUser;
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
