import { api } from "./api";

export class DocumentService {
  async uploadDocument(formData: FormData) {
    return api.post("/documents/upload", formData);
  }

  async getAgreements(residentId?: string) {
    const url = residentId ? `/documents/agreements?residentId=${residentId}` : "/documents/agreements";
    return api.get(url);
  }
}

export const documentService = new DocumentService();
