import { transporter } from '../src/services/email/transporter';
import { cloudinaryService } from '../src/services/cloudinary.service';

async function testConnections() {
  console.log('--- 🧪 STARTING CONNECTION AUDIT & VERIFICATION ---');

  // 1. Test Email Transporter
  try {
    console.log('📧 Testing Transactional Email Dispatcher...');
    await transporter.verify();
    console.log('✅ Transactional Email Dispatcher PASSED!');
  } catch (err: any) {
    console.warn('⚠️ Email Dispatcher Notice:', err.message);
  }

  // 2. Test Cloudinary Buffer Upload
  try {
    console.log('☁️ Testing Cloudinary buffer upload...');
    // 1x1 PNG transparent pixel buffer
    const pixelBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    const res = await cloudinaryService.uploadFile(pixelBuffer, 'RoomBae/Test', 'image');
    console.log('✅ Cloudinary Upload PASSED! Secure URL:', res.secureUrl);
  } catch (err: any) {
    console.error('❌ Cloudinary Upload FAILED:', err.message);
  }

  console.log('--- 🏁 CONNECTION AUDIT COMPLETED ---');
  process.exit(0);
}

testConnections();
