export interface IPdfAgreementService {
  generateAgreementPdfBuffer(agreementData: any): Promise<Buffer>;
}
