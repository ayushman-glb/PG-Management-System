import { PrismaClient } from "@prisma/client";
import { IAgreementRepository } from "../../interfaces/IAgreementRepository";

export class AgreementRepository implements IAgreementRepository {
  constructor(private prisma: PrismaClient) {}

  async createAgreement(data: any): Promise<any> {
    return this.prisma.agreement.create({
      data: {
        agreementNumber:
          data.agreementNumber || `RMB-AGR-${Date.now().toString().slice(-6)}`,
        residentId: data.residentId,
        ownerId: data.ownerId,
        pgId: data.pgId,
        roomNumber: data.roomNumber,
        bedNumber: data.bedNumber,
        rentAmount: data.rentAmount,
        securityDeposit: data.securityDeposit,
        maintenanceCharges: data.maintenanceCharges || 500,
        electricityCharges:
          data.electricityCharges || "As per Sub-Meter Reading",
        wifiCharges: data.wifiCharges || "Complimentary High-Speed WiFi",
        foodCharges: data.foodCharges || "Included in Monthly Rent",
        noticePeriodDays: data.noticePeriodDays || 30,
        refundPolicy:
          data.refundPolicy ||
          "Security deposit refundable within 7 days post checkout deduction.",
        houseRules: data.houseRules || [
          "No loud music after 10 PM",
          "No smoking or alcohol",
        ],
        visitorPolicy:
          data.visitorPolicy ||
          "Visitors permitted in common lobby till 8:00 PM",
        curfewTime: data.curfewTime || "10:30 PM Gate Locking Time",
        damagePolicy:
          data.damagePolicy ||
          "Resident liable for physical property damage repairs.",
        prohibitedActivities: data.prohibitedActivities || [
          "Smoking",
          "Alcohol",
          "Illegal Substances",
        ],
        cleanlinessTerms:
          data.cleanlinessTerms ||
          "Daily housekeeping provided. Resident must maintain room hygiene.",
        terminationClause:
          data.terminationClause ||
          "Agreement terminable by either party with 30-day prior written notice.",
        privacyClause:
          data.privacyClause ||
          "Resident data protected under IT Act & DPDP Act 2023.",
        disputeJurisdiction:
          data.disputeJurisdiction || "City Civil Courts Jurisdiction",
        witnessName: data.witnessName,
        witnessPhone: data.witnessPhone,
        startDate: new Date(data.startDate || Date.now()),
        endDate: new Date(
          data.endDate || Date.now() + 365 * 24 * 60 * 60 * 1000,
        ),
        status: data.status || "PENDING",
        qrVerificationPayload: `https://roombae.com/verify-agreement/${data.agreementNumber || "RMB-AGR-001"}`,
      },
      include: {
        resident: true,
        owner: true,
        pg: true,
        signatures: true,
        versions: true,
      },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.agreement.findUnique({
      where: { id },
      include: {
        resident: true,
        owner: true,
        pg: true,
        signatures: true,
        versions: true,
      },
    });
  }

  async findByAgreementNumber(agreementNumber: string): Promise<any> {
    return this.prisma.agreement.findUnique({
      where: { agreementNumber },
      include: {
        signatures: true,
      },
    });
  }

  async findByResidentId(residentId: string): Promise<any[]> {
    return this.prisma.agreement.findMany({
      where: { residentId },
      include: {
        resident: true,
        owner: true,
        pg: true,
        signatures: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    return this.prisma.agreement.findMany({
      where: { ownerId },
      include: {
        resident: true,
        owner: true,
        pg: true,
        signatures: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addSignature(agreementId: string, signatureData: any): Promise<any> {
    return this.prisma.signature.create({
      data: {
        agreementId,
        signerType: signatureData.signerType,
        signerName: signatureData.signerName,
        signatureDataSvg: signatureData.signatureDataSvg,
        ipAddress: signatureData.ipAddress || "unknown",
        hashHmac: signatureData.hashHmac || `HMAC-${Date.now()}`,
      },
    });
  }

  async updateStatus(agreementId: string, status: any): Promise<any> {
    return this.prisma.agreement.update({
      where: { id: agreementId },
      data: { status },
    });
  }

  async createVersionSnapshot(
    agreementId: string,
    contractHtml: string,
    changeReason?: string,
  ): Promise<any> {
    const existingVersions = await this.prisma.agreementVersion.count({
      where: { agreementId },
    });
    return this.prisma.agreementVersion.create({
      data: {
        agreementId,
        versionNumber: existingVersions + 1,
        contractHtml,
        changeReason: changeReason || "Agreement terms generated/updated",
      },
    });
  }
}
