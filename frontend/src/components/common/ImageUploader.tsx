import React from 'react';
import { MediaUploader, MediaUploaderProps } from './MediaUploader';

export interface ImageUploaderProps extends Omit<MediaUploaderProps, 'accept'> {
  allowedFormats?: string[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  ...props
}) => {
  return (
    <MediaUploader
      accept={allowedFormats.join(',')}
      {...props}
    />
  );
};
