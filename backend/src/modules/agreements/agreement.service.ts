import crypto from 'crypto';
import { IAgreementService } from '../../interfaces/IAgreementService';
import { IAgreementRepository } from '../../interfaces/IAgreementRepository';
import { IPdfAgreementService } from '../../interfaces/IPdfAgreementService';
import { SocketServer } from '../../socket/socketServer';
import { env } from '../../config/env';

export class AgreementService implements IAgreementService {
  constructor(
    private agreementRepo: IAgreementRepository,
    private pdfService: IPdfAgreementService
  ) {}

  async generateAgreement(data: any): Promise<any> {
    const agreement = await this.agreementRepo.createAgreement(data);

    const defaultHtml = `
      <h1>ROOMBAE LEASE AGREEMENT</h1>
      <p>Agreement No: ${agreement.agreementNumber}</p>
      <p>Resident: ${agreement.resident?.name || 'Resident'}</p>
      <p>Rent: ₹${agreement.rentAmount}/month</p>
    `;
    await this.agreementRepo.createVersionSnapshot(agreement.id, defaultHtml, 'Initial Draft Generated');

    SocketServer.emitToResident(agreement.residentId, 'agreement:created', agreement);
    SocketServer.emitToOwner(agreement.ownerId, 'agreement:created', agreement);

    return agreement;
  }

  async getAgreementById(id: string): Promise<any> {
    const agreement = await this.agreementRepo.findById(id);
    if (!agreement) {
      throw new Error('Agreement not found');
    }
    return agreement;
  }

  async signAgreement(agreementId: string, signatureData: any): Promise<any> {
    const agreement = await this.agreementRepo.findById(agreementId);
    if (!agreement) {
      throw new Error('Agreement not found');
    }

    const hmacSecret = env.JWT_SECRET;
    const payload = `${agreementId}:${signatureData.signerType}:${signatureData.signerName}:${Date.now()}`;
    const hashHmac = crypto.createHmac('sha256', hmacSecret).update(payload).digest('hex');

    const signature = await this.agreementRepo.addSignature(agreementId, {
      ...signatureData,
      hashHmac
    });

    let newStatus = agreement.status;
    if (signatureData.signerType === 'RESIDENT') {
      newStatus = agreement.signatures?.some((s: any) => s.signerType === 'OWNER')
        ? 'COMPLETED'
        : 'SIGNED_BY_RESIDENT';
    } else if (signatureData.signerType === 'OWNER') {
      newStatus = agreement.signatures?.some((s: any) => s.signerType === 'RESIDENT')
        ? 'COMPLETED'
        : 'SIGNED_BY_OWNER';
    }

    const updated = await this.agreementRepo.updateStatus(agreementId, newStatus);

    SocketServer.emitToResident(agreement.residentId, 'agreement:signed', { agreementId, signature, status: newStatus });
    SocketServer.emitToOwner(agreement.ownerId, 'agreement:signed', { agreementId, signature, status: newStatus });

    return { signature, agreement: updated };
  }

  async downloadAgreementPdfBuffer(agreementId: string): Promise<Buffer> {
    const agreement = await this.agreementRepo.findById(agreementId);
    if (!agreement) {
      throw new Error('Agreement not found');
    }
    return this.pdfService.generateAgreementPdfBuffer(agreement);
  }

  async verifyAgreement(agreementNumber: string): Promise<any> {
    const agreement = await this.agreementRepo.findByAgreementNumber(agreementNumber);
    if (!agreement) {
      return {
        verified: false,
        agreementNumber,
        timestamp: new Date().toISOString(),
        message: 'Agreement not found or has not been issued by RoomBae Co-Living Legal System.'
      };
    }
    return {
      verified: true,
      agreementNumber,
      status: agreement.status,
      residentId: agreement.residentId,
      ownerId: agreement.ownerId,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      timestamp: new Date().toISOString(),
      issuer: 'RoomBae Co-Living Legal System'
    };
  }

  async getResidentAgreements(residentId: string): Promise<any[]> {
    return this.agreementRepo.findByResidentId(residentId);
  }
}
