import { api } from "./api";
import { DocumentItem } from "../types/Document";

export class DocumentService {
  async getUserDocuments(userId?: string): Promise<DocumentItem[]> {
    const url = userId ? `/documents?userId=${userId}` : "/documents";
    const res = await api.get<any>(url);
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : [];
  }

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await api.post<any>("/documents/upload", formData);
    return res?.data ?? res;
  }

  async reuploadDocument(id: string, formData: FormData): Promise<DocumentItem> {
    const res = await api.post<any>(`/documents/${id}/reupload`, formData);
    return res?.data ?? res;
  }

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await api.get<any>(`/documents/${id}`);
    return res?.data ?? res;
  }

  async getVersionHistory(id: string): Promise<DocumentItem[]> {
    const res = await api.get<any>(`/documents/${id}/history`);
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : [];
  }

  async verifyDocument(id: string, status: string, rejectionReason?: string): Promise<DocumentItem> {
    const res = await api.patch<any>(`/documents/${id}/verify`, {
      status,
      rejectionReason,
    });
    return res?.data ?? res;
  }
}

export const documentService = new DocumentService();
export default documentService;
