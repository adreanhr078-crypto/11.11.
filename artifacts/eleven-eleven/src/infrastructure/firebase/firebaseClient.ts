import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

export interface FirebaseConfigStatus {
  configured: boolean;
  missingKeys: string[];
}

const REQUIRED_FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const envKeyToConfigKey = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_APP_ID: 'appId',
} as const;

let client: FirebaseClient | null = null;
let clientPromise: Promise<FirebaseClient | null> | null = null;
let persistenceReady = false;

function getEnv(): Partial<ImportMetaEnv> {
  return (import.meta as ImportMeta & { env?: ImportMetaEnv }).env ?? {};
}

export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const env = getEnv();
  const missingKeys = REQUIRED_FIREBASE_ENV.filter((key) => (
    !env[key]?.trim()
  ));
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

async function createFirebaseClient(): Promise<FirebaseClient | null> {
  if (client) return client;

  const status = getFirebaseConfigStatus();
  if (!status.configured) return null;

  const [
    { initializeApp },
    { getAuth },
    { getFirestore },
  ] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);

  const env = getEnv();
  const config = Object.fromEntries(
    REQUIRED_FIREBASE_ENV.map((envKey) => [
      envKeyToConfigKey[envKey],
      env[envKey],
    ]),
  );

  const app = initializeApp({
    ...config,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);

  client = { app, auth, db };
  return client;
}

export function getFirebaseClient(): Promise<FirebaseClient | null> {
  // Do not permanently cache a transient SDK/import failure.  The auth panel
  // exposes a retry action, so a failed first boot must be recoverable without
  // a full page reload.
  clientPromise ??= createFirebaseClient().catch((error: unknown) => {
    clientPromise = null;
    throw error;
  });
  return clientPromise;
}

export async function prepareFirebaseAuth(): Promise<Auth | null> {
  const firebase = await getFirebaseClient();
  if (!firebase) return null;

  if (!persistenceReady) {
    const { browserLocalPersistence, setPersistence } = await import(
      'firebase/auth'
    );
    try {
      await setPersistence(firebase.auth, browserLocalPersistence);
    } catch {
      // Private browsing and embedded mobile webviews can reject durable
      // storage. Firebase's default in-memory persistence is still safe for
      // the current tab and keeps sign-in usable instead of leaving the panel
      // stuck in an initialization error.
    }
    persistenceReady = true;
  }

  return firebase.auth;
}
