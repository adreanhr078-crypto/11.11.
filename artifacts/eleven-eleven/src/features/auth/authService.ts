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
  error?: AuthSessionError | null;
}

export class AuthSessionError extends Error {
  constructor(
    readonly code:
      | 'auth_unavailable'
      | 'auth_initialization_failed'
      | 'auth_timeout'
      | 'no_authenticated_user'
      | 'uid_changed'
      | 'token_timeout'
      | 'token_failed',
    message: string,
  ) {
    super(message);
    this.name = 'AuthSessionError';
  }
}

const AUTH_OPERATION_TIMEOUT_MS = 12_000;

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  code: AuthSessionError['code'],
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AuthSessionError(code, message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  let initialAuthTimer: ReturnType<typeof setTimeout> | null = null;
  let initialAuthResolved = false;
  const status = getFirebaseConfigStatus();
  if (!status.configured) {
    callback({
      user: null,
      configured: false,
      missingConfigKeys: status.missingKeys,
    });
    return () => {};
  }

  void withTimeout(
    getFirebaseClient(),
    AUTH_OPERATION_TIMEOUT_MS,
    'auth_timeout',
    'Firebase Auth initialization timed out.',
  )
    .then(async (firebase) => {
      if (!active) return;
      if (!firebase) {
        callback({
          user: null,
          configured: false,
          missingConfigKeys: status.missingKeys,
          error: new AuthSessionError(
            'auth_unavailable',
            'Firebase Auth is unavailable.',
          ),
        });
        return;
      }
      const { onAuthStateChanged } = await import('firebase/auth');
      if (!active) return;
      initialAuthTimer = setTimeout(() => {
        if (!active || initialAuthResolved) return;
        initialAuthResolved = true;
        callback({
          user: null,
          configured: true,
          missingConfigKeys: [],
          error: new AuthSessionError(
            'auth_timeout',
            'Firebase Auth did not resolve the current session in time.',
          ),
        });
      }, AUTH_OPERATION_TIMEOUT_MS);
      unsubscribe = onAuthStateChanged(firebase.auth, (user) => {
        initialAuthResolved = true;
        if (initialAuthTimer) clearTimeout(initialAuthTimer);
        callback({
          user: user ? snapshotUser(user) : null,
          configured: true,
          missingConfigKeys: [],
          error: null,
        });
      });
    })
    .catch((error: unknown) => {
      if (!active) return;
      callback({
        user: null,
        configured: true,
        missingConfigKeys: [],
        error: error instanceof AuthSessionError
          ? error
          : new AuthSessionError(
            'auth_initialization_failed',
            'Firebase Auth initialization failed.',
          ),
      });
    });

  return () => {
    active = false;
    if (initialAuthTimer) clearTimeout(initialAuthTimer);
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

export async function resetPassword(email: string): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is unavailable.');
  const { sendPasswordResetEmail } = await import('firebase/auth');
  await sendPasswordResetEmail(auth, email);
}

export async function continueAsGuest(): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is unavailable.');
  const { signInAnonymously } = await import('firebase/auth');
  await signInAnonymously(auth);
}

export async function linkAnonymousAccountWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth?.currentUser?.isAnonymous) {
    throw new Error('Only a guest account can be linked.');
  }
  const {
    EmailAuthProvider,
    linkWithCredential,
    updateProfile,
  } = await import('firebase/auth');
  const credential = EmailAuthProvider.credential(email, password);
  await linkWithCredential(auth.currentUser, credential);
  const safeName = displayName.trim();
  if (safeName) {
    await updateProfile(auth.currentUser, { displayName: safeName });
  }
}

export async function linkAnonymousAccountWithGoogle(): Promise<void> {
  requireAuthConfigured();
  const auth = await prepareFirebaseAuth();
  if (!auth?.currentUser?.isAnonymous) {
    throw new Error('Only a guest account can be linked.');
  }
  const {
    GoogleAuthProvider,
    linkWithPopup,
  } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await linkWithPopup(auth.currentUser, provider);
}

export async function signOutCurrentUser(): Promise<void> {
  const firebase = await getFirebaseClient();
  if (!firebase) return;
  const { signOut } = await import('firebase/auth');
  await signOut(firebase.auth);
}

export async function getCurrentAuthSession(
  expectedUid?: string,
): Promise<{ uid: string; token: string }> {
  const firebase = await withTimeout(
    getFirebaseClient(),
    AUTH_OPERATION_TIMEOUT_MS,
    'auth_timeout',
    'Firebase Auth initialization timed out.',
  );
  if (!firebase) {
    throw new AuthSessionError(
      'auth_unavailable',
      'Firebase Auth is unavailable.',
    );
  }

  const user = firebase.auth.currentUser;
  if (!user) {
    throw new AuthSessionError(
      'no_authenticated_user',
      'No authenticated player is available.',
    );
  }
  if (expectedUid && user.uid !== expectedUid) {
    throw new AuthSessionError(
      'uid_changed',
      'The authenticated player changed during synchronization.',
    );
  }

  let token: string;
  try {
    token = await withTimeout(
      user.getIdToken(),
      AUTH_OPERATION_TIMEOUT_MS,
      'token_timeout',
      'Firebase token acquisition timed out.',
    );
  } catch (error) {
    if (error instanceof AuthSessionError) throw error;
    throw new AuthSessionError('token_failed', 'Firebase token acquisition failed.');
  }

  const currentUser = firebase.auth.currentUser;
  if (!currentUser || currentUser.uid !== user.uid) {
    throw new AuthSessionError(
      'uid_changed',
      'The authenticated player changed during token acquisition.',
    );
  }
  if (!token) {
    throw new AuthSessionError('token_failed', 'Firebase returned an empty token.');
  }
  return { uid: user.uid, token };
}

export async function getCurrentAuthToken(
  expectedUid?: string,
): Promise<string | null> {
  try {
    return (await getCurrentAuthSession(expectedUid)).token;
  } catch {
    return null;
  }
}
