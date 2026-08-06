import {
  type User,
} from 'firebase/auth';
import {
  getFirebaseConfigStatus,
  getFirebaseClient,
  prepareFirebaseAuth,
} from '../../infrastructure/firebase/firebaseClient';

export type AuthProviderId =
  | 'anonymous'
  | 'password'
  | 'google.com'
  | 'unknown';

export interface AuthUserSnapshot {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: AuthProviderId;
}

export interface AuthSubscriptionState {
  user: AuthUserSnapshot | null;
  configured: boolean;
  missingConfigKeys: string[];
}

function snapshotUser(user: User): AuthUserSnapshot {
  const providerId = user.isAnonymous
    ? 'anonymous'
    : (user.providerData[0]?.providerId as AuthProviderId | undefined)
      ?? 'unknown';

  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    providerId,
  };
}

function requireAuthConfigured() {
  const status = getFirebaseConfigStatus();
  if (!status.configured) {
    throw new Error(
      `Firebase Auth is not configured: ${status.missingKeys.join(', ')}`,
    );
  }
}

export function subscribeToAuthState(
  callback: (state: AuthSubscriptionState) => void,
): () => void {
  let active = true;
  let unsubscribe: (() => void) | null = null;
  const status = getFirebaseConfigStatus();
  if (!status.configured) {
    callback({
      user: null,
      configured: false,
      missingConfigKeys: status.missingKeys,
    });
    return () => {};
  }

  void getFirebaseClient().then(async (firebase) => {
    if (!active) return;
    if (!firebase) {
      callback({
        user: null,
        configured: false,
        missingConfigKeys: status.missingKeys,
      });
      return;
    }
    const { onAuthStateChanged } = await import('firebase/auth');
    if (!active) return;
    unsubscribe = onAuthStateChanged(firebase.auth, (user) => {
      callback({
        user: user ? snapshotUser(user) : null,
        configured: true,
        missingConfigKeys: [],
      });
    });
  });

  return () => {
    active = false;
    unsubscribe?.();
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is unavailable.');
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  await signInWithEmailAndPassword(auth, email, password);
}

export async function createAccountWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is unavailable.');
  const {
    createUserWithEmailAndPassword,
    updateProfile,
  } = await import('firebase/auth');
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const safeName = displayName.trim();
  if (safeName) {
    await updateProfile(credential.user, { displayName: safeName });
  }
}

export async function signInWithGoogle(): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is unavailable.');
  const {
    GoogleAuthProvider,
    signInWithPopup,
  } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function continueAsGuest(): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is unavailable.');
  const { signInAnonymously } = await import('firebase/auth');
  await signInAnonymously(auth);
}

export async function signOutCurrentUser(): Promise<void> {
  const firebase = await getFirebaseClient();
  if (!firebase) return;
  const { signOut } = await import('firebase/auth');
  await signOut(firebase.auth);
}

export async function getCurrentAuthToken(): Promise<string | null> {
  const user = (await getFirebaseClient())?.auth.currentUser;
  return user ? user.getIdToken() : null;
}
