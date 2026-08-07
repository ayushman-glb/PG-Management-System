/**
 * PdfKitAgreementService — updated to delegate to AgreementPdfGenerator.
 * Kept for interface compatibility with IPdfAgreementService / AgreementService.
 */
import { IPdfAgreementService } from '../../interfaces/IPdfAgreementService';
import { AgreementPdfGenerator, AgreementSnapshot } from './generators/AgreementPdfGenerator';

const agreementGen = new AgreementPdfGenerator();

export class PdfKitAgreementService implements IPdfAgreementService {
  async generateAgreementPdfBuffer(agreement: any): Promise<Buffer> {
    const snapshot = mapAgreementToSnapshot(agreement);
    return agreementGen.generate(snapshot);
  }
}

function mapAgreementToSnapshot(agreement: any): AgreementSnapshot {
  const resident = agreement.resident ?? {};
  const owner = agreement.owner ?? {};
  const pg = agreement.pg ?? {};

  return {
    agreementNumber: agreement.agreementNumber ?? `RMB-AGR-${Date.now()}`,
    agreementVersion: agreement.versions?.length ?? 1,
    status: agreement.status ?? 'PENDING',
    startDate: agreement.startDate ?? new Date(),
    endDate: agreement.endDate ?? new Date(),
    createdAt: agreement.createdAt ?? new Date(),
    // Owner
    ownerName: owner.name ?? owner.user?.name ?? 'PG Owner',
    ownerEmail: owner.email ?? owner.user?.email,
    ownerPhone: owner.phone ?? owner.user?.phone,
    ownerAddress: owner.address,
    // Resident
    residentName: resident.name ?? resident.user?.name ?? 'Resident',
    residentEmail: resident.email ?? resident.user?.email,
    residentPhone: resident.phone ?? resident.user?.phone,
    residentCode: resident.user?.residentCode ?? resident.residentCode,
    residentAddress: resident.permanentAddress,
    residentOccupation: resident.occupation,
    // Property
    pgName: pg.name ?? 'RoomBae PG',
    pgAddress: pg.address,
    pgCity: pg.city,
    roomNumber: agreement.roomNumber ?? 'N/A',
    bedNumber: agreement.bedNumber ?? 'N/A',
    // Financial Terms
    rentAmount: Number(agreement.rentAmount ?? 0),
    securityDeposit: Number(agreement.securityDeposit ?? 0),
    maintenanceCharges: Number(agreement.maintenanceCharges ?? 500),
    electricityCharges: agreement.electricityCharges ?? 'As per Sub-Meter Reading',
    wifiCharges: agreement.wifiCharges ?? 'Complimentary High-Speed WiFi',
    foodCharges: agreement.foodCharges ?? 'Included in Monthly Rent',
    noticePeriodDays: agreement.noticePeriodDays ?? 30,
    // Rules
    houseRules: agreement.houseRules ?? [],
    visitorPolicy: agreement.visitorPolicy ?? 'Visitors permitted in common areas till 8 PM.',
    curfewTime: agreement.curfewTime ?? '10:30 PM Gate Locking Time',
    damagePolicy: agreement.damagePolicy ?? 'Resident liable for physical property damage repairs.',
    prohibitedActivities: agreement.prohibitedActivities ?? ['Smoking', 'Alcohol', 'Illegal Substances'],
    terminationClause: agreement.terminationClause ?? 'Agreement terminable by either party with 30-day prior written notice.',
    disputeJurisdiction: agreement.disputeJurisdiction ?? 'City Civil Courts Jurisdiction',
    refundPolicy: agreement.refundPolicy ?? 'Security deposit refundable within 7 days post checkout deduction.',
    // Signatures
    signatures: (agreement.signatures ?? []).map((sig: any) => ({
      signerType: sig.signerType,
      signerName: sig.signerName,
      signatureDataSvg: sig.signatureDataSvg,
      ipAddress: sig.ipAddress,
      timestamp: sig.timestamp,
      hashHmac: sig.hashHmac,
    })),
    // Witness
    witnessName: agreement.witnessName,
    witnessPhone: agreement.witnessPhone,
  };
}
