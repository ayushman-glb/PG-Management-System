import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { Role } from '@prisma/client';
import { AuthRequest } from '../../middleware/authMiddleware';

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
    } catch (error: any) {
      const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || 'N/A';
      console.error(
        `[BillingController:downloadInvoicePdf] [correlationId: ${correlationId}] ${req.method} ${req.originalUrl} - Error:`,
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

      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const invoice = await this.billingService.getInvoiceById(id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Invoice details retrieved.', invoice);
    } catch (error) {
      next(error);
    }
  };

  levyFine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const fine = await this.billingService.levyFine(req.user.id, req.body);
      return ApiResponse.success(res, 'Fine levied successfully.', fine, 201);
    } catch (error) {
      next(error);
    }
  };

  waiveFine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const fine = await this.billingService.waiveFine(req.user.id, req.params.id);
      return ApiResponse.success(res, 'Fine waived successfully.', fine);
    } catch (error) {
      next(error);
    }
  };

  getFines = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const fines = await this.billingService.getFines(req.user.id, req.user.role, pgId as string);
      return ApiResponse.success(res, 'Fines retrieved successfully.', fines);
    } catch (error) {
      next(error);
    }
  };
}
