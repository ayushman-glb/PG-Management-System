import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import { AgreementService } from '../../modules/agreements/agreement.service';
import { DocumentService } from '../../modules/documents/document.service';
import { Role, AgreementStatus, DocumentType, VerificationStatus } from '@prisma/client';

describe('Agreements, Digital Signatures & Document Vault Integration Suite', () => {
  let ownerUser: any;
  let residentUser: any;
  let unauthorizedUser: any;
  let testPg: any;
  let agreementService: AgreementService;
  let documentService: DocumentService;

  beforeAll(async () => {
    agreementService = new AgreementService();
    documentService = new DocumentService();

    // Fetch seeded demo users
    ownerUser = await prisma.user.findFirst({
      where: { email: '33200122040@tib.edu.in' },
    });
    residentUser = await prisma.user.findFirst({
      where: { email: 'ankursaha985@gmail.com' },
    });
    unauthorizedUser = await prisma.user.findFirst({
      where: { email: 'rohit.verma@gmail.com' },
    });
    testPg = await prisma.pG.findFirst({
      where: { ownerId: ownerUser?.id },
    });
  });

  describe('1. Public Database Health Probe', () => {
    it('GET /api/v1/health should probe MongoDB and return status 200 with latency', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.database.status).toBe('CONNECTED');
      expect(typeof res.body.database.latencyMs).toBe('number');
    });
  });

  describe('2. Agreement Lifecycle & Server-side Digital Signature Validation', () => {
    let createdAgreement: any;

    it('Owner should create a general agreement for resident without prior booking', async () => {
      if (!ownerUser || !residentUser || !testPg) return;

      createdAgreement = await agreementService.createAgreement(ownerUser.id, {
        residentId: residentUser.id,
        pgId: testPg.id,
        rentAmount: 15000,
        depositAmount: 30000,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-08-31'),
        lockInPeriodMonths: 3,
        noticePeriodDays: 30,
        status: AgreementStatus.PENDING_SIGNATURE,
      });

      expect(createdAgreement).toBeDefined();
      expect(createdAgreement.agreementNumber).toMatch(/^RMB-AGR-\d{4}-\d{4}$/);
      expect(createdAgreement.status).toBe(AgreementStatus.PENDING_SIGNATURE);
      expect(createdAgreement.rentAmount).toBe(15000);
    });

    it('Unauthorized user should NOT be able to sign agreement (IDOR Protection)', async () => {
      if (!createdAgreement || !unauthorizedUser) return;

      await expect(
        agreementService.signAgreement(createdAgreement.id, unauthorizedUser.id, {
          signatureType: 'DRAWN',
          signatureData: 'data:image/png;base64,mockSignatureData',
          consent: true,
        })
      ).rejects.toThrow('You are not a designated party to sign this agreement.');
    });

    it('Resident signs agreement -> status transitions to SIGNED_BY_RESIDENT', async () => {
      if (!createdAgreement || !residentUser) return;

      const updated = await agreementService.signAgreement(createdAgreement.id, residentUser.id, {
        signatureType: 'TYPED',
        signatureData: 'Ankur Saha (Digitally Signed)',
        consent: true,
      });

      expect(updated.status).toBe(AgreementStatus.SIGNED_BY_RESIDENT);
      expect(updated.signatures.length).toBe(1);
      expect(updated.signatures[0].signerRole).toBe(Role.RESIDENT);
      expect(updated.documentHash).toBeDefined();
    });

    it('Resident cannot duplicate signature on the same agreement without override flag', async () => {
      if (!createdAgreement || !residentUser) return;

      await expect(
        agreementService.signAgreement(createdAgreement.id, residentUser.id, {
          signatureType: 'TYPED',
          signatureData: 'Duplicate Signature',
          consent: true,
        })
      ).rejects.toThrow('You have already digitally signed this agreement.');
    });

    it('Resident CAN override previous signature when override flag is set to true', async () => {
      if (!createdAgreement || !residentUser) return;

      const overridden = await agreementService.signAgreement(createdAgreement.id, residentUser.id, {
        signatureType: 'DRAWN',
        signatureData: 'data:image/png;base64,overriddenNewSignature',
        consent: true,
        override: true,
      });

      expect(overridden.status).toBe(AgreementStatus.SIGNED_BY_RESIDENT);
      expect(overridden.signatures.length).toBe(1);
      expect(overridden.signatures[0].signatureType).toBe('DRAWN');
      expect(overridden.documentHash).toBeDefined();
    });

    it('Owner signs agreement -> status transitions to COMPLETED', async () => {
      if (!createdAgreement || !ownerUser) return;

      const completed = await agreementService.signAgreement(createdAgreement.id, ownerUser.id, {
        signatureType: 'DRAWN',
        signatureData: 'data:image/png;base64,mockOwnerSignature',
        consent: true,
      });

      expect(completed.status).toBe(AgreementStatus.COMPLETED);
      expect(completed.signatures.length).toBe(2);
      expect(completed.documentHash).toBeDefined();
    });

    it('Public verification endpoint should return valid agreement metadata without exposing secrets', async () => {
      if (!createdAgreement) return;

      const res = await request(app).get(`/api/v1/agreements/verify/${createdAgreement.agreementNumber}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.agreementNumber).toBe(createdAgreement.agreementNumber);
      expect(res.body.data.status).toBe(AgreementStatus.COMPLETED);
      expect(res.body.data.signaturesCount).toBe(2);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.monthlyRent).toBe(15000);
    });

    it('PDF generation should produce non-empty valid PDF buffer with integrity hash', async () => {
      if (!createdAgreement) return;

      const pdfBuffer = await agreementService.generateAgreementPDF(createdAgreement.id);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });
  });

  describe('3. Document Vault & Versioning Lifecycle', () => {
    let uploadedDoc: any;

    it('Resident should upload initial KYC document (v1)', async () => {
      if (!residentUser) return;

      uploadedDoc = await documentService.uploadDocument(
        residentUser.id,
        {
          documentType: DocumentType.PASSPORT,
          title: 'Indian Passport Copy',
          documentNumber: 'Z8942019',
        },
        {
          secureUrl: 'https://res.cloudinary.com/roombae/raw/upload/v1/passport_v1.pdf',
          publicId: 'passport_v1',
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          mimeType: 'application/pdf',
          bytes: 120400,
          originalName: 'passport_v1.pdf',
        }
      );

      expect(uploadedDoc).toBeDefined();
      expect(uploadedDoc.version).toBe(1);
      expect(uploadedDoc.isCurrent).toBe(true);
      expect(uploadedDoc.status).toBe(VerificationStatus.PENDING);
    });

    it('Re-uploading document should archive v1 and create v2 with parentDocumentId link', async () => {
      if (!residentUser || !uploadedDoc) return;

      const v2Doc = await documentService.reuploadDocument(
        residentUser.id,
        uploadedDoc.id,
        {
          secureUrl: 'https://res.cloudinary.com/roombae/raw/upload/v2/passport_v2.pdf',
          publicId: 'passport_v2',
          checksum: 'ca978112ca1bbdcafac231b39a23dc4da786081414e19ed77833075c3453896b',
          mimeType: 'application/pdf',
          bytes: 135000,
          originalName: 'passport_v2.pdf',
        }
      );

      expect(v2Doc.version).toBe(2);
      expect(v2Doc.isCurrent).toBe(true);
      expect(v2Doc.parentDocumentId).toBe(uploadedDoc.id);

      const oldDoc = await prisma.document.findUnique({ where: { id: uploadedDoc.id } });
      expect(oldDoc?.isCurrent).toBe(false);

      const history = await documentService.getVersionHistory(v2Doc.id, residentUser.id, Role.RESIDENT);
      expect(history.length).toBe(2);
    });

    it('Owner should verify document status', async () => {
      if (!ownerUser || !uploadedDoc) return;

      const verified = await documentService.verifyDocument(ownerUser.id, uploadedDoc.id, {
        status: VerificationStatus.VERIFIED,
      });

      expect(verified.status).toBe(VerificationStatus.VERIFIED);
      expect(verified.verifiedById).toBe(ownerUser.id);
      expect(verified.verifiedAt).toBeDefined();
    });
  });
});
