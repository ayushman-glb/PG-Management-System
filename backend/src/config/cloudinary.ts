import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (!isConfigured) {
  if (env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: Cloudinary credentials missing in production environment!');
  } else {
    console.warn('⚠️ Cloudinary credentials missing or incomplete. Operating with local fallback/mock storage mode.');
  }
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const getCloudinaryFolder = (subfolder: string): string => {
  const prefix = env.CLOUDINARY_FOLDER_PREFIX || `RoomBae-${env.NODE_ENV}`;
  const cleanSubfolder = subfolder.replace(/^\/+|\/+$/g, '');
  return cleanSubfolder ? `${prefix}/${cleanSubfolder}` : prefix;
};

console.log(`✅ Cloudinary SDK initialized [Cloud: ${env.CLOUDINARY_CLOUD_NAME || 'N/A'}, Environment Prefix: ${env.CLOUDINARY_FOLDER_PREFIX || `RoomBae-${env.NODE_ENV}`}]`);

export { cloudinary };

