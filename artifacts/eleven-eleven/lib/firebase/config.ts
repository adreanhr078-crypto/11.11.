/**
 * Firebase Configuration for 11.11 Echo Mind System
 * Production-ready Firebase setup with all required providers
 *
 * IMPORTANT: All values MUST be provided via Vite environment variables
 * prefixed with VITE_. Never hardcode secrets in source control.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.VITE_FIREBASE_APP_ID ?? "",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID ?? "",
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  console.warn(`Firebase config missing env vars: ${missing.join(", ")}. Client-side Firebase will not function correctly.`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Set up authentication providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: 'popup'
});

// Export all Firebase services
export {
  auth,
  db,
  googleProvider,
  facebookProvider,
  app
};

export default {
  auth,
  db,
  googleProvider,
  facebookProvider
};