import { Request, Response } from 'express';
import { IAgreementService } from '../interfaces/IAgreementService';

export class AgreementController {
  constructor(private agreementService: IAgreementService) {}

  public generateAgreement = async (req: Request, res: Response): Promise<void> => {
    try {
      const agreement = await this.agreementService.generateAgreement(req.body);
      res.status(201).json({
        success: true,
        message: 'Rental agreement created successfully',
        data: agreement
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  public getAgreementById = async (req: Request, res: Response): Promise<void> => {
    try {
      const agreement = await this.agreementService.getAgreementById(req.params.id);
      res.status(200).json({ success: true, data: agreement });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  };

  public signAgreement = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.agreementService.signAgreement(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Agreement signed successfully',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  public downloadPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const pdfBuffer = await this.agreementService.downloadAgreementPdfBuffer(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=RoomBae-Agreement-${req.params.id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public verifyAgreement = async (req: Request, res: Response): Promise<void> => {
    try {
      const info = await this.agreementService.verifyAgreement(req.params.agreementNumber);
      res.status(200).json({ success: true, data: info });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  public getResidentAgreements = async (req: Request, res: Response): Promise<void> => {
    try {
      const agreements = await this.agreementService.getResidentAgreements(req.params.residentId);
      res.status(200).json({ success: true, data: agreements });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
