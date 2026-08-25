import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { Role } from '@prisma/client';

export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { residentId, pgId, month, year } = req.body;
      if (!residentId || !pgId) throw new BadRequestError('residentId and pgId are required.');

      const invoice = await this.billingService.generateMonthlyInvoice(residentId, pgId, month ? Number(month) : undefined, year ? Number(year) : undefined);
      return ApiResponse.success(res, 'Invoice generated successfully.', invoice, 201);
    } catch (error) {
      next(error);
    }
  };

  getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      if (req.user.role === Role.RESIDENT) {
        const data = await this.billingService.getResidentInvoices(req.user.id);
        return ApiResponse.success(res, 'Invoices retrieved.', data);
      } else {
        const { pgId } = req.query;
        const data = await this.billingService.getOwnerInvoices(req.user.id, pgId as string);
        return ApiResponse.success(res, 'Invoices retrieved.', data);
      }
    } catch (error) {
      next(error);
    }
  };

  getResidentInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const data = await this.billingService.getResidentInvoices(req.user.id);
      return ApiResponse.success(res, 'Resident billing and invoices retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getOwnerInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const data = await this.billingService.getOwnerInvoices(req.user.id, pgId as string);
      return ApiResponse.success(res, 'Owner property billing retrieved.', data);
    } catch (error) {
      next(error);
    }
  };

  getUserDues = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const dues = await this.billingService.calculateOutstandingDues(userId);
      return ApiResponse.success(res, 'Outstanding dues calculated.', dues);
    } catch (error) {
      next(error);
    }
  };

  downloadInvoicePdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const pdfBuffer = await this.billingService.generateInvoicePDF(id, req.user.id, req.user.role);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
