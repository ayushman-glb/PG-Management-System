import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { invoiceId, bookingId, customAmount } = req.body;
      const order = await this.paymentService.createRazorpayOrder(req.user.id, invoiceId, bookingId, customAmount);
      return ApiResponse.success(res, 'Payment order created.', order);
    } catch (error) {
      next(error);
    }
  };

  verifyRazorpay = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;
      if (!paymentId || !razorpayPaymentId) {
        throw new BadRequestError('paymentId and razorpayPaymentId are required.');
      }

      const payment = await this.paymentService.verifyRazorpayPayment(paymentId, razorpayPaymentId, razorpaySignature);
      return ApiResponse.success(res, 'Payment verified successfully!', payment);
    } catch (error) {
      next(error);
    }
  };

  submitManual = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { invoiceId, bookingId, amount, paymentMethod, manualUtr, manualProofUrl } = req.body;
      if (!manualUtr || !amount) {
        throw new BadRequestError('manualUtr and amount are required.');
      }

      const payment = await this.paymentService.submitManualPayment(req.user.id, {
        invoiceId,
        bookingId,
        amount: Number(amount),
        paymentMethod: paymentMethod || 'UPI_MANUAL',
        manualUtr,
        manualProofUrl,
      });

      return ApiResponse.success(res, 'Manual payment proof submitted for owner verification.', payment, 201);
    } catch (error) {
      next(error);
    }
  };

  verifyManual = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { approve, rejectionReason } = req.body;
      if (approve === undefined) throw new BadRequestError('approve (boolean) is required.');

      const payment = await this.paymentService.verifyManualPayment(id, req.user.id, Boolean(approve), rejectionReason);
      return ApiResponse.success(res, approve ? 'Manual payment verified and invoice updated.' : 'Manual payment marked as rejected.', payment);
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const rawPayload = JSON.stringify(req.body);
      const result = await this.paymentService.handleRazorpayWebhook(rawPayload, signature);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  downloadReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const pdfBuffer = await this.paymentService.generateReceiptPDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt_${id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
