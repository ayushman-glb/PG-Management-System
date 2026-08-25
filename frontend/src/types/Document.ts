export type DocumentType =
  | 'AADHAAR_FRONT'
  | 'AADHAAR_BACK'
  | 'AADHAAR_COMBINED'
  | 'PAN_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'PASSPORT_PHOTO'
  | 'COLLEGE_OFFICE_ID'
  | 'GUARDIAN_PROOF'
  | 'POLICE_VERIFICATION'
  | 'PROPERTY_DEED'
  | 'RENTAL_LICENSE'
  | 'GST_CERTIFICATE'
  | 'BANK_DOCUMENT'
  | 'ELECTRICITY_BILL'
  | 'RENT_AGREEMENT'
  | 'OTHER';

export type VerificationStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface DocumentItem {
  id: string;
  userId: string;
  documentType: DocumentType;
  title: string | null;
  documentNumber: string | null;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  status: VerificationStatus;
  version: number;
  isCurrent: boolean;
  parentDocumentId: string | null;
  hash: string | null;
  verifiedById?: string | null;
  verifiedAt?: string | Date | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
