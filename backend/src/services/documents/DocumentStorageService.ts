import { cloudinary, getCloudinaryFolder } from '../../config/cloudinary';
import { BasePdfGenerator } from '../../infrastructure/pdf/generators/BasePdfGenerator';

export interface StorageUploadResult {
  publicId: string;
  storageUrl: string;
  fileSize: number;
}

export class DocumentStorageService {
  private static readonly RESOURCE_TYPE = 'raw'; // PDFs must use 'raw', not 'image'

  /**
   * Upload a PDF buffer to Cloudinary under a deterministic public_id.
   * Returns the publicId and secure URL.
   * Uses resource_type: 'raw' — PDFs are not image resources.
   */
  async uploadPdf(
    buffer: Buffer,
    publicId: string,
    folder: string
  ): Promise<StorageUploadResult> {
    const targetFolder = getCloudinaryFolder(folder);
    const fullPublicId = `${targetFolder}/${publicId}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: DocumentStorageService.RESOURCE_TYPE,
          public_id: fullPublicId,
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(`Cloudinary PDF upload failed: ${error?.message ?? 'Unknown error'}`));
          }
          resolve({
            publicId: result.public_id,
            storageUrl: result.secure_url,
            fileSize: result.bytes,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Verify whether a stored Cloudinary asset actually exists.
   * Returns false if the asset is missing (404) or on network error.
   */
  async verifyAssetExists(publicId: string): Promise<boolean> {
    if (!publicId || publicId.startsWith('fallback_') || publicId.startsWith('local_')) {
      return false;
    }
    try {
      await cloudinary.api.resource(publicId, { resource_type: DocumentStorageService.RESOURCE_TYPE });
      return true;
    } catch (err: any) {
      // Cloudinary returns a 404-style error when not found
      if (err?.error?.http_code === 404 || err?.http_code === 404) {
        return false;
      }
      // On connection/auth error — treat as unavailable
      return false;
    }
  }

  /**
   * Download the PDF buffer from Cloudinary by streaming via signed URL.
   * This keeps Cloudinary credentials server-side — never exposed to the frontend.
   */
  async downloadBuffer(publicId: string): Promise<Buffer> {
    if (!publicId) {
      throw new Error('DOCUMENT_STORAGE_MISSING: No publicId provided');
    }

    // Generate a short-lived signed URL (60 seconds)
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      'pdf',
      { resource_type: DocumentStorageService.RESOURCE_TYPE, expires_at: Math.floor(Date.now() / 1000) + 120 }
    );

    const response = await fetch(signedUrl);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`DOCUMENT_STORAGE_MISSING: Asset not found at publicId=${publicId}`);
      }
      throw new Error(`DOCUMENT_STORAGE_MISSING: HTTP ${response.status} fetching PDF from storage`);
    }

    const arrayBuf = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Validate the returned content is actually a PDF
    if (!BasePdfGenerator.validatePdfBuffer(buf)) {
      throw new Error('DOCUMENT_STORAGE_MISSING: Retrieved content is not a valid PDF');
    }

    return buf;
  }

  /**
   * Delete a stored PDF from Cloudinary (used when orphaned upload cleanup is needed).
   */
  async deletePdf(publicId: string): Promise<boolean> {
    if (!publicId) return true;
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: DocumentStorageService.RESOURCE_TYPE,
        invalidate: true,
      });
      return result.result === 'ok' || result.result === 'not found';
    } catch {
      return false;
    }
  }

  /**
   * Build the deterministic Cloudinary folder path for a document type.
   * Example: documents/invoices / documents/agreements / documents/kyc
   */
  static buildFolder(documentType: string): string {
    const typeMap: Record<string, string> = {
      INVOICE: 'documents/invoices',
      PAYMENT_RECEIPT: 'documents/receipts',
      RENT_RECEIPT: 'documents/receipts',
      REFUND_RECEIPT: 'documents/refunds',
      SECURITY_DEPOSIT_RECEIPT: 'documents/receipts',
      TRANSACTION_RECEIPT: 'documents/receipts',
      LEASE_AGREEMENT: 'documents/agreements',
      SIGNED_AGREEMENT: 'documents/agreements',
      DIGITAL_AGREEMENT: 'documents/agreements',
      KYC_DOCUMENT: 'documents/kyc',
      KYC_VERIFICATION: 'documents/kyc',
    };
    return typeMap[documentType] ?? 'documents/other';
  }

  /**
   * Build the deterministic Cloudinary public_id for a document.
   * Pattern: {entityType}/{entityId}/v{version}
   */
  static buildPublicId(entityType: string, entityId: string, version: number): string {
    return `${entityType}/${entityId}/v${version}`;
  }
}

export const documentStorageService = new DocumentStorageService();
