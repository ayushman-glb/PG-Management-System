import { PrismaClient, OwnerKYCStatus, BusinessType, PropertyType, PropertyOwnershipType, SubscriptionPlanType, SubscriptionStatus, DraftStatus, RoomType } from '@prisma/client';
import {
  IOwnerOnboardingService,
  PersonalDetailsInput,
  OwnerKYCInput,
  BusinessInfoInput,
  BankDetailsInput,
  PropertyInfoInput,
  LocationInput,
  BuildingSpecsInput,
  RoomConfigInput,
  SubscriptionSelectionInput
} from '../../services/IOwnerOnboardingService';
import { ICryptoService } from '../../interfaces/infrastructure/ICryptoService';
import { Container } from '../../container';

/** Resolve the crypto service lazily so we don't create a circular dep at module load time. */
function getCrypto(): ICryptoService {
  return Container.cryptoService;
}

export class OwnerService implements IOwnerOnboardingService {
  constructor(private readonly prisma: PrismaClient) {}

  async savePersonalDetails(ownerId: string, input: PersonalDetailsInput): Promise<any> {
    return this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        name: input.fullName,
        photo: input.photoUrl,
        phone: input.phone,
        email: input.email,
        address: `${input.address}, ${input.city}, ${input.state}, ${input.country} - ${input.pincode}`,
        emergencyContact: input.emergencyContact || ''
      }
    });
  }

  async submitKYC(ownerId: string, input: OwnerKYCInput): Promise<any> {
    const crypto = getCrypto();
    // Encrypt all PII fields before persistence — AES-256-GCM
    const encAadhaar   = input.aadhaarNumber ? crypto.encrypt(input.aadhaarNumber) : '';
    const encPan       = input.panNumber ? crypto.encrypt(input.panNumber) : '';
    const encPassport  = input.passportNumber ? crypto.encrypt(input.passportNumber) : undefined;
    const encDL        = input.drivingLicenseNo ? crypto.encrypt(input.drivingLicenseNo) : undefined;

    return this.prisma.ownerKYC.upsert({
      where: { ownerId },
      create: {
        ownerId,
        aadhaarNumber: encAadhaar,
        aadhaarDocUrl: input.aadhaarDocUrl,
        panNumber: encPan,
        panDocUrl: input.panDocUrl,
        passportNumber: encPassport,
        passportDocUrl: input.passportDocUrl,
        drivingLicenseNo: encDL,
        drivingLicenseUrl: input.drivingLicenseUrl,
        ownerSelfieUrl: input.ownerSelfieUrl,
        faceVerificationToken: input.faceVerificationToken || `FACE_VERIFIED_${Date.now()}`,
        digitalSignatureUrl: input.digitalSignatureUrl,
        verificationStatus: OwnerKYCStatus.PENDING,
      },
      update: {
        aadhaarNumber: encAadhaar,
        aadhaarDocUrl: input.aadhaarDocUrl,
        panNumber: encPan,
        panDocUrl: input.panDocUrl,
        passportNumber: encPassport,
        passportDocUrl: input.passportDocUrl,
        drivingLicenseNo: encDL,
        drivingLicenseUrl: input.drivingLicenseUrl,
        ownerSelfieUrl: input.ownerSelfieUrl,
        faceVerificationToken: input.faceVerificationToken,
        digitalSignatureUrl: input.digitalSignatureUrl,
        verificationStatus: OwnerKYCStatus.PENDING,
      },
    });
  }

  async saveBusinessInfo(ownerId: string, input: BusinessInfoInput): Promise<any> {
    if (input.gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(input.gstin)) {
        throw new Error('Invalid GSTIN format. Expected standard 15-character Indian GSTIN format.');
      }
    }

    return this.prisma.business.upsert({
      where: { ownerId },
      create: {
        ownerId,
        businessName: input.businessName,
        businessType: input.businessType as BusinessType,
        gstin: input.gstin,
        panNumber: input.panNumber,
        businessAddress: input.businessAddress,
        businessEmail: input.businessEmail,
        businessPhone: input.businessPhone,
        registrationNumber: input.registrationNumber,
        tradeLicenseDocUrl: input.tradeLicenseDocUrl
      },
      update: {
        businessName: input.businessName,
        businessType: input.businessType as BusinessType,
        gstin: input.gstin,
        panNumber: input.panNumber,
        businessAddress: input.businessAddress,
        businessEmail: input.businessEmail,
        businessPhone: input.businessPhone,
        registrationNumber: input.registrationNumber,
        tradeLicenseDocUrl: input.tradeLicenseDocUrl
      }
    });
  }

  async saveBankDetails(ownerId: string, input: BankDetailsInput): Promise<any> {
    if (input.accountNumber !== input.confirmAccountNumber) {
      throw new Error('Account number confirmation does not match.');
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(input.ifscCode)) {
      throw new Error('Invalid IFSC code format (e.g. SBIN0001234).');
    }

    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(input.upiId)) {
      throw new Error('Invalid UPI ID format (e.g. owner@upi).');
    }

    const crypto = getCrypto();
    // Encrypt sensitive bank fields — AES-256-GCM
    const encAccount = crypto.encrypt(input.accountNumber);
    const encIfsc    = crypto.encrypt(input.ifscCode);

    return this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        bankName: input.bankName,
        accountNumber: encAccount,
        ifscCode: encIfsc,
        upiId: input.upiId, // UPI IDs are not classically PII — stored plain
      },
    });
  }

  async registerPGProperty(ownerId: string, input: PropertyInfoInput): Promise<any> {
    const slug = input.pgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    return this.prisma.pG.create({
      data: {
        ownerId,
        name: input.pgName,
        slug,
        logo: 'https://res.cloudinary.com/roombae/image/upload/v1700000000/default-logo.png',
        galleryImages: ['https://res.cloudinary.com/roombae/image/upload/v1700000000/default-gallery.png'],
        description: `${input.propertyType} Co-living residence managed by RoomBae Enterprise Platform`,
        amenities: ['WiFi', 'Laundry', 'CCTV', 'Power Backup', 'Lift', 'Mess'],
        rules: ['No Smoking', 'No Alcohol', 'Visitor Lobby Access Till 8 PM'],
        rentStartingFrom: input.rentStartingFrom,
        securityDeposit: input.securityDeposit,
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Indiranagar Main Road',
        city: 'Bengaluru',
        pincode: '560038',
        capacity: 30,
        availableBeds: 30,
        propertyType: input.propertyType as PropertyType,
        ownershipType: input.ownershipType as PropertyOwnershipType,
        landlordName: input.landlordName,
        landlordLeaseAgreementUrl: input.landlordLeaseAgreementUrl,
        nocDocumentUrl: input.nocDocumentUrl,
        draftStatus: DraftStatus.DRAFT
      }
    });
  }

  async saveLocation(pgId: string, input: LocationInput): Promise<any> {
    return this.prisma.pG.update({
      where: { id: pgId },
      data: {
        address: input.address,
        city: input.city,
        pincode: input.pincode,
        latitude: input.latitude,
        longitude: input.longitude,
      }
    });
  }

  async configureBuildingAndAmenities(pgId: string, input: BuildingSpecsInput): Promise<any> {
    return this.prisma.pG.update({
      where: { id: pgId },
      data: {
        buildingCount: 1,
        floorCount: input.floorsCount,
        amenities: input.amenitiesList || ['WiFi', 'CCTV'],
        caretakerName: input.caretakerName,
        caretakerPhone: input.caretakerPhone
      }
    });
  }

  async batchCreateRoomsAndBeds(pgId: string, input: RoomConfigInput): Promise<any> {
    const createdBuildings = [];

    const building = await this.prisma.building.create({
      data: {
        pgId,
        name: `Main Block`,
        floorsCount: input.floorsCount
      }
    });

    let bedsPerRoom = 2;
    if (input.roomType === 'SINGLE') bedsPerRoom = 1;
    if (input.roomType === 'TRIPLE') bedsPerRoom = 3;
    if (input.roomType === 'FOUR_SHARING') bedsPerRoom = 4;
    if (input.roomType === 'CUSTOM' && input.customCapacity) bedsPerRoom = input.customCapacity;

    for (let f = 1; f <= input.floorsCount; f++) {
      const floor = await this.prisma.floor.create({
        data: {
          buildingId: building.id,
          floorNumber: f
        }
      });

      for (let r = 1; r <= input.roomsPerFloor; r++) {
        const roomNum = `${f}0${r}`;
        const room = await this.prisma.room.create({
          data: {
            floorId: floor.id,
            roomNumber: roomNum,
            roomType: input.roomType as RoomType,
            acType: 'NON_AC',
            washroomType: 'ATTACHED',
            rentAmount: input.rentAmount
          }
        });

        for (let bedIdx = 1; bedIdx <= bedsPerRoom; bedIdx++) {
          const bedChar = String.fromCharCode(64 + bedIdx);
          await this.prisma.bed.create({
            data: {
              roomId: room.id,
              bedNumber: `${roomNum}-${bedChar}`
            }
          });
        }
      }
    }

    createdBuildings.push(building);

    const totalRooms = input.floorsCount * input.roomsPerFloor;
    const totalBeds = totalRooms * bedsPerRoom;

    await this.prisma.pG.update({
      where: { id: pgId },
      data: {
        totalRoomsCount: totalRooms,
        totalBedsCount: totalBeds,
        capacity: totalBeds,
        availableBeds: totalBeds
      }
    });

    return { totalRooms, totalBeds, buildingsCount: createdBuildings.length };
  }

  async selectSubscriptionPlan(ownerId: string, input: SubscriptionSelectionInput): Promise<any> {
    const planConfigMap: Record<SubscriptionPlanType, { maxResidents: number; maxProperties: number }> = {
      STARTER: { maxResidents: 30, maxProperties: 1 },
      PROFESSIONAL: { maxResidents: 150, maxProperties: 5 },
      BUSINESS: { maxResidents: 500, maxProperties: 15 },
      ENTERPRISE: { maxResidents: 9999, maxProperties: 100 }
    };

    const config = planConfigMap[input.planType as SubscriptionPlanType] || planConfigMap.STARTER;
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setFullYear(now.getFullYear() + 1);

    return this.prisma.subscription.upsert({
      where: { ownerId },
      create: {
        ownerId,
        planType: input.planType as SubscriptionPlanType,
        status: SubscriptionStatus.ACTIVE,
        maxResidents: config.maxResidents,
        maxProperties: config.maxProperties,
        hasAnalytics: true,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentTxnId: `TXN_SUB_${Date.now()}`
      },
      update: {
        planType: input.planType as SubscriptionPlanType,
        status: SubscriptionStatus.ACTIVE,
        maxResidents: config.maxResidents,
        maxProperties: config.maxProperties,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentTxnId: `TXN_SUB_${Date.now()}`
      }
    });
  }

  async submitForAdminApproval(pgId: string): Promise<any> {
    return this.prisma.pG.update({
      where: { id: pgId },
      data: {
        draftStatus: DraftStatus.PENDING_APPROVAL
      }
    });
  }

  async getOnboardingProgress(ownerId: string): Promise<any> {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        kyc: true,
        business: true,
        subscription: true,
        pgs: true
      }
    });

    if (!owner) throw new Error('Owner not found');

    const steps = {
      personalDetails: !!owner.name && !!owner.phone,
      kyc: !!owner.kyc,
      businessInfo: !!owner.business,
      bankDetails: !!owner.bankName && !!owner.accountNumber,
      propertyRegistered: owner.pgs.length > 0,
      subscriptionActive: !!owner.subscription
    };

    const completedCount = Object.values(steps).filter(Boolean).length;
    const progressPercent = Math.round((completedCount / Object.keys(steps).length) * 100);

    return {
      ownerId,
      progressPercent,
      steps,
      pgs: owner.pgs
    };
  }
}
