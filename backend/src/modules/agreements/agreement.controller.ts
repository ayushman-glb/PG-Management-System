import { Request, Response, NextFunction } from 'express';
import { AgreementService } from './agreement.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';

export class AgreementController {
  constructor(private readonly agreementService: AgreementService = new AgreementService()) {}

  createAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const agreement = await this.agreementService.createAgreement(req.user.id, req.body);
      return ApiResponse.success(res, 'Rental agreement created successfully.', agreement, 201);
    } catch (error) {
      next(error);
    }
  };

  updateAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const updated = await this.agreementService.updateAgreement(id, req.user.id, req.body);
      return ApiResponse.success(res, 'Rental agreement draft updated.', updated);
    } catch (error) {
      next(error);
    }
  };

  sendAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const sent = await this.agreementService.sendAgreement(id, req.user.id);
      return ApiResponse.success(res, 'Rental agreement sent to resident for signature.', sent);
    } catch (error) {
      next(error);
    }
  };

  listAgreements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const result = await this.agreementService.listAgreements(req.user.id, req.user.role, req.query as any);
      return ApiResponse.success(res, 'Agreements retrieved.', result);
    } catch (error) {
      next(error);
    }
  };

  getAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const agreement = await this.agreementService.getAgreement(id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Agreement contract retrieved.', agreement);
    } catch (error) {
      next(error);
    }
  };

  signAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { signatureType, signatureData, consent, override } = req.body;
      if (!signatureType || !signatureData) {
        throw new BadRequestError('signatureType (DRAWN/TYPED/UPLOADED) and signatureData are required.');
      }

      const updated = await this.agreementService.signAgreement(id, req.user.id, {
        signatureType,
        signatureData,
        consent,
        override,
        ipAddress: req.ip,
      });

      return ApiResponse.success(res, 'Agreement digitally signed successfully.', updated);
    } catch (error) {
      next(error);
    }
  };

  verifyAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agreementNumber } = req.params;
      if (!agreementNumber) throw new BadRequestError('Agreement number is required.');
      const verification = await this.agreementService.verifyAgreement(agreementNumber);
      return ApiResponse.success(res, 'Agreement verification information retrieved.', verification);
    } catch (error) {
      next(error);
    }
  };

  downloadPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const pdfBuffer = await this.agreementService.generateAgreementPDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=agreement_${id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || 'N/A';
      console.error(
        `[AgreementController:downloadPDF] [correlationId: ${correlationId}] ${req.method} ${req.originalUrl} - Error:`,
        error
      );

      const errorMsg = error?.message || '';
      if (
        errorMsg.includes('Could not find Chrome') ||
        errorMsg.includes('PDF Engine Initialization') ||
        errorMsg.includes('Chromium') ||
        errorMsg.includes('ENOENT')
      ) {
        return res.status(503).json({
          success: false,
          error: 'PDF service temporarily unavailable. Please try again shortly.',
          code: 'PDF_ENGINE_UNAVAILABLE',
        });
      }

      if (error.statusCode === 404 || error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message || 'Agreement not found.',
          code: 'AGREEMENT_NOT_FOUND',
        });
      }

      if (error.statusCode === 403 || error.name === 'ForbiddenError') {
        return res.status(403).json({
          success: false,
          error: error.message || 'Access denied.',
          code: 'FORBIDDEN',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF',
        code: 'PDF_GENERATION_FAILED',
      });
    }
  };
}
