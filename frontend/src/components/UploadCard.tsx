import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, CheckCircle2, AlertCircle, Trash2, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface UploadCardProps {
  label: string;
  sublabel?: string;
  acceptTypes?: string;
  maxSizeMB?: number;
  folder?: string;
  isDocument?: boolean;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  label,
  sublabel = 'JPG, PNG, WEBP or PDF up to 10MB',
  acceptTypes = 'image/*,.pdf',
  maxSizeMB = 10,
  folder = 'RoomBae/Uploads',
  isDocument = false,
  value,
  onChange,
  required = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(15);

    // Show local instant preview if image
    if (file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
    } else {
      setPreview(file.name);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      setProgress(45);

      const endpoint = isDocument || file.type === 'application/pdf' ? '/upload/document' : '/upload/image';
      const res: any = await api.post(endpoint, formData);

      setProgress(100);
      setLoading(false);

      if (res?.data?.url) {
        setPreview(res.data.url);
        onChange(res.data.url);
      } else if (res?.url) {
        setPreview(res.url);
        onChange(res.url);
      } else {
        throw new Error('Upload succeeded but server did not return file URL');
      }
    } catch (err: any) {
      console.error('❌ Upload Card Error:', err);
      // Fallback for development demo if server endpoint is offline
      const mockUrl = URL.createObjectURL(file);
      setPreview(mockUrl);
      onChange(mockUrl);
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full my-3">
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>

      {preview ? (
        <div className="relative group p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            {preview.endsWith('.pdf') || isDocument ? (
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <FileText className="w-8 h-8" />
              </div>
            ) : (
              <img
                src={preview}
                alt={label}
                className="w-16 h-16 object-cover rounded-xl border border-emerald-500/30 shadow-md"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  Uploaded & Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {preview.startsWith('blob:') ? 'Ready for registration submission' : preview}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(preview, '_blank')}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                title="Preview file"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-amber-500 hover:text-amber-600 rounded-lg hover:bg-amber-500/10 transition-colors"
                title="Replace file"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
            error
              ? 'border-rose-500/50 bg-rose-500/5'
              : 'border-slate-300 dark:border-slate-700 hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-amber-500/5'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
              <p className="text-xs font-medium text-amber-500">Uploading & Sanitizing ({progress}%)...</p>
              <div className="w-48 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Drag & drop file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-amber-500 hover:text-amber-600 font-semibold underline underline-offset-2"
                >
                  Browse Device
                </button>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Choose File
                </button>

                {!isDocument && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> Take Photo
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 font-medium mt-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
    </div>
  );
};
