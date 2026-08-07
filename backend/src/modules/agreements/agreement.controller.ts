import { Response, NextFunction } from 'express';
import { IAgreementService } from '../../interfaces/IAgreementService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Container } from '../../container';
import { prisma } from '../../config/prisma';

export class AgreementController {
  constructor(private readonly agreementService: IAgreementService) {}

  generate = catchAsync(async (req: AuthRequest, res: Response) => {
    const agreement = await this.agreementService.generateAgreement(req.body);
    return ApiResponse.success(res, 'Rental agreement generated', agreement, undefined, 201);
  });

  getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const agreement = await this.agreementService.getAgreementById(id);
    return ApiResponse.success(res, 'Agreement fetched', agreement);
  });

  sign = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';
    const result = await this.agreementService.signAgreement(id, { ...req.body, ipAddress });
    return ApiResponse.success(res, 'Agreement signed successfully', result);
  });

  /**
   * GET /agreements/:id/download
   * Now delegates to DocumentService — caches on Cloudinary, returns buffer.
   * Documents are immutable (generated once from a DB snapshot).
   * After signing, the document key changes (new version), triggering regeneration.
   */
  downloadPdf = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const user = req.user!;
    const dispositionType = req.query.disposition === 'inline' ? 'inline' : 'attachment';

    const { residentId, ownerId } = await resolveUserIdentifiers(user.id, user.role);

    // Use SIGNED_AGREEMENT if agreement has both signatures, otherwise DIGITAL_AGREEMENT
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      include: { signatures: true },
    });
    const documentType = (agreement?.signatures?.length ?? 0) >= 2
      ? 'SIGNED_AGREEMENT'
      : 'DIGITAL_AGREEMENT';

    const result = await Container.documentService.getOrGenerateDocument({
      entityId: id,
      documentType: documentType as any,
      requestingUserId: user.id,
      requestingUserRole: user.role,
      requestingUserResidentId: residentId,
      requestingUserOwnerId: ownerId,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'],
      // Version = number of signatures (re-generates on each new signature)
      version: Math.max(1, agreement?.signatures?.length ?? 1),
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('X-Document-Id', result.documentId);
    res.setHeader('X-SHA256-Hash', result.sha256Hash);
    res.setHeader('X-From-Cache', result.fromCache ? '1' : '0');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(result.buffer);
  });

  verify = catchAsync(async (req: AuthRequest, res: Response) => {
    const { agreementNumber } = req.params;
    const result = await this.agreementService.verifyAgreement(agreementNumber);
    return ApiResponse.success(res, result.message || 'Agreement verification completed', result);
  });

  getResidentAgreements = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId } = req.params;
    const agreements = await this.agreementService.getResidentAgreements(residentId);
    return ApiResponse.success(res, 'Resident agreements fetched', agreements);
  });
}

async function resolveUserIdentifiers(userId: string, role: string) {
  if (role === 'RESIDENT') {
    const resident = await prisma.resident.findFirst({ where: { userId } });
    return { residentId: resident?.id, ownerId: undefined };
  }
  if (role === 'OWNER' || role === 'MANAGER') {
    const owner = await prisma.owner.findFirst({ where: { userId } });
    return { residentId: undefined, ownerId: owner?.id };
  }
  return { residentId: undefined, ownerId: undefined };
}
