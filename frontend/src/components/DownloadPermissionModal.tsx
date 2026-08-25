import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ShieldCheck, HardDrive, X, FileText, Ban } from 'lucide-react';
import { useTheme } from '@theme/index';

export interface DownloadPermissionModalProps {
  isOpen: boolean;
  fileName: string;
  documentTitle: string;
  documentType?: string;
  onConfirm: () => void;
  onDeny: () => void;
  isDownloading?: boolean;
}

export const DownloadPermissionModal: React.FC<DownloadPermissionModalProps> = ({
  isOpen,
  fileName,
  documentTitle,
  documentType = 'PDF Document',
  onConfirm,
  onDeny,
  isDownloading = false,
}) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        data-lenis-prevent
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className={`w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${
            darkMode
              ? 'bg-neutral-900 border-white/10 text-white'
              : 'bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]'
          }`}
          data-lenis-prevent
        >
          {/* Header */}
          <div
            className={`p-5 flex items-center justify-between border-b ${
              darkMode
                ? 'bg-gradient-to-r from-amber-500/15 via-neutral-900 to-neutral-900 border-white/10'
                : 'bg-gradient-to-r from-[#F8EEE5] via-[#FFFDFB] to-[#FFFDFB] border-[#E6D7CA]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl ${
                  darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-[#D9A87C]/30 text-[#C58B63]'
                }`}
              >
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Storage &amp; Download Permission</h3>
                <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-[#6E5A52]'}`}>
                  RoomBae Secure Document Delivery
                </p>
              </div>
            </div>
            <button
              onClick={onDeny}
              disabled={isDownloading}
              className={`p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-40 ${
                darkMode ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-[#E6D7CA]/50 text-[#6E5A52]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                darkMode ? 'bg-neutral-950/70 border-white/10' : 'bg-[#F8EEE5]/70 border-[#E6D7CA]'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-[#C58B63]'}`} />
                <div className="space-y-1 overflow-hidden">
                  <p className="text-xs font-bold truncate">{documentTitle}</p>
                  <p className={`text-[11px] font-mono truncate ${darkMode ? 'text-neutral-400' : 'text-[#6E5A52]'}`}>
                    {fileName}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-white/10 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-neutral-400' : 'text-[#6E5A52]'}>File Format:</span>
                  <span className="font-semibold">{documentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-neutral-400' : 'text-[#6E5A52]'}>Target Storage:</span>
                  <span className="font-semibold">Device Default Downloads</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-emerald-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SHA-256 Cryptographically Stamped</span>
                </div>
              </div>
            </div>

            <p className={`text-xs text-center leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#54423A]'}`}>
              Do you allow RoomBae to save this official verified document directly to your device storage?
            </p>
          </div>

          {/* Footer Actions */}
          <div
            className={`p-4 border-t flex gap-3 ${
              darkMode ? 'bg-neutral-950/50 border-white/10' : 'bg-[#FDF9F5] border-[#E6D7CA]'
            }`}
          >
            <button
              type="button"
              onClick={onDeny}
              disabled={isDownloading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer disabled:opacity-50 ${
                darkMode
                  ? 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                  : 'bg-white border-[#E6D7CA] text-[#6E5A52] hover:bg-neutral-100 hover:text-[#3B2A24]'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-red-400" />
              Deny &amp; Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDownloading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                darkMode
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400'
                  : 'bg-[#C58B63] hover:bg-[#B37850] text-white border-[#C58B63]'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Saving...' : 'Allow & Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
