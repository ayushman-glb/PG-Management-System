import React, { useState, useRef, DragEvent } from 'react';
import { mediaService, CloudinaryAssetResponse } from '../../services/media.service';
import { CloudinaryImage } from './CloudinaryImage';

export interface MediaUploaderProps {
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  initialValues?: (string | CloudinaryAssetResponse)[];
  onChange?: (assets: CloudinaryAssetResponse[]) => void;
  label?: string;
  accept?: string;
  className?: string;
}

interface UploadItem {
  id: string;
  file?: File;
  asset?: CloudinaryAssetResponse;
  previewUrl: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  folder = 'documents',
  multiple = false,
  maxFiles = 10,
  initialValues = [],
  onChange,
  label = 'Upload Image / Document',
  accept = 'image/jpeg,image/png,image/webp,image/avif,application/pdf',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Normalize initial items
  const [items, setItems] = useState<UploadItem[]>(() => {
    return initialValues.map((val, idx) => {
      if (typeof val === 'string') {
        return {
          id: `init_${idx}_${Date.now()}`,
          previewUrl: val,
          progress: 100,
          status: 'success',
          asset: {
            url: val,
            secureUrl: val,
            publicId: `init_${idx}`,
            folder,
            format: 'jpg',
            bytes: 0,
          },
        };
      }
      return {
        id: val.publicId || `init_${idx}`,
        previewUrl: val.secureUrl || val.url,
        progress: 100,
        status: 'success',
        asset: val,
      };
    });
  });

  const notifyChange = (updatedItems: UploadItem[]) => {
    if (onChange) {
      const successfulAssets = updatedItems
        .filter((it) => it.status === 'success' && it.asset)
        .map((it) => it.asset!);
      onChange(successfulAssets);
    }
  };

  const uploadFileItem = async (item: UploadItem) => {
    if (!item.file) return;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 0, errorMessage: undefined } : i))
    );

    try {
      const uploadedAsset = await mediaService.uploadSingle(
        item.file,
        folder,
        (percent) => {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
          );
        }
      );

      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'success' as const, progress: 100, asset: uploadedAsset, previewUrl: uploadedAsset.secureUrl }
            : i
        );
        notifyChange(next);
        return next;
      });
    } catch (error: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'error' as const, errorMessage: error.message || 'Upload failed' }
            : i
        )
      );
    }
  };

  const handleFilesSelected = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    if (fileArray.length === 0) return;

    const availableSlots = multiple ? maxFiles - items.length : 1;
    const filesToProcess = fileArray.slice(0, availableSlots);

    const newItems: UploadItem[] = filesToProcess.map((file) => ({
      id: `item_${Date.now()}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'idle',
    }));

    let updatedItems: UploadItem[];
    if (multiple) {
      updatedItems = [...items, ...newItems];
    } else {
      updatedItems = newItems;
    }

    setItems(updatedItems);
    newItems.forEach((item) => uploadFileItem(item));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemove = async (id: string) => {
    const targetItem = items.find((i) => i.id === id);
    if (targetItem?.asset?.publicId) {
      try {
        await mediaService.deleteImage(targetItem.asset.publicId);
      } catch (e) {
        console.warn('⚠️ Could not delete asset from Cloudinary:', e);
      }
    }

    const next = items.filter((i) => i.id !== id);
    setItems(next);
    notifyChange(next);
  };

  const handleReplace = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const targetItem = items.find((i) => i.id === id);
      if (!targetItem) return;

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'uploading', progress: 0, previewUrl: URL.createObjectURL(file) } : i))
      );

      try {
        let uploadedAsset: CloudinaryAssetResponse;
        if (targetItem.asset?.publicId) {
          uploadedAsset = await mediaService.replaceImage(targetItem.asset.publicId, file, folder, (p) => {
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: p } : i)));
          });
        } else {
          uploadedAsset = await mediaService.uploadSingle(file, folder, (p) => {
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: p } : i)));
          });
        }

        setItems((prev) => {
          const next = prev.map((i) =>
            i.id === id
              ? { ...i, status: 'success' as const, progress: 100, asset: uploadedAsset, previewUrl: uploadedAsset.secureUrl }
              : i
          );
          notifyChange(next);
          return next;
        });
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: 'error' as const, errorMessage: err.message } : i))
        );
      }
    };
    input.click();
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setItems(copy);
    notifyChange(copy);

    const publicIds = copy.filter((i) => i.asset?.publicId).map((i) => i.asset!.publicId);
    if (publicIds.length > 1) {
      mediaService.reorderImages(publicIds).catch(() => {});
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>}

      {/* Drag and Drop Zone */}
      {(!multiple && items.length === 0) || (multiple && items.length < maxFiles) ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 bg-white dark:bg-gray-800'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
              ☁️
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Drag & drop images here, or <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">browse</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supports JPG, PNG, WEBP, AVIF, PDF up to 10MB
            </p>
          </div>
        </div>
      ) : null}

      {/* Image Preview Grid & Progress Bars */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm"
            >
              {/* Preview Content */}
              {item.previewUrl.endsWith('.pdf') || item.asset?.format === 'pdf' ? (
                <div className="h-32 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-600">
                  <span className="text-2xl font-bold">PDF</span>
                  <span className="text-xs truncate max-w-[90%]">{item.asset?.originalFilename || 'Document'}</span>
                </div>
              ) : (
                <CloudinaryImage
                  src={item.previewUrl}
                  alt="Upload preview"
                  width={300}
                  height={300}
                  crop="fill"
                  className="w-full h-32 object-cover"
                />
              )}

              {/* Uploading overlay & progress bar */}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-3 text-white">
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold mt-2">{item.progress}%</span>
                </div>
              )}

              {/* Error overlay */}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-2 text-white text-center">
                  <span className="text-xs font-semibold mb-1">Failed</span>
                  <button
                    onClick={() => uploadFileItem(item)}
                    className="px-2 py-1 bg-white text-red-700 text-xs font-bold rounded shadow hover:bg-gray-100"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Action buttons on hover */}
              {item.status === 'success' && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-2">
                  {multiple && (
                    <>
                      <button
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 bg-white/80 dark:bg-gray-800/80 rounded text-xs disabled:opacity-30"
                        title="Move left"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === items.length - 1}
                        className="p-1 bg-white/80 dark:bg-gray-800/80 rounded text-xs disabled:opacity-30"
                        title="Move right"
                      >
                        ▶
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleReplace(item.id)}
                    className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
