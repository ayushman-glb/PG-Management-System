import { api } from "./api";
import { DocumentItem } from "../types/Document";

export class DocumentService {
  async getUserDocuments(userId?: string): Promise<DocumentItem[]> {
    const url = userId ? `/documents?userId=${userId}` : "/documents";
    return api.get<DocumentItem[]>(url);
  }

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    return api.post<DocumentItem>("/documents/upload", formData);
  }

  async reuploadDocument(id: string, formData: FormData): Promise<DocumentItem> {
    return api.post<DocumentItem>(`/documents/${id}/reupload`, formData);
  }

  async getDocument(id: string): Promise<DocumentItem> {
    return api.get<DocumentItem>(`/documents/${id}`);
  }

  async getVersionHistory(id: string): Promise<DocumentItem[]> {
    return api.get<DocumentItem[]>(`/documents/${id}/history`);
  }

  async verifyDocument(id: string, status: string, rejectionReason?: string): Promise<DocumentItem> {
    return api.patch<DocumentItem>(`/documents/${id}/verify`, {
      status,
      rejectionReason,
    });
  }
}

export const documentService = new DocumentService();
export default documentService;
