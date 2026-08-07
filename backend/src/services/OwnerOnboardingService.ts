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
} from './IOwnerOnboardingService';

export class OwnerOnboardingService implements IOwnerOnboardingService {
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
    return this.prisma.ownerKYC.upsert({
      where: { ownerId },
      create: {
        ownerId,
        aadhaarNumber: input.aadhaarNumber,
        aadhaarDocUrl: input.aadhaarDocUrl,
        panNumber: input.panNumber,
        panDocUrl: input.panDocUrl,
        passportNumber: input.passportNumber,
        passportDocUrl: input.passportDocUrl,
        drivingLicenseNo: input.drivingLicenseNo,
        drivingLicenseUrl: input.drivingLicenseUrl,
        ownerSelfieUrl: input.ownerSelfieUrl,
        faceVerificationToken: input.faceVerificationToken || `FACE_VERIFIED_${Date.now()}`,
        digitalSignatureUrl: input.digitalSignatureUrl,
        verificationStatus: OwnerKYCStatus.PENDING
      },
      update: {
        aadhaarNumber: input.aadhaarNumber,
        aadhaarDocUrl: input.aadhaarDocUrl,
        panNumber: input.panNumber,
        panDocUrl: input.panDocUrl,
        passportNumber: input.passportNumber,
        passportDocUrl: input.passportDocUrl,
        drivingLicenseNo: input.drivingLicenseNo,
        drivingLicenseUrl: input.drivingLicenseUrl,
        ownerSelfieUrl: input.ownerSelfieUrl,
        faceVerificationToken: input.faceVerificationToken,
        digitalSignatureUrl: input.digitalSignatureUrl,
        verificationStatus: OwnerKYCStatus.PENDING
      }
    });
  }

  async saveBusinessInfo(ownerId: string, input: BusinessInfoInput): Promise<any> {
    // Validate GSTIN regex if provided
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

    return this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode,
        upiId: input.upiId
      }
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
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        city: input.city,
        pincode: input.pincode
      }
    });
  }

  async configureBuildingAndAmenities(pgId: string, input: BuildingSpecsInput): Promise<any> {
    const building = await this.prisma.building.create({
      data: {
        pgId,
        name: input.buildingName || 'Main Block',
        floorsCount: input.floorsCount || 3
      }
    });

    await this.prisma.pG.update({
      where: { id: pgId },
      data: {
        amenities: input.amenitiesList || ['WiFi', 'CCTV', 'Power Backup'],
        caretakerName: input.caretakerName,
        caretakerPhone: input.caretakerPhone
      }
    });

    return building;
  }

  async batchCreateRoomsAndBeds(pgId: string, input: RoomConfigInput): Promise<any> {
    const pg = await this.prisma.pG.findUnique({
      where: { id: pgId },
      include: { buildings: true }
    });

    if (!pg || pg.buildings.length === 0) {
      throw new Error('Please configure a building before creating rooms.');
    }

    const building = pg.buildings[0];
    const createdRooms = [];
    let totalBedsAdded = 0;

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
            acType: 'AC',
            washroomType: 'ATTACHED',
            rentAmount: input.rentAmount
          }
        });

        const bedCount = input.roomType === 'SINGLE' ? 1
          : input.roomType === 'DOUBLE' ? 2
          : input.roomType === 'TRIPLE' ? 3
          : input.roomType === 'FOUR_SHARING' ? 4
          : input.roomType === 'FIVE_SHARING' ? 5
          : (input.customCapacity || 2);

        for (let b = 1; b <= bedCount; b++) {
          const letter = String.fromCharCode(64 + b);
          await this.prisma.bed.create({
            data: {
              roomId: room.id,
              bedNumber: `${roomNum}-${letter}`,
              status: 'AVAILABLE',
              isOccupied: false
            }
          });
          totalBedsAdded++;
        }
        createdRooms.push(room);
      }
    }

    await this.prisma.pG.update({
      where: { id: pgId },
      data: {
        capacity: totalBedsAdded,
        availableBeds: totalBedsAdded,
        totalRoomsCount: createdRooms.length,
        totalBedsCount: totalBedsAdded
      }
    });

    return { totalRooms: createdRooms.length, totalBeds: totalBedsAdded };
  }

  async selectSubscriptionPlan(ownerId: string, input: SubscriptionSelectionInput): Promise<any> {
    const limits = {
      STARTER: { maxResidents: 30, maxProperties: 1, hasAnalytics: true, hasPrioritySupport: false },
      PROFESSIONAL: { maxResidents: 100, maxProperties: 3, hasAnalytics: true, hasPrioritySupport: true },
      BUSINESS: { maxResidents: 300, maxProperties: 10, hasAnalytics: true, hasPrioritySupport: true },
      ENTERPRISE: { maxResidents: 1000, maxProperties: 50, hasAnalytics: true, hasPrioritySupport: true }
    }[input.planType];

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 86400000);

    return this.prisma.subscription.upsert({
      where: { ownerId },
      create: {
        ownerId,
        planType: input.planType as SubscriptionPlanType,
        status: SubscriptionStatus.ACTIVE,
        maxResidents: limits.maxResidents,
        maxProperties: limits.maxProperties,
        hasAnalytics: limits.hasAnalytics,
        hasPrioritySupport: limits.hasPrioritySupport,
        currentPeriodStart,
        currentPeriodEnd,
        paymentTxnId: input.paymentTxnId || `TXN_${Date.now()}`
      },
      update: {
        planType: input.planType as SubscriptionPlanType,
        status: SubscriptionStatus.ACTIVE,
        maxResidents: limits.maxResidents,
        maxProperties: limits.maxProperties,
        currentPeriodStart,
        currentPeriodEnd,
        paymentTxnId: input.paymentTxnId || `TXN_${Date.now()}`
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
        pgs: {
          include: {
            buildings: {
              include: {
                floors: {
                  include: {
                    rooms: {
                      include: { beds: true }
                    }
                  }
                }
              }
            },
            propertyDocuments: true
          }
        }
      }
    });

    if (!owner) throw new Error('Owner not found');

    const hasKYC = !!owner.kyc;
    const hasBusiness = !!owner.business;
    const hasBank = !!(owner.bankName && owner.accountNumber);
    const hasPG = owner.pgs.length > 0;
    const hasSubscription = !!owner.subscription;

    return {
      owner,
      progressPercentage: (
        (hasKYC ? 20 : 0) +
        (hasBusiness ? 20 : 0) +
        (hasBank ? 20 : 0) +
        (hasPG ? 20 : 0) +
        (hasSubscription ? 20 : 0)
      )
    };
  }
}
