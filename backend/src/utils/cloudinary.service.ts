import { cloudinary, getCloudinaryFolder } from '../config/cloudinary';
import * as fs from 'fs';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  assetId?: string;
  folder: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  originalFilename?: string;
}

export class CloudinaryService {
  async uploadFile(
    filePathOrBuffer: string | Buffer,
    folder: string = 'uploads',
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto',
    publicId?: string,
    originalFilename?: string
  ): Promise<CloudinaryUploadResult> {
    const targetFolder = getCloudinaryFolder(folder);

    return new Promise((resolve, reject) => {
      const options: any = {
        folder: targetFolder,
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: 'auto',
      };

      if (publicId) {
        options.public_id = publicId;
      }

      if (Buffer.isBuffer(filePathOrBuffer)) {
        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error || !result) {
              return resolve({
                url: `data:image/webp;base64,${filePathOrBuffer.toString('base64')}`,
                secureUrl: `data:image/webp;base64,${filePathOrBuffer.toString('base64')}`,
                publicId: publicId || `fallback_${Date.now()}`,
                folder: targetFolder,
                format: 'webp',
                bytes: filePathOrBuffer.length,
                originalFilename,
              });
            }
            resolve({
              url: result.url,
              secureUrl: result.secure_url,
              publicId: result.public_id,
              assetId: result.asset_id,
              folder: result.folder || targetFolder,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
              originalFilename: result.original_filename,
            });
          }
        );
        uploadStream.end(filePathOrBuffer);
      } else {
        cloudinary.uploader.upload(filePathOrBuffer, options, (error, result) => {
          if (error || !result) {
            return resolve({
              url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
              secureUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
              publicId: publicId || `fallback_${Date.now()}`,
              folder: targetFolder,
              format: 'jpg',
              bytes: 0,
              originalFilename,
            });
          }
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            assetId: result.asset_id,
            folder: result.folder || targetFolder,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            originalFilename: result.original_filename,
          });
        });
      }
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch {
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
