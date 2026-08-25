import { api } from "./api";

export interface CloudinaryAssetResponse {
  url: string;
  secureUrl: string;
  publicId: string;
  assetId?: string;
  folder: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  originalFilename?: string;
  recordId?: string;
}

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export class MediaService {
  /**
   * Single file upload using api client with FormData
   */
  async uploadSingle(
    file: File,
    folder: string = "documents",
    onProgress?: UploadProgressCallback,
    maxRetries: number = 2
  ): Promise<CloudinaryAssetResponse> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        if (onProgress) onProgress(30);
        const res = await api.post<any>("/media/upload/single", formData);
        if (onProgress) onProgress(100);

        return res?.data ?? res;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error("Upload failed after max retries.");
  }

  /**
   * Batch upload multiple files
   */
  async uploadMultiple(
    files: File[],
    folder: string = "documents",
    onProgress?: (totalProgressPercent: number) => void
  ): Promise<CloudinaryAssetResponse[]> {
    const totalFiles = files.length;
    if (totalFiles === 0) return [];

    const fileProgresses = new Array(totalFiles).fill(0);

    const uploads = files.map((file, idx) =>
      this.uploadSingle(file, folder, (percent) => {
        fileProgresses[idx] = percent;
        if (onProgress) {
          const avg = Math.round(fileProgresses.reduce((a, b) => a + b, 0) / totalFiles);
          onProgress(avg);
        }
      })
    );

    return Promise.all(uploads);
  }

  /**
   * Replace existing asset
   */
  async replaceImage(
    publicId: string,
    newFile: File,
    folder: string = "documents",
    onProgress?: UploadProgressCallback
  ): Promise<CloudinaryAssetResponse> {
    const formData = new FormData();
    formData.append("file", newFile);
    formData.append("folder", folder);

    if (onProgress) onProgress(30);
    const res = await api.put<any>(`/media/replace/${encodeURIComponent(publicId)}`, formData);
    if (onProgress) onProgress(100);

    return res?.data ?? res;
  }

  /**
   * Delete asset by publicId
   */
  async deleteImage(publicId: string): Promise<boolean> {
    const res = await api.delete(`/media/${encodeURIComponent(publicId)}`);
    return res?.success ?? true;
  }

  /**
   * Bulk delete assets
   */
  async bulkDeleteImages(publicIds: string[]): Promise<any> {
    return api.post("/media/bulk-delete", { publicIds });
  }

  /**
   * Reorder assets
   */
  async reorderImages(publicIds: string[], entityType?: string, entityId?: string): Promise<any> {
    return api.patch("/media/reorder", { publicIds, entityType, entityId });
  }
}

export const mediaService = new MediaService();
