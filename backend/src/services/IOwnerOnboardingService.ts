export interface PersonalDetailsInput {
  fullName: string;
  photoUrl: string;
  dob: string;
  gender: string;
  phone: string;
  altPhone?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  emergencyContact?: string;
}

export interface OwnerKYCInput {
  aadhaarNumber: string;
  aadhaarDocUrl?: string;
  panNumber: string;
  panDocUrl?: string;
  passportNumber?: string;
  passportDocUrl?: string;
  drivingLicenseNo?: string;
  drivingLicenseUrl?: string;
  ownerSelfieUrl?: string;
  faceVerificationToken?: string;
  digitalSignatureUrl?: string;
}

export interface BusinessInfoInput {
  businessName: string;
  businessType: 'INDIVIDUAL' | 'PARTNERSHIP' | 'LLP' | 'PVT_LIMITED' | 'TRUST' | 'SOCIETY';
  gstin?: string;
  panNumber?: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  registrationNumber?: string;
  tradeLicenseDocUrl?: string;
}

export interface BankDetailsInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  branch: string;
  cancelledChequeUrl?: string;
  upiId: string;
}

export interface PropertyInfoInput {
  pgName: string;
  propertyType: 'HOSTEL' | 'PG' | 'APARTMENT' | 'VILLA' | 'BUILDING' | 'INDEPENDENT_HOUSE';
  ownershipType: 'OWNED' | 'LEASED' | 'RENTED' | 'MANAGED';
  landlordName?: string;
  landlordLeaseAgreementUrl?: string;
  nocDocumentUrl?: string;
  rentStartingFrom: number;
  securityDeposit: number;
}

export interface LocationInput {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  area: string;
  city: string;
  pincode: string;
}

export interface BuildingSpecsInput {
  buildingName: string;
  floorsCount: number;
  hasLift: boolean;
  hasParking: boolean;
  hasCCTV: boolean;
  hasBiometric: boolean;
  hasPowerBackup: boolean;
  hasWaterSupply: boolean;
  hasWiFi: boolean;
  hasFireSafety: boolean;
  hasKitchen: boolean;
  hasLaundry: boolean;
  hasSecurityGuard: boolean;
  caretakerName?: string;
  caretakerPhone?: string;
  emergencyContact?: string;
  amenitiesList: string[];
}

export interface RoomConfigInput {
  floorsCount: number;
  roomsPerFloor: number;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SHARING' | 'FIVE_SHARING' | 'CUSTOM';
  customCapacity?: number;
  rentAmount: number;
}

export interface SubscriptionSelectionInput {
  planType: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  paymentTxnId?: string;
}

export interface IOwnerOnboardingService {
  savePersonalDetails(ownerId: string, input: PersonalDetailsInput): Promise<any>;
  submitKYC(ownerId: string, input: OwnerKYCInput): Promise<any>;
  saveBusinessInfo(ownerId: string, input: BusinessInfoInput): Promise<any>;
  saveBankDetails(ownerId: string, input: BankDetailsInput): Promise<any>;
  registerPGProperty(ownerId: string, input: PropertyInfoInput): Promise<any>;
  saveLocation(pgId: string, input: LocationInput): Promise<any>;
  configureBuildingAndAmenities(pgId: string, input: BuildingSpecsInput): Promise<any>;
  batchCreateRoomsAndBeds(pgId: string, input: RoomConfigInput): Promise<any>;
  selectSubscriptionPlan(ownerId: string, input: SubscriptionSelectionInput): Promise<any>;
  submitForAdminApproval(pgId: string): Promise<any>;
  getOnboardingProgress(ownerId: string): Promise<any>;
}
