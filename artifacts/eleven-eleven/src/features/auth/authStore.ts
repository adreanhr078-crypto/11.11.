import { create } from 'zustand';
import {
  continueAsGuest,
  createAccountWithEmail,
  linkAnonymousAccountWithEmail,
  linkAnonymousAccountWithGoogle,
  resetPassword,
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
  retryInitialize: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  linkAnonymousAccountWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  linkAnonymousAccountWithGoogle: () => Promise<void>;
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

  const authCode = (error as { code?: unknown }).code;
  if (typeof authCode === 'string') {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'هذا البريد مرتبط بحساب موجود بالفعل.',
      'auth/credential-already-in-use': 'هذه البيانات مرتبطة بحساب آخر. بقي ملف الضيف كما هو.',
      'auth/provider-already-linked': 'طريقة الدخول هذه مرتبطة بالفعل بهذا الحساب.',
      'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
      'auth/network-request-failed': 'تعذر الاتصال بالشبكة. تحقق من اتصالك وحاول مجدداً.',
      'auth/operation-not-allowed': 'طريقة تسجيل الدخول هذه غير مفعلة في Firebase.',
      'auth/popup-blocked': 'منع المتصفح نافذة Google. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.',
      'auth/popup-closed-by-user': 'أُغلقت نافذة Google قبل اكتمال تسجيل الدخول.',
      'auth/unauthorized-domain': 'هذا العنوان غير مسموح لتسجيل Google بعد. استخدم العنوان المعتمد أو أضفه في Firebase.',
      'auth/account-exists-with-different-credential': 'هذا البريد مرتبط بحساب قائم بطريقة دخول أخرى. بقي حساب الضيف كما هو.',
      'auth/too-many-requests': 'محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مجدداً.',
      'auth/weak-password': 'استخدم كلمة مرور أقوى تتكون من 6 أحرف على الأقل.',
    };
    if (messages[authCode]) return messages[authCode];
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
          status: state.error
            ? 'unavailable'
            : state.configured
            ? state.user ? 'signed-in' : 'signed-out'
            : 'unavailable',
          error: state.error ? friendlyError(state.error) : null,
        });
      });
    },
    retryInitialize: () => {
      unsubscribeAuth?.();
      unsubscribeAuth = null;
      set({ status: 'checking', user: null, error: null });
      useAuthStore.getState().actions.initialize();
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
    resetPassword: (email) => runAuthAction(
      set,
      () => resetPassword(email),
    ),
    continueAsGuest: () => runAuthAction(set, continueAsGuest),
    linkAnonymousAccountWithEmail: (email, password, displayName) => runAuthAction(
      set,
      () => linkAnonymousAccountWithEmail(email, password, displayName),
    ),
    linkAnonymousAccountWithGoogle: () => runAuthAction(
      set,
      linkAnonymousAccountWithGoogle,
    ),
    signOut: () => runAuthAction(set, signOutCurrentUser),
    clearError: () => set({ error: null }),
  },
}));
