import { DocumentType, VerificationStatus } from '@prisma/client';

export interface UploadDocumentDTO {
  documentType: DocumentType;
  title?: string;
  documentNumber?: string;
}

export interface VerifyDocumentDTO {
  status: VerificationStatus;
  rejectionReason?: string;
}

export interface DocumentResponseDTO {
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
  cloudinaryPublicId: string | null;
  verifiedById: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
