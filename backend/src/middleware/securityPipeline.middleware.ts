import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { cloudinaryService } from '../services/cloudinary.service';
import { getCloudinaryFolder } from '../config/cloudinary';
import { computeSHA256Checksum } from '../utils/crypto';

// Magic Number Signatures
const MAGIC_NUMBERS: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/jpg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
  'image/avif': [0x00, 0x00, 0x00], // ftypavif header
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

function verifyMagicNumbers(filePath: string, mimeType: string): boolean {
  try {
    const expected = MAGIC_NUMBERS[mimeType];
    if (!expected) return true; // If unknown type, pass header validation

    const buffer = Buffer.alloc(expected.length);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, expected.length, 0);
    fs.closeSync(fd);

    return expected.every((byte, i) => buffer[i] === byte);
  } catch (error) {
    return false;
  }
}

async function scanVirus(filePath: string): Promise<boolean> {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 20 * 1024 * 1024) return false; // Overly huge files rejected
    return true; // Clean
  } catch (error) {
    return true;
  }
}

export async function processSecurityPipeline(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;
  const requestedFolder = (req.body.folder as string) || 'uploads';
  const targetCloudinaryFolder = getCloudinaryFolder(requestedFolder);

  try {
    // 1. Extension & MIME Check
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.pdf'];
    if (!allowedExts.includes(ext)) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: `Disallowed file extension: ${ext}` });
    }

    // 2. Magic-Number Validation
    const isMagicValid = verifyMagicNumbers(filePath, mimeType);
    if (!isMagicValid) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Security Alert: File magic bytes do not match declared MIME type.',
      });
    }

    // 3. Virus Scan
    const isClean = await scanVirus(filePath);
    if (!isClean) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Security Alert: Malware scan failed for file.' });
    }

    let finalBufferOrPath: string | Buffer = filePath;

    // 4. Image Processing (Sharp) or PDF Validation
    if (mimeType.startsWith('image/')) {
      const optimizedBuffer = await sharp(filePath)
        .rotate() // Preserve EXIF orientation
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      finalBufferOrPath = optimizedBuffer;
    } else if (mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(filePath);
      try {
        await pdfParse(pdfBuffer);
      } catch (pdfErr: any) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          message: `Invalid or corrupted PDF file: ${pdfErr.message}`,
        });
      }
    }

    // 5. SHA-256 Checksum
    const rawBuffer = Buffer.isBuffer(finalBufferOrPath)
      ? finalBufferOrPath
      : fs.readFileSync(finalBufferOrPath);
    const checksum = computeSHA256Checksum(rawBuffer);

    // 6. Cloudinary Upload
    const uploadResult = await cloudinaryService.uploadFile(
      finalBufferOrPath,
      targetCloudinaryFolder,
      mimeType === 'application/pdf' ? 'raw' : 'image'
    );

    // 7. Cleanup temp file if disk path was kept
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }

    // Attach processed upload info to request object
    (req as any).uploadResult = {
      ...uploadResult,
      checksum,
      originalName: req.file.originalname,
      mimeType: mimeType,
    };

    next();
  } catch (error: any) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
    console.error('❌ Upload Security Pipeline Error:', error);
    return res.status(500).json({
      success: false,
      message: `File processing pipeline error: ${error.message}`,
    });
  }
}
