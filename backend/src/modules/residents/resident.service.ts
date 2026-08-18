import { IResidentService, IOnboardResidentData, IVisitorPassData, IGatePassData } from '../../interfaces/services/IResidentService';
import { IResidentRepository } from '../../interfaces/repositories/IResidentRepository';
import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { ICryptoService } from '../../interfaces/infrastructure/ICryptoService';
import { AppError } from '../../utils/appError';
import { Role, PassStatus } from '@prisma/client';
import crypto from 'crypto';

export class ResidentService implements IResidentService {
  constructor(
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
    private readonly cryptoService: ICryptoService
  ) {}

  async onboardResident(data: IOnboardResidentData) {
    let user = data.userId ? await this.userRepository.findById(data.userId) : null;
    if (!user) {
      user = await this.userRepository.findByEmail(data.email);
    }

    if (!user) {
      const resCode = `RES${Math.floor(1000 + Math.random() * 9000)}`;
      const pwdHash = await this.cryptoService.hashPassword('Welcome@123');
      user = await this.userRepository.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        residentCode: resCode,
        passwordHash: pwdHash,
        role: Role.RESIDENT
      });
    }

    const bed = await this.residentRepository.findBedById(data.bedId);
    if (!bed || bed.isOccupied) {
      throw new AppError('The requested bed is no longer available.', 400);
    }

    const sensitiveKycPayload = JSON.stringify({
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      bankAccount: data.bankAccount,
      upiId: data.upiId
    });

    const encryptedKyc = this.cryptoService.encrypt(sensitiveKycPayload);

    const resident = await this.residentRepository.createResident({
      userId: user.id,
      propertyId: data.propertyId,
      bedId: data.bedId,
      idProofNumber: data.idProofNumber.replace(/.(?=.{4})/g, '*'),
      idProofUrl: data.idProofUrl,
      encryptedKycData: encryptedKyc,
      emergencyContact: data.emergencyContact,
      emergencyName: data.emergencyName,
      bloodGroup: data.bloodGroup,
      occupation: data.occupation,
      companyCollege: data.companyCollege,
      moveInDate: new Date(data.moveInDate),
      rentDueDate: new Date(new Date().setDate(5))
    });

    await this.residentRepository.updateBedOccupancy(data.bedId, true);

    return {
      residentId: resident.id,
      residentCode: user.residentCode || '',
      message: 'KYC onboarding completed successfully'
    };
  }

  async getDirectory(query: { propertyId?: string; search?: string; status?: string }) {
    return this.residentRepository.getDirectory(query);
  }

  async getPortalData(userId: string) {
    let resident = await this.residentRepository.findByUserId(userId);

    if (!resident) {
      const user = await this.userRepository.findById(userId);
      if (user) {
        try {
          if (typeof (this.residentRepository as any).ensureResidentProfile === 'function') {
            resident = await (this.residentRepository as any).ensureResidentProfile(user);
          } else {
            resident = await (this.residentRepository as any).db?.resident.create({
              data: {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "+919800000000",
                profilePicture: user.avatarUrl || "https://res.cloudinary.com/roombae/image/upload/v1700000000/default-avatar.png",
                status: "ACTIVE",
              },
            });
            resident = await this.residentRepository.findByUserId(user.id);
          }
        } catch {
          // fallback if auto-creation encounters database constraint
        }
      }
    }

    if (!resident) {
      throw new AppError('Resident profile record not found', 404, 'RESIDENT_PROFILE_INCOMPLETE');
    }

    let decryptedKyc = null;
    if (resident.encryptedKycData) {
      try {
        decryptedKyc = JSON.parse(this.cryptoService.decrypt(resident.encryptedKycData));
      } catch {}
    }

    const roomBeds = resident.bed?.roomId ? await this.residentRepository.findRoomBeds(resident.bed.roomId) : [];

    const roommates = roomBeds
      .filter(b => b.resident && b.resident.id !== resident.id)
      .map(b => ({
        name: b.resident?.user?.name,
        phone: b.resident?.user?.phone,
        bedNumber: b.bedNumber
      }));

    const roomNumber = resident.bed?.room?.roomNumber || 'N/A';
    const bedNumber = resident.bed?.bedNumber || 'Unassigned';
    const propertyName = resident.pg?.name || 'RoomBae Co-living';

    return {
      profile: {
        id: resident.id,
        name: resident.user?.name || resident.name,
        email: resident.user?.email || resident.email,
        phone: resident.user?.phone || resident.phone,
        residentCode: resident.user?.residentCode,
        roomNumber,
        bedNumber,
        propertyName,
        moveInDate: resident.moveInDate,
        rentDueDate: resident.rentDueDate,
        kycStatus: resident.encryptedKycData ? 'VERIFIED' : 'PENDING',
        kycDetails: decryptedKyc,
        status: resident.status || 'ACTIVE'
      },
      wifiCredentials: {
        ssid: `${propertyName}_Guest_WiFi`,
        password: `RoomBae@${roomNumber}`
      },
      roommates,
      payments: resident.payments || [],
      complaints: resident.complaints || [],
      visitorPasses: resident.visitors || [],
      gatePasses: resident.leaveApplications || [],
      agreements: resident.agreements || [],
      documents: resident.documents || [],
      mealSkips: []
    };
  }

  async createVisitorPass(userId: string, data: IVisitorPassData) {
    const resident = await this.residentRepository.findByUserId(userId);
    if (!resident) throw new AppError('Resident record not found', 404);

    const passCode = `VP-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const qrDataPayload = this.cryptoService.encrypt(JSON.stringify({
      passCode,
      residentId: resident.id,
      visitorName: data.visitorName,
      date: data.visitDate
    }));

    return this.residentRepository.createVisitorPass({
      passCode,
      residentId: resident.id,
      pgId: resident.pgId,
      visitorName: data.visitorName,
      visitorMobile: data.visitorMobile,
      relation: data.relation,
      visitDate: new Date(data.visitDate),
      timeSlot: data.timeSlot,
      status: PassStatus.APPROVED
    });
  }

  async createGatePass(userId: string, data: IGatePassData) {
    const resident = await this.residentRepository.findByUserId(userId);
    if (!resident) throw new AppError('Resident record not found', 404);

    const passCode = `GP-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    return this.residentRepository.createGatePass({
      passCode,
      residentId: resident.id,
      propertyId: resident.pgId,
      passType: data.passType,
      destination: data.destination,
      departureTime: new Date(data.departureTime),
      returnTime: new Date(data.returnTime),
      reason: data.reason,
      status: PassStatus.APPROVED
    });
  }

  async toggleMealSkip(userId: string, date: string, mealType: string) {
    const resident = await this.residentRepository.findByUserId(userId);
    if (!resident) throw new AppError('Resident record not found', 404);

    const targetDate = new Date(date);
    const existing = await this.residentRepository.findMealSkip(resident.id, mealType, targetDate);

    if (existing) {
      await this.residentRepository.deleteMealSkip(existing.id);
      return { skipped: false, message: 'Meal skip cancelled' };
    } else {
      await this.residentRepository.createMealSkip(resident.id, mealType, targetDate);
      return { skipped: true, message: 'Meal skip registered' };
    }
  }
}
