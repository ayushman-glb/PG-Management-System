import { IResidentService, IOnboardResidentData, IVisitorPassData, IGatePassData } from '../interfaces/services/IResidentService';
import { IResidentRepository } from '../interfaces/repositories/IResidentRepository';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { ICryptoService } from '../interfaces/infrastructure/ICryptoService';
import { AppError } from '../utils/appError';
import { Role, PassStatus } from '@prisma/client';
import crypto from 'crypto';

export class ResidentService implements IResidentService {
  constructor(
    private readonly residentRepository: IResidentRepository,
    private readonly userRepository: IUserRepository,
    private readonly cryptoService: ICryptoService
  ) {}

  /**
   * 5-Step KYC Onboarding Submission with AES-256-GCM Encrypted KYC Data
   */
  async onboardResident(data: IOnboardResidentData) {
    // 1. Ensure User account exists or create
    let user = data.userId ? await this.userRepository.findById(data.userId) : null;
    if (!user) {
      user = await this.userRepository.findByEmail(data.email);
    }

    if (!user) {
      const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
      const resCode = `RB-${new Date().getFullYear()}-${entropy}`;
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

    // 2. Check bed availability
    const bed = await this.residentRepository.findBedById(data.bedId);
    if (!bed || bed.isOccupied) {
      throw new AppError('The requested bed is no longer available.', 400);
    }

    // 3. Encrypt sensitive KYC payload (Aadhaar, PAN, Guardian, Bank details)
    const sensitiveKycPayload = JSON.stringify({
      aadhaarNumber: data.aadhaarNumber,
      panNumber: data.panNumber,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      bankAccount: data.bankAccount,
      upiId: data.upiId
    });

    const encryptedKyc = this.cryptoService.encrypt(sensitiveKycPayload);

    // 4. Create Resident Record
    const resident = await this.residentRepository.createResident({
      userId: user.id,
      propertyId: data.propertyId,
      bedId: data.bedId,
      idProofNumber: data.idProofNumber.replace(/.(?=.{4})/g, '*'), // Masked
      idProofUrl: data.idProofUrl,
      encryptedKycData: encryptedKyc,
      emergencyContact: data.emergencyContact,
      emergencyName: data.emergencyName,
      bloodGroup: data.bloodGroup,
      occupation: data.occupation,
      companyCollege: data.companyCollege,
      moveInDate: new Date(data.moveInDate),
      rentDueDate: new Date(new Date().setDate(5)) // Default 5th of month
    });

    // 5. Mark Bed Occupied
    await this.residentRepository.updateBedOccupancy(data.bedId, true);

    return {
      residentId: resident.id,
      residentCode: user.residentCode || '',
      message: 'KYC onboarding completed successfully'
    };
  }

  /**
   * Owner Directory Query with filtering
   */
  async getDirectory(query: { propertyId?: string; search?: string; status?: string }) {
    return this.residentRepository.getDirectory(query);
  }

  /**
   * Resident Portal Self-Service Data
   */
  async getPortalData(userId: string) {
    const resident = await this.residentRepository.findByUserId(userId);

    if (!resident) {
      throw new AppError('Resident profile record not found', 404);
    }

    // Decrypt sensitive KYC data for self-view
    let decryptedKyc = null;
    if (resident.encryptedKycData) {
      try {
        decryptedKyc = JSON.parse(this.cryptoService.decrypt(resident.encryptedKycData));
      } catch (e) {}
    }

    // Roommate profiles
    const roomBeds = await this.residentRepository.findRoomBeds(resident.bed.roomId);

    const roommates = roomBeds
      .filter(b => b.resident && b.resident.id !== resident.id)
      .map(b => ({
        name: b.resident?.user?.name,
        phone: b.resident?.user?.phone,
        bedNumber: b.bedNumber
      }));

    return {
      profile: {
        id: resident.id,
        name: resident.user.name,
        email: resident.user.email,
        phone: resident.user.phone,
        residentCode: resident.user.residentCode,
        roomNumber: resident.bed.room.roomNumber,
        bedNumber: resident.bed.bedNumber,
        propertyName: resident.property.name,
        moveInDate: resident.moveInDate,
        rentDueDate: resident.rentDueDate,
        kycStatus: 'VERIFIED',
        kycDetails: decryptedKyc
      },
      wifiCredentials: {
        ssid: `${resident.property.name}_Guest_WiFi`,
        password: `RoomBae@${resident.bed.room.roomNumber}`
      },
      roommates,
      payments: resident.payments || [],
      complaints: resident.complaints || [],
      visitorPasses: resident.visitorPasses || [],
      gatePasses: resident.gatePasses || [],
      mealSkips: resident.mealSkips || []
    };
  }

  /**
   * Create Digital Visitor Pass with Encrypted QR Token
   */
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
      propertyId: resident.propertyId,
      visitorName: data.visitorName,
      visitorMobile: data.visitorMobile,
      relation: data.relation,
      visitDate: new Date(data.visitDate),
      timeSlot: data.timeSlot,
      qrCodeData: qrDataPayload,
      status: PassStatus.APPROVED
    });
  }

  /**
   * Create Outing Gate Pass
   */
  async createGatePass(userId: string, data: IGatePassData) {
    const resident = await this.residentRepository.findByUserId(userId);
    if (!resident) throw new AppError('Resident record not found', 404);

    const passCode = `GP-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    return this.residentRepository.createGatePass({
      passCode,
      residentId: resident.id,
      propertyId: resident.propertyId,
      passType: data.passType,
      destination: data.destination,
      departureTime: new Date(data.departureTime),
      returnTime: new Date(data.returnTime),
      reason: data.reason,
      status: PassStatus.APPROVED
    });
  }

  /**
   * Toggle Meal Skip
   */
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
