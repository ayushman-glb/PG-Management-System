import React from 'react';
import { MediaUploader, MediaUploaderProps } from './MediaUploader';

export interface GalleryUploaderProps extends Omit<MediaUploaderProps, 'multiple'> {
  maxPhotos?: number;
}

export const GalleryUploader: React.FC<GalleryUploaderProps> = ({
  maxPhotos = 10,
  folder = 'properties',
  label = 'Property Photo Gallery',
  ...props
}) => {
  return (
    <MediaUploader
      multiple={true}
      maxFiles={maxPhotos}
      folder={folder}
      label={label}
      accept="image/jpeg,image/png,image/webp,image/avif"
      {...props}
    />
  );
};
