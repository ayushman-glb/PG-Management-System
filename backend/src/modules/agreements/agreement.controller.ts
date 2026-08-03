import { Request, Response } from "express";
import { IAgreementService } from "../../interfaces/IAgreementService";
import { catchAsync } from "../../utils/appError";
import { ApiResponse } from "../../utils/apiResponse";

export class AgreementController {
  constructor(private readonly agreementService: IAgreementService) {}

  generate = catchAsync(async (req: Request, res: Response) => {
    const agreement = await this.agreementService.generateAgreement(req.body);
    return ApiResponse.success(
      res,
      "Rental agreement generated",
      agreement,
      undefined,
      201,
    );
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const agreement = await this.agreementService.getAgreementById(id);
    return ApiResponse.success(res, "Agreement fetched", agreement);
  });

  sign = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ipAddress = req.ip || "unknown";
    const result = await this.agreementService.signAgreement(id, {
      ...req.body,
      ipAddress,
    });
    return ApiResponse.success(res, "Agreement signed successfully", result);
  });

  downloadPdf = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const pdfBuffer =
      await this.agreementService.downloadAgreementPdfBuffer(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Agreement_${id}.pdf`,
    );
    res.send(pdfBuffer);
  });

  verify = catchAsync(async (req: Request, res: Response) => {
    const { agreementNumber } = req.params;
    const result = await this.agreementService.verifyAgreement(agreementNumber);
    return ApiResponse.success(
      res,
      result.message || "Agreement verification completed",
      result,
    );
  });

  getResidentAgreements = catchAsync(async (req: Request, res: Response) => {
    const { residentId } = req.params;
    const agreements =
      await this.agreementService.getResidentAgreements(residentId);
    return ApiResponse.success(res, "Resident agreements fetched", agreements);
  });
}
