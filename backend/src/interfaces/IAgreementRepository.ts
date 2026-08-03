export interface IAgreementRepository {
  createAgreement(data: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByAgreementNumber(agreementNumber: string): Promise<any>;
  findByResidentId(residentId: string): Promise<any[]>;
  findByOwnerId(ownerId: string): Promise<any[]>;
  addSignature(agreementId: string, signatureData: any): Promise<any>;
  updateStatus(agreementId: string, status: string): Promise<any>;
  createVersionSnapshot(agreementId: string, contractHtml: string, changeReason?: string): Promise<any>;
}
