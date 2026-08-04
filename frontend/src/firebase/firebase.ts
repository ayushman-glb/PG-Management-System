import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDtYjAroEZvJwdMn7lU70cPn7Knp_ji-FY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "roombae-cff13.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "roombae-cff13",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "roombae-cff13.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "355023139206",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:355023139206:web:97d27de50e591352dbfc07",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D55WEXEQRG",
};

// Initialize Firebase singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
