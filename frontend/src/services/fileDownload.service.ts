/**
 * fileDownload.service.ts — core download utility.
 *
 * FIX: Removed the ?token= URL-appending hack. JWTs must never appear in
 * URLs (logged by servers, stored in browser history, leaked in Referer headers).
 * All download requests now use Authorization: Bearer header exclusively.
 */

import { authService } from './auth.service';

export interface DownloadOptions {
  url: string;
  filename: string;
  onProgress?: (progress: number) => void;
}

export const downloadFile = async ({ url, filename }: DownloadOptions): Promise<void> => {
  const token = authService.getToken();

  const headers: Record<string, string> = {};
  if (token) {
    // SECURE: token in Authorization header, NEVER in URL
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, credentials: 'include' });

  // Check for error — backend may return JSON error body even with error status
  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(
        errorJson.message || errorJson.error || `Download failed: HTTP ${res.status}`
      );
    }
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = finalFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after a tick to ensure the click fires
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
};
