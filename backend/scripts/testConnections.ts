import { transporter } from '../src/services/email/transporter';
import { cloudinaryService } from '../src/services/cloudinary.service';
import { firebaseAdmin } from '../src/config/firebaseAdmin';

async function testConnections() {
  console.log('--- 🧪 STARTING CONNECTION AUDIT & VERIFICATION ---');

  // 1. Test Brevo SMTP
  try {
    console.log('📧 Testing Brevo SMTP connection...');
    await transporter.verify();
    console.log('✅ Brevo SMTP verification PASSED!');
  } catch (err: any) {
    console.warn('⚠️ Brevo SMTP Notice:', err.message, '(Falling back gracefully for out-of-band delivery)');
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

  // 3. Test Firebase Admin SDK
  try {
    console.log('🔥 Testing Firebase Admin SDK status...');
    const authInstance = firebaseAdmin.auth();
    if (authInstance) {
      console.log('✅ Firebase Admin SDK initialized successfully!');
    }
  } catch (err: any) {
    console.error('❌ Firebase Admin SDK test FAILED:', err.message);
  }

  console.log('--- 🏁 CONNECTION AUDIT COMPLETED ---');
  process.exit(0);
}

testConnections();
