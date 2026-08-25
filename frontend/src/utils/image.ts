/**
 * Image optimization utilities for RoomBae frontend.
 * Automatically transforms Cloudinary URLs with dynamic sizing, WebP/AVIF format auto-detection,
 * and high quality compression (f_auto, q_auto).
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'thumb' | 'crop';
  gravity?: 'auto' | 'face' | 'center';
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
}

/**
 * Transforms a raw image URL (especially Cloudinary) into an optimized URL.
 * - Forces HTTPS for mixed-content prevention
 * - Injects Cloudinary transformations (f_auto, q_auto, w_..., c_limit)
 * - Safely passes through non-Cloudinary URLs or Unsplash URLs with query params
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format';
  }

  // Enforce HTTPS
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://res.cloudinary.com')) {
    cleanUrl = cleanUrl.replace('http://', 'https://');
  }

  // Handle Cloudinary URLs
  if (cleanUrl.includes('res.cloudinary.com') && cleanUrl.includes('/upload/')) {
    const {
      width,
      height,
      quality = 'auto',
      crop = 'limit',
      gravity,
      format = 'auto',
    } = options;

    const transforms: string[] = [`f_${format}`, `q_${quality}`];

    if (crop) transforms.push(`c_${crop}`);
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (gravity) transforms.push(`g_${gravity}`);

    const transformString = transforms.join(',');

    // Check if URL already has transformations
    const uploadIndex = cleanUrl.indexOf('/upload/');
    const beforeUpload = cleanUrl.slice(0, uploadIndex + 8);
    const afterUpload = cleanUrl.slice(uploadIndex + 8);

    // If already has transformation string (e.g. v12345 or c_fill,w_300/v12345)
    if (!afterUpload.startsWith('f_') && !afterUpload.startsWith('q_')) {
      return `${beforeUpload}${transformString}/${afterUpload}`;
    }
  }

  // Handle Unsplash image parameters
  if (cleanUrl.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(cleanUrl);
      if (options.width) parsed.searchParams.set('w', String(options.width));
      if (options.height) parsed.searchParams.set('h', String(options.height));
      parsed.searchParams.set('auto', 'format');
      return parsed.toString();
    } catch {
      return cleanUrl;
    }
  }

  return cleanUrl;
}
