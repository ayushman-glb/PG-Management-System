export type AgreementStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'SIGNED_BY_RESIDENT'
  | 'SIGNED_BY_OWNER'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'TERMINATED';

export type SignatureType = 'DRAWN' | 'TYPED' | 'UPLOADED';

export interface DigitalSignature {
  id: string;
  agreementId: string;
  signerId: string;
  signerRole: 'RESIDENT' | 'PG_OWNER' | 'ADMIN';
  signatureType: SignatureType;
  signatureData: string;
  ipAddress?: string;
  signedAt: string | Date;
}

export interface Agreement {
  id: string;
  agreementNumber: string;
  residentId: string;
  ownerId: string;
  pgId: string;
  allocationId?: string | null;
  bookingId?: string | null;
  status: AgreementStatus;
  rentAmount: number;
  depositAmount: number;
  lockInPeriodMonths: number;
  noticePeriodDays: number;
  startDate: string | Date;
  endDate: string | Date;
  agreementPdfUrl?: string | null;
  documentHash?: string | null;
  version: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  signatures?: DigitalSignature[];
  resident?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    profile?: {
      firstName: string;
      lastName: string;
      occupation?: string;
    };
  };
  owner?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  pg?: {
    id: string;
    name: string;
    location?: {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  allocation?: {
    id: string;
    room: {
      roomNumber: string;
      roomType: string;
    };
    bed: {
      bedNumber: string;
    };
    floor?: {
      floorNumber: number;
      floorName?: string;
    };
  };
}

export interface AgreementVerificationData {
  agreementNumber: string;
  status: AgreementStatus;
  propertyName: string;
  propertyAddress: string | null;
  residentName: string;
  ownerName: string;
  startDate: string | Date;
  endDate: string | Date;
  monthlyRent: number;
  securityDeposit: number;
  signaturesCount: number;
  signatures: Array<{
    role: string;
    signedAt: string | Date;
    type: SignatureType;
  }>;
  documentHash: string | null;
  version: number;
  verifiedAt: string;
  isValid: boolean;
}
