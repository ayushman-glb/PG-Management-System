import React, { useState } from 'react';

export interface CloudinaryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'limit';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  fallbackSrc?: string;
  className?: string;
}

/**
 * Responsive, lazy-loaded image component with Cloudinary transformation helpers
 */
export const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  crop = 'limit',
  quality = 'auto',
  format = 'auto',
  fallbackSrc = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600',
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getTransformedUrl = (originalUrl: string): string => {
    if (!originalUrl) return fallbackSrc;
    if (originalUrl.startsWith('data:') || originalUrl.includes('unsplash.com')) {
      return originalUrl;
    }

    // Insert Cloudinary dynamic transformation parameters into URL if valid Cloudinary URL structure
    if (originalUrl.includes('res.cloudinary.com')) {
      const parts = originalUrl.split('/upload/');
      if (parts.length === 2) {
        const transforms: string[] = [`q_${quality}`, `f_${format}`];
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        if (crop) transforms.push(`c_${crop}`);
        return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
      }
    }
    return originalUrl;
  };

  const finalSrc = hasError ? fallbackSrc : getTransformedUrl(src);

  return (
    <div className={`relative overflow-hidden inline-block ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      )}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
    </div>
  );
};
