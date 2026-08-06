import { Request, Response } from "express";
import { IBillingService } from "../../interfaces/services/IBillingService";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";

export class BillingController {
  constructor(private readonly billingService: IBillingService) {}

  createOrder = catchAsync(async (req: Request, res: Response) => {
    const { residentId, baseAmount, isInterstate } = req.body;
    const order = await this.billingService.createPaymentOrder(
      residentId,
      baseAmount,
      isInterstate,
    );
    return ApiResponse.success(
      res,
      "Razorpay order created",
      order,
      undefined,
      201,
    );
  });

  verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const clientIp = req.ip || "unknown";
    const updatedPayment = await this.billingService.verifyPayment({
      ...req.body,
      clientIp,
    });
    return ApiResponse.success(
      res,
      "Payment verified and rent recorded",
      updatedPayment,
    );
  });

  getInvoicePdf = catchAsync(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const dispositionType = req.query.disposition === "inline" ? "inline" : "attachment";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename=Invoice_${paymentId}.pdf`,
    );

    await this.billingService.generateInvoicePdfStream(paymentId, res);
  });

  getReceiptPdf = catchAsync(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const dispositionType = req.query.disposition === "inline" ? "inline" : "attachment";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename=Receipt_${paymentId}.pdf`,
    );

    await this.billingService.generateReceiptPdfStream(paymentId, res);
  });

  processRefund = catchAsync(async (req: Request, res: Response) => {
    const { paymentId, amount, reason } = req.body;
    const result = await this.billingService.processRefund(paymentId, amount, reason);
    return ApiResponse.success(res, "Refund processed successfully", result);
  });

  handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = (req.headers["x-razorpay-signature"] as string) || "";
    const result = await this.billingService.handleWebhook(req.body, signature);
    return ApiResponse.success(res, "Webhook processed", result);
  });

  getAnalytics = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.query.ownerId as string | undefined;
    const analytics = await this.billingService.getPaymentAnalytics(ownerId);
    return ApiResponse.success(res, "Payment analytics retrieved", analytics);
  });
}
