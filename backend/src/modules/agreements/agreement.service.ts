import { PrismaClient, Agreement, AgreementStatus, SignatureType, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

export interface ISignAgreementDTO {
  signerId: string;
  signatureType: SignatureType;
  signatureData: string;
  ipAddress?: string;
}

export class AgreementService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async listAgreements(userId: string, userRole: Role, params?: { pgId?: string; status?: AgreementStatus; page?: number; limit?: number }): Promise<any> {
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
          resident: { select: { id: true, username: true, email: true, profile: true } },
          pg: { select: { id: true, name: true } },
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

  async signAgreement(agreementId: string, data: ISignAgreementDTO): Promise<Agreement> {
    const agreement = await this.db.agreement.findUnique({
      where: { id: agreementId },
      include: { signatures: true },
    });

    if (!agreement) throw new NotFoundError('Agreement not found.');

    const isResident = agreement.residentId === data.signerId;
    const isOwner = agreement.ownerId === data.signerId;

    if (!isResident && !isOwner) {
      throw new ForbiddenError('You are not a designated party to sign this agreement.');
    }

    const signerRole = isResident ? Role.RESIDENT : Role.PG_OWNER;

    // Check if already signed by this party
    const alreadySigned = agreement.signatures.some((s) => s.signerId === data.signerId);
    if (alreadySigned) {
      throw new BadRequestError('You have already digitally signed this agreement.');
    }

    // Save signature
    await this.db.digitalSignature.create({
      data: {
        agreementId,
        signerId: data.signerId,
        signerRole,
        signatureType: data.signatureType,
        signatureData: data.signatureData,
        ipAddress: data.ipAddress,
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

    return await this.db.agreement.update({
      where: { id: agreementId },
      data: { status: nextStatus },
      include: { signatures: true },
    });
  }

  async generateAgreementPDF(agreementId: string): Promise<Buffer> {
    const agreement = await this.db.agreement.findUnique({
      where: { id: agreementId },
      include: {
        resident: { include: { profile: true } },
        owner: { include: { profile: true } },
        pg: { include: { location: true } },
        allocation: { include: { room: true, bed: true } },
        signatures: true,
      },
    });

    if (!agreement) throw new NotFoundError('Agreement not found.');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).fillColor('#C89A4B').text('ROOMBAE RESIDENTIAL LEASE AGREEMENT', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).fillColor('#333333');
      doc.text(`Agreement Number: ${agreement.agreementNumber}`);
      doc.text(`Effective Date: ${new Date(agreement.startDate).toLocaleDateString('en-IN')}`);
      doc.text(`Expiry Date: ${new Date(agreement.endDate).toLocaleDateString('en-IN')}`);
      doc.text(`Status: ${agreement.status}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('1. PARTIES TO THIS AGREEMENT');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Property Owner: ${agreement.owner.username} (${agreement.owner.email}, ${agreement.owner.phone})`);
      doc.text(`Resident / Tenant: ${agreement.resident.username} (${agreement.resident.email}, ${agreement.resident.phone})`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('2. PROPERTY & ACCOMMODATION DETAILS');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Property Name: ${agreement.pg.name}`);
      if (agreement.pg.location) {
        doc.text(`Address: ${agreement.pg.location.address}, ${agreement.pg.location.city}, ${agreement.pg.location.pincode}`);
      }
      if (agreement.allocation) {
        doc.text(`Assigned Unit: Room ${agreement.allocation.room.roomNumber} — Bed ${agreement.allocation.bed.bedNumber}`);
      }
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('3. FINANCIAL TERMS & RENT OBLIGATIONS');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Monthly Rent: ₹${agreement.rentAmount.toLocaleString('en-IN')} (exclusive of 18% GST)`);
      doc.text(`Security Deposit: ₹${agreement.depositAmount.toLocaleString('en-IN')} (Refundable upon checkout inspection)`);
      doc.text(`Notice Period: ${agreement.noticePeriodDays} Days`);
      doc.text(`Lock-in Period: ${agreement.lockInPeriodMonths} Months`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('4. DIGITAL SIGNATURES & EXECUTION');
      doc.fontSize(10).font('Helvetica');
      for (const sig of agreement.signatures) {
        doc.text(`Signed by ${sig.signerRole}: ${sig.signerId} | Type: ${sig.signatureType} | Timestamp: ${new Date(sig.signedAt).toISOString()}`);
      }
      doc.moveDown(2);

      doc.fontSize(8).fillColor('#888888').text('This legal contract was generated, cryptographically stamped, and executed through the RoomBae Platform.', { align: 'center' });

      doc.end();
    });
  }
}
