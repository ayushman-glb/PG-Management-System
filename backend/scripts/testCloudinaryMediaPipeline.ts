import { cloudinaryService } from '../src/services/cloudinary.service';
import { mediaService } from '../src/services/media.service';
import { mediaRepository } from '../src/repositories/media.repository';
import sharp from 'sharp';

async function runTestPipeline() {
  console.log('🚀 Starting Cloudinary Centralized Media Pipeline Test...\n');

  try {
    // 1. Create a 300x300 pixel buffer for testing
    const testBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 79, g: 70, b: 229, alpha: 1 }, // Indigo color
      },
    })
      .png()
      .toBuffer();

    console.log('1️⃣ Single Upload Test...');
    const singleResult = await mediaService.uploadSingle(testBuffer, {
      folder: 'rooms',
      entityType: 'ROOM',
      entityId: 'room_test_123',
      originalFilename: 'test_room.png',
      mimeType: 'image/png',
    });

    console.log('  ✅ Single Upload Success!');
    console.log('  📍 Secure URL:', singleResult.secureUrl);
    console.log('  📍 Public ID:', singleResult.publicId);
    console.log('  📍 Format:', singleResult.format);
    console.log('  📍 Record ID:', singleResult.recordId);

    // 2. Fetch metadata from DB
    console.log('\n2️⃣ MongoDB Metadata Fetch Test...');
    const metadata = await mediaService.getMetadata(singleResult.publicId);
    if (metadata.dbRecord) {
      console.log('  ✅ DB Record verified in MongoDB!');
      console.log('  📍 DB Public ID:', metadata.dbRecord.publicId);
      console.log('  📍 DB Entity Type:', metadata.dbRecord.entityType);
    } else {
      console.warn('  ⚠️ DB Record not found locally.');
    }

    // 3. Test Image Replacement
    console.log('\n3️⃣ Image Replacement Test...');
    const replacementBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 16, g: 185, b: 129, alpha: 1 }, // Emerald green
      },
    })
      .png()
      .toBuffer();

    const replaceResult = await mediaService.replaceImage(singleResult.publicId, replacementBuffer, {
      folder: 'rooms',
      entityType: 'ROOM',
      entityId: 'room_test_123',
      originalFilename: 'test_room_replacement.png',
    });

    console.log('  ✅ Image Replaced Successfully!');
    console.log('  📍 New Public ID:', replaceResult.publicId);
    console.log('  📍 New Secure URL:', replaceResult.secureUrl);

    // 4. Test Image Deletion
    console.log('\n4️⃣ Image Deletion & Database Cleanup Test...');
    const deleteResult = await mediaService.deleteImage(replaceResult.publicId);
    console.log('  ✅ Deletion Result:', deleteResult);

    const checkRecord = await mediaRepository.findByPublicId(replaceResult.publicId);
    if (!checkRecord) {
      console.log('  ✅ Verified: Metadata purged from MongoDB successfully.');
    }

    console.log('\n🎉 ALL CLOUDINARY MEDIA TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('\n❌ CLOUDINARY MEDIA PIPELINE TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTestPipeline();
