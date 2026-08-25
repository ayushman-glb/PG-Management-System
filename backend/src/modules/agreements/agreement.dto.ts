import { AgreementStatus, SignatureType, Role } from '@prisma/client';
import { z } from 'zod';

export interface CreateAgreementDTO {
  residentId: string;
  pgId: string;
  allocationId?: string;
  bookingId?: string;
  rentAmount: number;
  depositAmount: number;
  startDate: string | Date;
  endDate: string | Date;
  lockInPeriodMonths?: number;
  noticePeriodDays?: number;
  status?: AgreementStatus;
}

export interface UpdateAgreementDTO {
  rentAmount?: number;
  depositAmount?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  lockInPeriodMonths?: number;
  noticePeriodDays?: number;
}

export interface SignAgreementDTO {
  signatureType: SignatureType;
  signatureData: string;
  consent?: boolean;
}

export interface AgreementVerificationDTO {
  agreementNumber: string;
  status: AgreementStatus;
  propertyName: string;
  propertyAddress: string | null;
  residentName: string;
  ownerName: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  signaturesCount: number;
  signatures: Array<{
    role: Role;
    signedAt: Date;
    type: SignatureType;
  }>;
  documentHash: string | null;
  version: number;
  verifiedAt: string;
  isValid: boolean;
}

export const CreateAgreementSchema = z.object({
  residentId: z.string().min(1, 'Resident ID is required'),
  pgId: z.string().min(1, 'PG ID is required'),
  allocationId: z.string().optional(),
  bookingId: z.string().optional(),
  rentAmount: z.number().positive('Rent must be a positive number'),
  depositAmount: z.number().nonnegative('Deposit must be non-negative'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  lockInPeriodMonths: z.number().int().nonnegative().optional(),
  noticePeriodDays: z.number().int().nonnegative().optional(),
  status: z.enum(['DRAFT', 'PENDING_SIGNATURE']).optional(),
});

export const SignAgreementSchema = z.object({
  signatureType: z.enum(['DRAWN', 'TYPED', 'UPLOADED']),
  signatureData: z.string().min(1, 'Signature data is required'),
  consent: z.boolean().optional(),
});
