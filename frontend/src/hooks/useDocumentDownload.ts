import { useState, useCallback, useRef } from 'react';
import { downloadFile } from '../services/fileDownload.service';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentDownloadState = 'idle' | 'generating' | 'downloading' | 'success' | 'error';

export type DocumentType =
  | 'INVOICE'
  | 'PAYMENT_RECEIPT'
  | 'RENT_RECEIPT'
  | 'REFUND_RECEIPT'
  | 'SECURITY_DEPOSIT_RECEIPT'
  | 'TRANSACTION_RECEIPT'
  | 'LEASE_AGREEMENT'
  | 'SIGNED_AGREEMENT'
  | 'DIGITAL_AGREEMENT'
  | 'KYC_DOCUMENT'
  | 'KYC_VERIFICATION';

export function getDocumentUrl(documentType: DocumentType, entityId: string): string {
  switch (documentType) {
    case 'LEASE_AGREEMENT':
    case 'SIGNED_AGREEMENT':
    case 'DIGITAL_AGREEMENT':
      return `${env.API_URL}/agreements/${entityId}/pdf`;
    case 'INVOICE':
      return `${env.API_URL}/billing/invoices/${entityId}/pdf`;
    case 'PAYMENT_RECEIPT':
    case 'RENT_RECEIPT':
    case 'TRANSACTION_RECEIPT':
    case 'SECURITY_DEPOSIT_RECEIPT':
      return `${env.API_URL}/payments/${entityId}/pdf`;
    case 'KYC_DOCUMENT':
    case 'KYC_VERIFICATION':
      return `${env.API_URL}/documents/${entityId}/download`;
    default:
      return `${env.API_URL}/documents/${entityId}`;
  }
}

const FRIENDLY_NAMES: Record<DocumentType, string> = {
  INVOICE: 'Invoice',
  PAYMENT_RECEIPT: 'Payment Receipt',
  RENT_RECEIPT: 'Rent Receipt',
  REFUND_RECEIPT: 'Refund Receipt',
  SECURITY_DEPOSIT_RECEIPT: 'Security Deposit Receipt',
  TRANSACTION_RECEIPT: 'Transaction Receipt',
  LEASE_AGREEMENT: 'Lease Agreement',
  SIGNED_AGREEMENT: 'Signed Agreement',
  DIGITAL_AGREEMENT: 'Digital Agreement',
  KYC_DOCUMENT: 'KYC Document',
  KYC_VERIFICATION: 'KYC Verification',
};

export interface DownloadDocumentOptions {
  entityId: string;
  documentType: DocumentType;
  fileName?: string;
  /** Retry config for 202 "in progress" responses */
  maxRetries?: number;
  retryDelayMs?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDocumentDownload — unified hook for all PDF downloads in RoomBae.
 *
 * Usage:
 *   const { download, getState, isDownloading, error } = useDocumentDownload();
 *
 *   <button
 *     disabled={isDownloading('invoice-paymentId123')}
 *     onClick={() => download({ entityId: 'paymentId123', documentType: 'INVOICE' })}
 *   >
 *     Download Invoice
 *   </button>
 *
 * Features:
 * - One key per (documentType + entityId) — parallel downloads of different documents work
 * - Prevents double-click duplicate downloads
 * - Handles 202 (generation in progress) with automatic retry
 * - Never puts JWT in URLs — uses Authorization header
 * - Exposes IDLE / GENERATING / DOWNLOADING / SUCCESS / ERROR states per document
 */
export const useDocumentDownload = () => {
  const [states, setStates] = useState<Record<string, DocumentDownloadState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const retryTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Tracks in-flight downloads to prevent duplicate requests (avoids stale closure)
  const inFlightRef = useRef<Record<string, boolean>>({});

  const buildKey = (entityId: string, documentType: DocumentType) =>
    `${documentType}:${entityId}`;

  const setState = (key: string, state: DocumentDownloadState) => {
    setStates(prev => ({ ...prev, [key]: state }));
  };

  const setError = (key: string, msg: string) => {
    setErrors(prev => ({ ...prev, [key]: msg }));
  };

  const clearError = (key: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /**
   * Download a document. If backend returns 202, automatically retries.
   * Uses a ref for in-flight tracking to avoid stale closures.
   */
  const download = useCallback(async (opts: DownloadDocumentOptions): Promise<void> => {
    const {
      entityId,
      documentType,
      fileName,
      maxRetries = 5,
      retryDelayMs = 3000,
    } = opts;

    const key = buildKey(entityId, documentType);

    // Prevent duplicate in-flight downloads using a ref (not state — avoids stale closure)
    if (inFlightRef.current[key]) {
      return;
    }
    inFlightRef.current[key] = true;

    clearError(key);
    setState(key, 'generating');

    const url = getDocumentUrl(documentType, entityId);
    const friendlyName = FRIENDLY_NAMES[documentType];
    const resolvedFileName = fileName ?? `RoomBae-${friendlyName}-${entityId.slice(-8).toUpperCase()}.pdf`;

    let attempts = 0;

    const attemptDownload = async (): Promise<void> => {
      attempts++;

      try {
        setState(key, 'generating');

        // Use the secure download utility (Authorization header, no URL token)
        await downloadFile({ url, filename: resolvedFileName });

        setState(key, 'success');
        inFlightRef.current[key] = false;

        // Auto-reset to idle after 3 seconds
        setTimeout(() => {
          setStates(prev => {
            if (prev[key] === 'success') {
              const next = { ...prev };
              delete next[key];
              return next;
            }
            return prev;
          });
        }, 3000);
      } catch (err: any) {
        // 202 — backend is still generating, retry after delay
        if (err.message?.includes('202') || err.message?.includes('in progress')) {
          if (attempts < maxRetries) {
            setState(key, 'generating');
            retryTimers.current[key] = setTimeout(attemptDownload, retryDelayMs);
            return;
          }
        }

        // AUTH errors — 401/403
        if (err.message?.includes('401') || err.message?.includes('403')) {
          setState(key, 'error');
          setError(key, 'Access denied. You are not authorized to download this document.');
          inFlightRef.current[key] = false;
          return;
        }

        // Final failure
        setState(key, 'error');
        setError(key, err.message || `Failed to download ${friendlyName}.`);
        inFlightRef.current[key] = false;
      }
    };

    await attemptDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Get the current download state for a given document.
   */
  const getState = useCallback(
    (entityId: string, documentType: DocumentType): DocumentDownloadState =>
      states[buildKey(entityId, documentType)] ?? 'idle',
    [states]
  );

  /**
   * Whether a given document is currently being generated or downloaded.
   */
  const isDownloading = useCallback(
    (entityId: string, documentType: DocumentType): boolean => {
      const s = states[buildKey(entityId, documentType)];
      return s === 'generating' || s === 'downloading';
    },
    [states]
  );

  /**
   * Get error message for a specific document (if any).
   */
  const getError = useCallback(
    (entityId: string, documentType: DocumentType): string | undefined =>
      errors[buildKey(entityId, documentType)],
    [errors]
  );

  /**
   * Dismiss error and reset a specific document to idle.
   */
  const reset = useCallback((entityId: string, documentType: DocumentType) => {
    const key = buildKey(entityId, documentType);
    clearError(key);
    inFlightRef.current[key] = false;
    if (retryTimers.current[key]) {
      clearTimeout(retryTimers.current[key]);
      delete retryTimers.current[key];
    }
    setStates(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    download,
    getState,
    isDownloading,
    getError,
    reset,
  };
};
