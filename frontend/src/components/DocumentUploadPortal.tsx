import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Eye, Building, UserCheck, Lock, AlertCircle, RefreshCw, X, Download
} from 'lucide-react';
import { useTheme } from '../theme';
import { documentService } from '../services/document.service';
import { DocumentItem, DocumentType } from '../types/Document';

const RESIDENT_DOC_TYPES: Array<{ type: DocumentType; label: string; description: string }> = [
  { type: 'AADHAAR_FRONT', label: 'Aadhaar Card (Front)', description: 'Government Identity Proof' },
  { type: 'AADHAAR_BACK', label: 'Aadhaar Card (Back)', description: 'Address & QR Code' },
  { type: 'PAN_CARD', label: 'PAN Card', description: 'Financial Verification' },
  { type: 'COLLEGE_OFFICE_ID', label: 'College / Employee ID', description: 'Student or Employment Verification' },
  { type: 'PASSPORT', label: 'Passport / Driving License', description: 'Optional secondary ID' },
  { type: 'GUARDIAN_PROOF', label: 'Guardian / Emergency Contact Proof', description: 'Parent or Guardian ID' },
];

const OWNER_DOC_TYPES: Array<{ type: DocumentType; label: string; description: string }> = [
  { type: 'PAN_CARD', label: 'Owner PAN Card', description: 'Tax & Entity Verification' },
  { type: 'AADHAAR_FRONT', label: 'Owner Aadhaar Card', description: 'Identity Verification' },
  { type: 'PROPERTY_DEED', label: 'Property Ownership / Lease Deed', description: 'Legal Title / Leasehold Agreement' },
  { type: 'RENTAL_LICENSE', label: 'Commercial Rental License', description: 'Trade or Municipal Clearance' },
  { type: 'GST_CERTIFICATE', label: 'GST Certificate (Optional)', description: 'Tax Registration' },
  { type: 'BANK_DOCUMENT', label: 'Bank Account Proof / Cheque', description: 'Payout Settlement Verification' },
];

export const DocumentUploadPortal: React.FC = () => {
  const [activeRoleTab, setActiveRoleTab] = useState<'resident' | 'owner'>('resident');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [reuploadingDocId, setReuploadingDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentTargetType = useRef<DocumentType | null>(null);
  const currentTargetDocId = useRef<string | null>(null);

  const { darkMode } = useTheme();

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res: any = await documentService.getUserDocuments();
      const docList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setDocuments(docList);
    } catch (e: any) {
      console.error('Error loading documents:', e);
      setErrorMsg('Unable to load uploaded documents. Please try again.');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUploadClick = (docType: DocumentType, existingDocId?: string) => {
    currentTargetType.current = docType;
    currentTargetDocId.current = existingDocId || null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTargetType.current) return;

    const docType = currentTargetType.current;
    const existingDocId = currentTargetDocId.current;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);
    formData.append('title', file.name);

    try {
      if (existingDocId) {
        setReuploadingDocId(existingDocId);
        await documentService.reuploadDocument(existingDocId, formData);
      } else {
        setUploadingType(docType);
        await documentService.uploadDocument(formData);
      }
      await loadDocuments();
    } catch (err: any) {
      console.error('Document upload error:', err);
      alert(`Upload failed: ${err.message || 'File processing error'}`);
    } finally {
      setUploadingType(null);
      setReuploadingDocId(null);
      currentTargetType.current = null;
      currentTargetDocId.current = null;
    }
  };

  const docSlots = activeRoleTab === 'resident' ? RESIDENT_DOC_TYPES : OWNER_DOC_TYPES;

  const containerBg = darkMode ? "bg-neutral-900/60 border-white/10 text-white" : "bg-[#F8EEE5] border-[#E6D7CA] text-[#3B2A24]";
  const cardBg = darkMode ? "bg-neutral-900 border-white/10 text-white shadow-xl" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] shadow-md";
  const textPrimary = darkMode ? "text-white" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6E5A52]";

  return (
    <div className="w-full space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/png,image/jpeg,image/webp,image/avif,application/pdf"
        className="hidden"
      />

      {/* Role Selector Tabs & Vault Telemetry */}
      <div className={`flex justify-between items-center flex-wrap gap-4 p-4 rounded-3xl border backdrop-blur-md ${containerBg}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRoleTab('resident')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeRoleTab === 'resident'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : `${textMuted} hover:${textPrimary}`
            }`}
          >
            <UserCheck className="w-4 h-4" /> Resident KYC Vault
          </button>

          <button
            onClick={() => setActiveRoleTab('owner')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeRoleTab === 'owner'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : `${textMuted} hover:${textPrimary}`
            }`}
          >
            <Building className="w-4 h-4" /> Property Legal Documents
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadDocuments}
            disabled={isLoading}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold ${
              darkMode ? "border-white/10 hover:bg-white/10" : "border-[#E6D7CA] hover:bg-white/40"
            }`}
            title="Refresh documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <div className={`flex items-center gap-2 text-xs font-medium ${textMuted}`}>
            <Lock className="w-4 h-4 text-emerald-500" /> AES-256 Cloud Vault &amp; Magic-Byte Verified
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* Document Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docSlots.map((slot) => {
          const docList = Array.isArray(documents) ? documents : [];
          const uploadedDoc = docList.find((d) => d && d.documentType === slot.type);
          const isVerified = uploadedDoc?.status === 'VERIFIED';
          const isRejected = uploadedDoc?.status === 'REJECTED';
          const isBusy = uploadingType === slot.type || reuploadingDocId === uploadedDoc?.id;

          return (
            <motion.div
              key={slot.type}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${cardBg}`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  {uploadedDoc ? (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isRejected
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isVerified ? '✔ VERIFIED' : isRejected ? '✖ REJECTED' : '⏳ UNDER REVIEW'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-500/20 text-neutral-400 border-neutral-500/30">
                      NOT UPLOADED
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className={`text-sm font-bold ${textPrimary}`}>{slot.label}</h4>
                  <p className={`text-xs ${textMuted}`}>{slot.description}</p>
                  {uploadedDoc && (
                    <p className={`text-[10px] font-mono ${textMuted}`}>
                      v{uploadedDoc.version}.0 • {uploadedDoc.documentNumber || `DOC-${uploadedDoc.id.slice(-6).toUpperCase()}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between gap-2">
                {uploadedDoc ? (
                  <div className="flex gap-2 w-full justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(uploadedDoc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#F8EEE5] text-[#3B2A24] hover:bg-[#E6D7CA]"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUploadClick(slot.type, uploadedDoc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                        darkMode ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} /> Re-upload
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleUploadClick(slot.type)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} /> {isBusy ? 'Uploading...' : 'Upload Document'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[85vh] rounded-3xl border overflow-hidden flex flex-col ${
                darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-neutral-200 text-neutral-900"
              }`}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">{previewDoc.title || previewDoc.documentType}</h3>
                  <p className="text-xs text-neutral-400">Version v{previewDoc.version}.0 • {previewDoc.status}</p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-neutral-950/40">
                {previewDoc.fileUrl.endsWith('.pdf') ? (
                  <iframe src={previewDoc.fileUrl} className="w-full h-96 rounded-xl border border-white/10" title="PDF Preview" />
                ) : (
                  <img src={previewDoc.fileUrl} alt="KYC Document Preview" className="max-h-96 rounded-xl object-contain shadow-2xl" />
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-mono">Hash: {previewDoc.hash ? `${previewDoc.hash.slice(0, 16)}...` : 'AES-256'}</span>
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Open Full Image
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
