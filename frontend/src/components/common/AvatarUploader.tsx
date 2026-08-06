import React, { useState, useRef } from 'react';
import { mediaService, CloudinaryAssetResponse } from '../../services/media.service';
import { CloudinaryImage } from './CloudinaryImage';
import { Camera, User, RefreshCw, Trash2 } from 'lucide-react';

export interface AvatarUploaderProps {
  label?: string;
  folder?: string;
  value?: string;
  onChange?: (asset: CloudinaryAssetResponse | null) => void;
  size?: number;
  className?: string;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  label = 'Profile Photo',
  folder = 'avatars',
  value,
  onChange,
  size = 120,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(value);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const asset = await mediaService.uploadSingle(file, folder);
      setAvatarUrl(asset.secureUrl);
      setIsUploading(false);
      if (onChange) onChange(asset);
    } catch (err) {
      setIsUploading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {label && <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{label}</label>}

      <div
        className="relative group rounded-full overflow-hidden border-4 border-amber-500/40 shadow-xl cursor-pointer bg-slate-800 flex items-center justify-center"
        style={{ width: `${size}px`, height: `${size}px` }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {avatarUrl ? (
          <CloudinaryImage
            src={avatarUrl}
            alt="Avatar"
            width={size}
            height={size}
            crop="fill"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-12 h-12 text-slate-400" />
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-amber-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <Camera className="w-6 h-6" />
        </div>
      </div>

      {avatarUrl && (
        <button
          type="button"
          onClick={() => {
            setAvatarUrl(undefined);
            if (onChange) onChange(null);
          }}
          className="text-xs text-rose-500 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Remove Photo
        </button>
      )}
    </div>
  );
};
