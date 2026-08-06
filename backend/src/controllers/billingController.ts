import { Response } from "express";
import { IBillingService } from "../interfaces/services/IBillingService";
import { catchAsync } from "../utils/appError";
import { ApiResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middleware/authMiddleware";

export class BillingController {
  constructor(private readonly billingService: IBillingService) {}

  createOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId, baseAmount, isInterstate } = req.body;
    const result = await this.billingService.createPaymentOrder(
      residentId,
      baseAmount,
      isInterstate,
    );
    return ApiResponse.success(
      res,
      "Razorpay payment order initialized",
      result,
      201,
    );
  });

  verifyPayment = catchAsync(async (req: AuthRequest, res: Response) => {
    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";
    const result = await this.billingService.verifyPayment({
      ...req.body,
      clientIp: Array.isArray(ip) ? ip[0] : ip,
    });
    return ApiResponse.success(
      res,
      "Payment verified successfully and bed status updated",
      result,
    );
  });

  downloadPdfInvoice = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const dispositionType = req.query.disposition === "inline" ? "inline" : "attachment";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename=Invoice-${id}.pdf`,
    );

    await this.billingService.generateInvoicePdfStream(id, res);
  });
}
