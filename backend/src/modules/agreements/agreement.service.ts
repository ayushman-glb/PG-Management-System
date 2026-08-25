import { PrismaClient, Agreement, AgreementStatus, SignatureType, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import { CreateAgreementDTO, UpdateAgreementDTO, SignAgreementDTO, AgreementVerificationDTO } from './agreement.dto';
import { computeSHA256Checksum } from '../../utils/crypto';
import { QrCodeService } from '../../utils/pdf/QrCodeService';
import { env } from '../../config/env';
import PDFDocument from 'pdfkit';

export class AgreementService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async createAgreement(ownerId: string, data: CreateAgreementDTO): Promise<Agreement> {
    const resident = await this.db.user.findUnique({ where: { id: data.residentId } });
    if (!resident) {
      throw new NotFoundError('Resident not found.');
    }

    const pg = await this.db.pG.findUnique({ where: { id: data.pgId } });
    if (!pg) {
      throw new NotFoundError('PG Property not found.');
    }

    if (pg.ownerId !== ownerId) {
      throw new ForbiddenError('You can only create agreements for properties you own.');
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const agreementNumber = `RMB-AGR-${year}-${randomSuffix}`;

    const agreement = await this.db.agreement.create({
      data: {
        agreementNumber,
        ownerId,
        residentId: data.residentId,
        pgId: data.pgId,
        allocationId: data.allocationId || null,
        bookingId: data.bookingId || null,
        rentAmount: Number(data.rentAmount),
        depositAmount: Number(data.depositAmount),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        lockInPeriodMonths: data.lockInPeriodMonths ?? 3,
        noticePeriodDays: data.noticePeriodDays ?? 30,
        status: data.status || AgreementStatus.PENDING_SIGNATURE,
        version: 1,
      },
      include: {
        resident: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        owner: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        pg: { include: { location: true } },
        signatures: true,
      },
    });

    await this.db.auditLog.create({
      data: {
        actorId: ownerId,
        actorRole: 'PG_OWNER',
        action: 'AGREEMENT_CREATED',
        resource: 'Agreement',
        resourceId: agreement.id,
        newState: JSON.stringify({ agreementNumber, status: agreement.status }),
      },
    });

    return agreement;
  }

  async updateAgreement(agreementId: string, ownerId: string, data: UpdateAgreementDTO): Promise<Agreement> {
    const agreement = await this.db.agreement.findUnique({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundError('Agreement not found.');
    if (agreement.ownerId !== ownerId) throw new ForbiddenError('Not authorized.');

    if (agreement.status !== AgreementStatus.DRAFT && agreement.status !== AgreementStatus.PENDING_SIGNATURE) {
      throw new BadRequestError('Cannot edit agreement that has already been partially or fully executed.');
    }

    return this.db.agreement.update({
      where: { id: agreementId },
      data: {
        rentAmount: data.rentAmount !== undefined ? Number(data.rentAmount) : undefined,
        depositAmount: data.depositAmount !== undefined ? Number(data.depositAmount) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        lockInPeriodMonths: data.lockInPeriodMonths,
        noticePeriodDays: data.noticePeriodDays,
      },
      include: {
        resident: { select: { id: true, username: true, email: true, profile: true } },
        owner: { select: { id: true, username: true, email: true, profile: true } },
        pg: true,
        signatures: true,
      },
    });
  }

  async sendAgreement(agreementId: string, ownerId: string): Promise<Agreement> {
    const agreement = await this.db.agreement.findUnique({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundError('Agreement not found.');
    if (agreement.ownerId !== ownerId) throw new ForbiddenError('Not authorized.');

    if (agreement.status !== AgreementStatus.DRAFT) {
      throw new BadRequestError('Only draft agreements can be sent.');
    }

    return this.db.agreement.update({
      where: { id: agreementId },
      data: { status: AgreementStatus.PENDING_SIGNATURE },
      include: {
        resident: { select: { id: true, username: true, email: true, profile: true } },
        owner: { select: { id: true, username: true, email: true, profile: true } },
        pg: true,
        signatures: true,
      },
    });
  }

  async listAgreements(
    userId: string,
    userRole: Role,
    params?: { pgId?: string; status?: AgreementStatus; page?: number; limit?: number }
  ): Promise<any> {
    const where: any = {};
    if (userRole === Role.RESIDENT) {
      where.residentId = userId;
    } else if (userRole === Role.PG_OWNER) {
      where.ownerId = userId;
    }
    if (params?.pgId) where.pgId = params.pgId;
    if (params?.status) where.status = params.status;

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;

    const [agreements, total] = await Promise.all([
      this.db.agreement.findMany({
        where,
        include: {
          resident: { select: { id: true, username: true, email: true, phone: true, profile: true } },
          owner: { select: { id: true, username: true, email: true, phone: true, profile: true } },
          pg: { select: { id: true, name: true, location: true } },
          allocation: { include: { room: true, bed: true, floor: true } },
          signatures: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.agreement.count({ where }),
    ]);

    return { agreements, total, page, limit };
  }

  async getAgreement(agreementId: string, userId: string, userRole: Role): Promise<any> {
    const agreement = await this.db.agreement.findUnique({
      where: { id: agreementId },
      include: {
        resident: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        owner: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        pg: { include: { location: true } },
        allocation: { include: { room: true, bed: true, floor: true } },
        signatures: true,
      },
    });

    if (!agreement) throw new NotFoundError('Agreement not found.');

    const isResident = agreement.residentId === userId;
    const isOwner = agreement.ownerId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isResident && !isOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to access this agreement.');
    }

    return agreement;
  }

  async signAgreement(
    agreementId: string,
    signerId: string,
    data: SignAgreementDTO & { ipAddress?: string }
  ): Promise<any> {
    const agreement = await this.db.agreement.findUnique({
      where: { id: agreementId },
      include: { signatures: true },
    });

    if (!agreement) throw new NotFoundError('Agreement not found.');

    if (agreement.status === AgreementStatus.EXPIRED || agreement.status === AgreementStatus.TERMINATED) {
      throw new BadRequestError('This agreement is no longer active and cannot be signed.');
    }

    const isResident = agreement.residentId === signerId;
    const isOwner = agreement.ownerId === signerId;

    if (!isResident && !isOwner) {
      throw new ForbiddenError('You are not a designated party to sign this agreement.');
    }

    const signerRole = isResident ? Role.RESIDENT : Role.PG_OWNER;

    // Check if already signed by this party
    const alreadySigned = agreement.signatures.some((s) => s.signerId === signerId || s.signerRole === signerRole);
    if (alreadySigned) {
      throw new BadRequestError('You have already digitally signed this agreement.');
    }

    // Save signature
    await this.db.digitalSignature.create({
      data: {
        agreementId,
        signerId,
        signerRole,
        signatureType: data.signatureType,
        signatureData: data.signatureData,
        ipAddress: data.ipAddress || '127.0.0.1',
        signedAt: new Date(),
      },
    });

    // Check new status
    const allSignatures = await this.db.digitalSignature.findMany({ where: { agreementId } });
    const hasResidentSigned = allSignatures.some((s) => s.signerRole === Role.RESIDENT);
    const hasOwnerSigned = allSignatures.some((s) => s.signerRole === Role.PG_OWNER);

    let nextStatus = agreement.status;
    if (hasResidentSigned && hasOwnerSigned) {
      nextStatus = AgreementStatus.COMPLETED;
    } else if (hasResidentSigned) {
      nextStatus = AgreementStatus.SIGNED_BY_RESIDENT;
    } else if (hasOwnerSigned) {
      nextStatus = AgreementStatus.SIGNED_BY_OWNER;
    }

    // Generate integrity hash over terms + signatures
    const hashPayload = JSON.stringify({
      agreementNumber: agreement.agreementNumber,
      rentAmount: agreement.rentAmount,
      depositAmount: agreement.depositAmount,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      signatures: allSignatures.map((s) => ({ role: s.signerRole, signedAt: s.signedAt })),
    });
    const documentHash = computeSHA256Checksum(Buffer.from(hashPayload));

    const updatedAgreement = await this.db.agreement.update({
      where: { id: agreementId },
      data: {
        status: nextStatus,
        documentHash,
      },
      include: {
        resident: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        owner: { select: { id: true, username: true, email: true, phone: true, profile: true } },
        pg: { include: { location: true } },
        allocation: { include: { room: true, bed: true, floor: true } },
        signatures: true,
      },
    });

    await this.db.auditLog.create({
      data: {
        actorId: signerId,
        actorRole: signerRole,
        action: 'AGREEMENT_DIGITALLY_SIGNED',
        resource: 'Agreement',
        resourceId: agreementId,
        ipAddress: data.ipAddress,
        newState: JSON.stringify({ status: nextStatus, signerRole, documentHash }),
      },
    });

    return updatedAgreement;
  }

  async verifyAgreement(agreementNumber: string): Promise<AgreementVerificationDTO> {
    const agreement = await this.db.agreement.findUnique({
      where: { agreementNumber },
      include: {
        resident: { select: { username: true, profile: true } },
        owner: { select: { username: true, profile: true } },
        pg: { select: { name: true, location: true } },
        signatures: { select: { signerRole: true, signedAt: true, signatureType: true } },
      },
    });

    if (!agreement) {
      throw new NotFoundError('Agreement not found for the provided verification code.');
    }

    const residentName = agreement.resident.profile
      ? `${agreement.resident.profile.firstName} ${agreement.resident.profile.lastName}`
      : agreement.resident.username;

    const ownerName = agreement.owner.profile
      ? `${agreement.owner.profile.firstName} ${agreement.owner.profile.lastName}`
      : agreement.owner.username;

    const propertyAddress = agreement.pg.location
      ? `${agreement.pg.location.address}, ${agreement.pg.location.city} - ${agreement.pg.location.pincode}`
      : null;

    return {
      agreementNumber: agreement.agreementNumber,
      status: agreement.status,
      propertyName: agreement.pg.name,
      propertyAddress,
      residentName,
      ownerName,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      monthlyRent: agreement.rentAmount,
      securityDeposit: agreement.depositAmount,
      signaturesCount: agreement.signatures.length,
      signatures: agreement.signatures.map((s) => ({
        role: s.signerRole,
        signedAt: s.signedAt,
        type: s.signatureType,
      })),
      documentHash: agreement.documentHash,
      version: agreement.version,
      verifiedAt: new Date().toISOString(),
      isValid: true,
    };
  }

  async generateAgreementPDF(agreementId: string): Promise<Buffer> {
    const agreement = await this.db.agreement.findUnique({
      where: { id: agreementId },
      include: {
        resident: { include: { profile: true } },
        owner: { include: { profile: true } },
        pg: { include: { location: true } },
        allocation: { include: { room: true, bed: true, floor: true } },
        signatures: true,
      },
    });

    if (!agreement) throw new NotFoundError('Agreement not found.');

    const residentName = agreement.resident.profile
      ? `${agreement.resident.profile.firstName} ${agreement.resident.profile.lastName}`
      : agreement.resident.username;

    const ownerName = agreement.owner.profile
      ? `${agreement.owner.profile.firstName} ${agreement.owner.profile.lastName}`
      : agreement.owner.username;

    const frontendVerifyUrl = `${env.CLIENT_URL || env.FRONTEND_URL}/verify-agreement?num=${agreement.agreementNumber}`;
    let qrBuffer: Buffer | null = null;
    try {
      qrBuffer = await QrCodeService.generateQrCodeBuffer(frontendVerifyUrl, 100);
    } catch {
      qrBuffer = null;
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const fullBuffer = Buffer.concat(buffers);

        // Record in PDFDocument collection
        try {
          await this.db.pDFDocument.create({
            data: {
              documentType: 'AGREEMENT',
              title: `Agreement-${agreement.agreementNumber}`,
              fileUrl: `/api/v1/agreements/${agreement.id}/pdf`,
              storageProvider: 'LOCAL_STREAM',
              hash: agreement.documentHash || computeSHA256Checksum(fullBuffer),
              residentId: agreement.residentId,
              ownerId: agreement.ownerId,
              pgId: agreement.pgId,
            },
          });
        } catch (e) {
          // Non-blocking log
        }

        resolve(fullBuffer);
      });
      doc.on('error', reject);

      // Header Banner
      doc.rect(40, 40, 515, 50).fill('#1E293B');
      doc.fillColor('#F59E0B').fontSize(16).font('Helvetica-Bold').text('ROOMBAE RESIDENTIAL LEASE AGREEMENT', 40, 52, { align: 'center' });
      doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('Indian Tenancy & Model Co-Living Contract Framework', 40, 72, { align: 'center' });

      doc.moveDown(2);
      let y = 105;

      // Agreement Meta Box
      doc.rect(40, y, 515, 45).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').stroke();
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text(`Agreement Code: ${agreement.agreementNumber}`, 50, y + 8);
      doc.text(`Status: ${agreement.status}`, 350, y + 8);
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text(`Effective: ${new Date(agreement.startDate).toLocaleDateString('en-IN')}`, 50, y + 25);
      doc.text(`Valid Till: ${new Date(agreement.endDate).toLocaleDateString('en-IN')}`, 200, y + 25);
      doc.text(`Version: v${agreement.version}.0`, 350, y + 25);

      y += 55;

      // Section 1: Parties
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('1. PARTIES TO THIS LEASE AGREEMENT', 40, y);
      y += 18;
      doc.fontSize(9).font('Helvetica').fillColor('#334155');
      doc.text(`LESSOR / PROPERTY OWNER: ${ownerName} (Email: ${agreement.owner.email}, Phone: ${agreement.owner.phone || 'N/A'})`, 40, y);
      y += 14;
      doc.text(`LESSEE / RESIDENT: ${residentName} (Email: ${agreement.resident.email}, Phone: ${agreement.resident.phone || 'N/A'})`, 40, y);
      y += 20;

      // Section 2: Property & Unit
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('2. PREMISES & ACCOMMODATION DETAILS', 40, y);
      y += 18;
      doc.fontSize(9).font('Helvetica').fillColor('#334155');
      doc.text(`Property Name: ${agreement.pg.name}`, 40, y);
      y += 14;
      if (agreement.pg.location) {
        doc.text(`Location: ${agreement.pg.location.address}, ${agreement.pg.location.city}, ${agreement.pg.location.state} - ${agreement.pg.location.pincode}`, 40, y);
        y += 14;
      }
      if (agreement.allocation) {
        doc.text(`Allocated Unit: Floor ${agreement.allocation.floor?.floorNumber || 'N/A'} · Room ${agreement.allocation.room.roomNumber} · Bed ${agreement.allocation.bed.bedNumber} (${agreement.allocation.room.roomType})`, 40, y);
        y += 14;
      }
      y += 8;

      // Section 3: Financial Obligations
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('3. FINANCIAL TERMS & RENT OBLIGATIONS', 40, y);
      y += 18;
      doc.fontSize(9).font('Helvetica').fillColor('#334155');
      doc.text(`• Monthly License Fee (Rent): ₹${agreement.rentAmount.toLocaleString('en-IN')} / month (Payable on or before 5th of each month)`, 40, y);
      y += 14;
      doc.text(`• Security Deposit: ₹${agreement.depositAmount.toLocaleString('en-IN')} (Refundable upon checkout inspection minus damages)`, 40, y);
      y += 14;
      doc.text(`• Lock-in Period: ${agreement.lockInPeriodMonths} Months | Notice Period: ${agreement.noticePeriodDays} Days`, 40, y);
      y += 20;

      // Section 4: Standard Rules & Covenants
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('4. CODE OF CONDUCT & HOUSE RULES', 40, y);
      y += 18;
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
      const rules = [
        'A. Visitors & Guests: Visitors permitted in common areas between 09:00 - 20:00 with digital guest pass.',
        'B. Quiet Hours: Mandatory quiet hours observed from 22:30 to 06:30 for community peaceful enjoyment.',
        'C. Property Damage: Tenant is liable for any intentional or negligent damages to allocated room assets.',
        'D. Termination & Move-out: Tenant must submit notice via portal 30 days prior to checkout date.',
      ];
      for (const rule of rules) {
        doc.text(rule, 40, y);
        y += 13;
      }
      y += 10;

      // Section 5: Digital Signatures & Execution
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('5. DIGITAL EXECUTION & SIGNATURES', 40, y);
      y += 18;

      for (const sig of agreement.signatures) {
        doc.fontSize(8.5).font('Helvetica').fillColor('#1E293B');
        doc.text(`✔ Signed by ${sig.signerRole}: ${sig.signerRole === Role.RESIDENT ? residentName : ownerName} | Method: ${sig.signatureType} | Date: ${new Date(sig.signedAt).toISOString()} | IP: ${sig.ipAddress || '127.0.0.1'}`, 40, y);
        y += 14;
      }

      if (agreement.signatures.length === 0) {
        doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#EF4444');
        doc.text('⚠ Awaiting digital signatures from parties.', 40, y);
        y += 14;
      }

      y += 15;

      // Verification Footer Box with QR Code
      if (qrBuffer) {
        doc.image(qrBuffer, 445, y, { width: 75, height: 75 });
      }

      doc.rect(40, y, 395, 75).fill('#F1F5F9');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('Document Integrity & Verification', 50, y + 10);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica');
      doc.text(`Document Hash: ${agreement.documentHash || 'Generated on signature completion'}`, 50, y + 25);
      doc.text(`Verify online: ${frontendVerifyUrl}`, 50, y + 38);
      doc.text(`Timestamp: ${new Date().toISOString()}`, 50, y + 51);

      doc.end();
    });
  }
}
