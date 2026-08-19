import { env } from '../config/env';
import { authService } from './auth.service';

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
  private getToken(): string | null {
    return authService.getToken();
  }

  /**
   * Single file upload using XMLHttpRequest for accurate progress tracking
   */
  async uploadSingle(
    file: File,
    folder: string = 'documents',
    onProgress?: UploadProgressCallback,
    maxRetries: number = 2
  ): Promise<CloudinaryAssetResponse> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await this.executeXHRUpload(file, folder, onProgress);
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }
    throw new Error('Upload failed after max retries.');
  }

  private executeXHRUpload(
    file: File,
    folder: string,
    onProgress?: UploadProgressCallback
  ): Promise<CloudinaryAssetResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      xhr.open('POST', `${env.API_URL}/media/upload/single`, true);

      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.data) {
              resolve(res.data);
            } else {
              reject(new Error(res.message || 'File upload failed.'));
            }
          } catch (e) {
            reject(new Error('Invalid response from server.'));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.message || `Upload failed with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload.'));
      xhr.ontimeout = () => reject(new Error('File upload timed out.'));

      xhr.send(formData);
    });
  }

  /**
   * Batch upload multiple files
   */
  async uploadMultiple(
    files: File[],
    folder: string = 'documents',
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
    folder: string = 'documents',
    onProgress?: UploadProgressCallback
  ): Promise<CloudinaryAssetResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', newFile);
      formData.append('folder', folder);

      xhr.open('PUT', `${env.API_URL}/media/replace/${encodeURIComponent(publicId)}`, true);

      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.data);
        } else {
          reject(new Error(`Replacement failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during image replacement.'));
      xhr.send(formData);
    });
  }

  /**
   * Delete asset by publicId
   */
  async deleteImage(publicId: string): Promise<boolean> {
    const token = this.getToken();
    const response = await fetch(`${env.API_URL}/media/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }
    const data = await response.json();
    return data.success;
  }

  /**
   * Bulk delete assets
   */
  async bulkDeleteImages(publicIds: string[]): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${env.API_URL}/media/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ publicIds }),
    });

    if (!response.ok) {
      throw new Error(`Bulk delete failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Reorder assets
   */
  async reorderImages(publicIds: string[], entityType?: string, entityId?: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${env.API_URL}/media/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ publicIds, entityType, entityId }),
    });

    if (!response.ok) {
      throw new Error(`Reorder failed: ${response.statusText}`);
    }
    return response.json();
  }
}

export const mediaService = new MediaService();
