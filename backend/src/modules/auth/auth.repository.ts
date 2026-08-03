import { PrismaClient, User } from '@prisma/client';
import { IUserRepository, ICreateUserData } from '../../interfaces/repositories/IUserRepository';

export class AuthRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByIdentifier(identifier: string): Promise<User | null> {
    try {
      return await this.db.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { residentCode: identifier }
          ]
        }
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

  async create(data: ICreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        role: data.role,
        residentCode: data.residentCode
      }
    });
  }

  async updateOtp(id: string, otpSecret: string | null, otpExpiresAt: Date | null): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { otpSecret, otpExpiresAt }
    });
  }
}
