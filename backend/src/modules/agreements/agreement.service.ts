import { PrismaClient, Agreement, AgreementStatus, SignatureType, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import { CreateAgreementDTO, UpdateAgreementDTO, SignAgreementDTO, AgreementVerificationDTO } from './agreement.dto';
import { computeSHA256Checksum } from '../../utils/crypto';
import { QrCodeService } from '../../utils/pdf/QrCodeService';
import { env } from '../../config/env';
import { PdfBrowserManager, renderAgreementHtml } from '../../utils/pdf';

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
      if (data.override === true) {
        // Remove existing signature for this signer to allow re-signing with updated data
        await this.db.digitalSignature.deleteMany({
          where: {
            agreementId,
            signerRole,
          },
        });
      } else {
        throw new BadRequestError('You have already digitally signed this agreement.');
      }
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
        action: data.override ? 'AGREEMENT_SIGNATURE_OVERRIDDEN' : 'AGREEMENT_DIGITALLY_SIGNED',
        resource: 'Agreement',
        resourceId: agreementId,
        ipAddress: data.ipAddress,
        newState: JSON.stringify({ status: nextStatus, signerRole, documentHash, overridden: !!data.override }),
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

    const residentName = agreement.resident?.profile
      ? `${agreement.resident.profile.firstName} ${agreement.resident.profile.lastName}`.trim()
      : agreement.resident?.username || 'Resident';

    const ownerName = agreement.owner?.profile
      ? `${agreement.owner.profile.firstName} ${agreement.owner.profile.lastName}`.trim()
      : agreement.owner?.username || 'Property Owner';

    const propertyAddress = agreement.pg?.location
      ? `${agreement.pg.location.address}, ${agreement.pg.location.city} - ${agreement.pg.location.pincode}`
      : null;

    return {
      agreementNumber: agreement.agreementNumber,
      status: agreement.status,
      propertyName: agreement.pg?.name || 'RoomBae Property',
      propertyAddress,
      residentName,
      ownerName,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      monthlyRent: agreement.rentAmount,
      securityDeposit: agreement.depositAmount,
      signaturesCount: (agreement.signatures || []).length,
      signatures: (agreement.signatures || []).map((s) => ({
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

    const residentName = agreement.resident?.profile
      ? `${agreement.resident.profile.firstName || ''} ${agreement.resident.profile.lastName || ''}`.trim() || agreement.resident?.username || 'Resident'
      : agreement.resident?.username || 'Resident';

    const ownerName = agreement.owner?.profile
      ? `${agreement.owner.profile.firstName || ''} ${agreement.owner.profile.lastName || ''}`.trim() || agreement.owner?.username || 'Property Owner'
      : agreement.owner?.username || 'Property Owner';

    const frontendVerifyUrl = `${env.CLIENT_URL || env.FRONTEND_URL}/verify-agreement?num=${agreement.agreementNumber}`;
    let qrCodeDataUrl: string | null = null;
    try {
      qrCodeDataUrl = await QrCodeService.generateQrCodeDataUrl(frontendVerifyUrl);
    } catch {
      qrCodeDataUrl = null;
    }

    const pgAddress = agreement.pg?.location
      ? `${agreement.pg.location.address || ''}, ${agreement.pg.location.city || ''}${agreement.pg.location.state ? ', ' + agreement.pg.location.state : ''}${agreement.pg.location.pincode ? ' - ' + agreement.pg.location.pincode : ''}`.trim()
      : undefined;

    const html = renderAgreementHtml({
      agreementNumber: agreement.agreementNumber,
      status: agreement.status,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      version: agreement.version,
      ownerName,
      ownerEmail: agreement.owner?.email || 'owner@roombae.com',
      ownerPhone: agreement.owner?.phone || undefined,
      residentName,
      residentEmail: agreement.resident?.email || 'resident@roombae.com',
      residentPhone: agreement.resident?.phone || undefined,
      pgName: agreement.pg?.name || 'RoomBae Co-Living PG',
      pgAddress,
      floorNumber: agreement.allocation?.floor?.floorNumber,
      roomNumber: agreement.allocation?.room?.roomNumber,
      bedNumber: agreement.allocation?.bed?.bedNumber,
      roomType: agreement.allocation?.room?.roomType,
      rentAmount: agreement.rentAmount,
      depositAmount: agreement.depositAmount,
      lockInPeriodMonths: agreement.lockInPeriodMonths,
      noticePeriodDays: agreement.noticePeriodDays,
      signatures: (agreement.signatures || []).map((sig) => ({
        signerRole: sig.signerRole,
        signatureType: sig.signatureType,
        signedAt: sig.signedAt,
        ipAddress: sig.ipAddress || undefined,
      })),
      documentHash: agreement.documentHash || undefined,
      verificationUrl: frontendVerifyUrl,
      qrCodeDataUrl,
    });

    const pdfBuffer = await PdfBrowserManager.generatePdfFromHtml(html);

    // Record in PDFDocument collection safely
    try {
      await this.db.pDFDocument.create({
        data: {
          documentType: 'AGREEMENT',
          title: `Agreement-${agreement.agreementNumber}`,
          fileUrl: `/api/v1/agreements/${agreement.id}/pdf`,
          storageProvider: 'LOCAL_STREAM',
          hash: agreement.documentHash || computeSHA256Checksum(pdfBuffer),
          residentId: agreement.residentId,
          ownerId: agreement.ownerId,
          pgId: agreement.pgId,
        },
      });
    } catch {
      // Non-blocking log
    }

    return pdfBuffer;
  }
}
