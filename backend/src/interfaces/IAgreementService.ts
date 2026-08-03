export interface IAgreementService {
  generateAgreement(data: any): Promise<any>;
  getAgreementById(id: string): Promise<any>;
  signAgreement(agreementId: string, signatureData: any): Promise<any>;
  downloadAgreementPdfBuffer(agreementId: string): Promise<Buffer>;
  verifyAgreement(agreementNumber: string): Promise<any>;
  getResidentAgreements(residentId: string): Promise<any[]>;
}
