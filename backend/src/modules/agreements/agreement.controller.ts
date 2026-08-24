import { Request, Response, NextFunction } from 'express';
import { AgreementService } from './agreement.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';

export class AgreementController {
  constructor(private readonly agreementService: AgreementService) {}

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
      const { signatureType, signatureData } = req.body;
      if (!signatureType || !signatureData) {
        throw new BadRequestError('signatureType (DRAWN/TYPED/UPLOADED) and signatureData are required.');
      }

      const updated = await this.agreementService.signAgreement(id, {
        signerId: req.user.id,
        signatureType,
        signatureData,
        ipAddress: req.ip,
      });

      return ApiResponse.success(res, 'Agreement digitally signed successfully.', updated);
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
    } catch (error) {
      next(error);
    }
  };
}
