import { Request, Response } from 'express';
import { IBillingService } from '../../interfaces/services/IBillingService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';

export class BillingController {
  constructor(private readonly billingService: IBillingService) {}

  createOrder = catchAsync(async (req: Request, res: Response) => {
    const { residentId, baseAmount, isInterstate } = req.body;
    const order = await this.billingService.createPaymentOrder(residentId, baseAmount, isInterstate);
    return ApiResponse.success(res, 'Razorpay order created', order, undefined, 201);
  });

  verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const clientIp = req.ip || '127.0.0.1';
    const updatedPayment = await this.billingService.verifyPayment({
      ...req.body,
      clientIp
    });
    return ApiResponse.success(res, 'Payment verified and rent recorded', updatedPayment);
  });

  getInvoicePdf = catchAsync(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const pdfStream = await this.billingService.generateInvoicePdfStream(paymentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${paymentId}.pdf`);

    pdfStream.pipe(res);
  });
}
