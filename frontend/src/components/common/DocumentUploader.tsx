import React, { useState, useRef } from 'react';
import { mediaService, CloudinaryAssetResponse } from '../../services/media.service';
import { FileText, CheckCircle2, AlertCircle, Trash2, RefreshCw } from 'lucide-react';

export interface DocumentUploaderProps {
  label?: string;
  folder?: string;
  value?: string;
  onChange?: (asset: CloudinaryAssetResponse | null) => void;
  className?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  label = 'Upload Document (PDF)',
  folder = 'documents',
  value,
  onChange,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(value);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF documents are supported.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const asset = await mediaService.uploadSingle(file, folder, (p) => setProgress(p));
      setCurrentUrl(asset.secureUrl);
      setIsUploading(false);
      if (onChange) onChange(asset);
    } catch (err: any) {
      setError(err.message || 'Document upload failed.');
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setCurrentUrl(undefined);
    setProgress(0);
    setError(null);
    if (onChange) onChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{label}</label>}

      {!currentUrl && !isUploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-5 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Click to select PDF Document
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">PDF max size 10MB</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-amber-500">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Uploading PDF...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {currentUrl && !isUploading && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-emerald-400">PDF Uploaded & Verified</p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-white underline truncate block max-w-xs"
              >
                View Document
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors"
            title="Remove document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
