import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env';

let firebaseApp: App;

try {
  const currentApps = getApps();
  if (currentApps.length === 0) {
    if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      firebaseApp = initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });
    }
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    firebaseApp = currentApps[0]!;
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK initialization warning:', error);
}

export const firebaseAdmin = {
  auth: () => getAuth(),
  app: firebaseApp!,
};
