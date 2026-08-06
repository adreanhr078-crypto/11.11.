import { create } from 'zustand';
import {
  continueAsGuest,
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutCurrentUser,
  subscribeToAuthState,
  type AuthUserSnapshot,
} from './authService';

export type AuthRuntimeStatus =
  | 'checking'
  | 'signed-out'
  | 'signed-in'
  | 'unavailable';

interface AuthActions {
  initialize: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export interface AuthStoreState {
  status: AuthRuntimeStatus;
  user: AuthUserSnapshot | null;
  configured: boolean;
  missingConfigKeys: string[];
  busy: boolean;
  error: string | null;
  actions: AuthActions;
}

let unsubscribeAuth: (() => void) | null = null;

function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'تعذر تنفيذ العملية. حاول مرة أخرى.';
  }

  if (error.message.includes('Firebase Auth is not configured')) {
    return 'إعدادات Firebase غير مكتملة. أضف مفاتيح VITE_FIREBASE داخل ملف البيئة.';
  }

  return error.message
    .replace('Firebase: ', '')
    .replace(/\s*\(auth\/.*\)\.?$/, '.');
}

async function runAuthAction(
  set: (state: Partial<AuthStoreState>) => void,
  action: () => Promise<void>,
): Promise<void> {
  try {
    set({ busy: true, error: null });
    await action();
  } catch (error) {
    set({ error: friendlyError(error) });
    throw error;
  } finally {
    set({ busy: false });
  }
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'checking',
  user: null,
  configured: false,
  missingConfigKeys: [],
  busy: false,
  error: null,
  actions: {
    initialize: () => {
      if (unsubscribeAuth) return;
      unsubscribeAuth = subscribeToAuthState((state) => {
        set({
          user: state.user,
          configured: state.configured,
          missingConfigKeys: state.missingConfigKeys,
          status: state.configured
            ? state.user ? 'signed-in' : 'signed-out'
            : 'unavailable',
          error: null,
        });
      });
    },
    signInWithEmail: (email, password) => runAuthAction(
      set,
      () => signInWithEmail(email, password),
    ),
    createAccountWithEmail: (email, password, displayName) => runAuthAction(
      set,
      () => createAccountWithEmail(email, password, displayName),
    ),
    signInWithGoogle: () => runAuthAction(set, signInWithGoogle),
    continueAsGuest: () => runAuthAction(set, continueAsGuest),
    signOut: () => runAuthAction(set, signOutCurrentUser),
    clearError: () => set({ error: null }),
  },
}));
