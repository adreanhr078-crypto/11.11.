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
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import type { NetworkLocale } from '../../domain/echo-network/contracts';

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

const AUTH_ERROR_COPY = {
  ar: {
    generic: 'تعذر تنفيذ العملية. حاول مرة أخرى.',
    configuration: 'إعدادات تسجيل الدخول غير مكتملة في هذه النسخة. استخدم نسخة معتمدة أو تواصل مع فريق 11.11.',
    timeout: 'تأخر رد Firebase. تحقق من الاتصال ثم أعد المحاولة.',
    initialization: 'تعذر تشغيل نظام الدخول. أعد المحاولة بعد لحظات.',
    unavailable: 'خدمة الدخول غير متاحة حالياً. تحقق من إعدادات Firebase.',
    emailInUse: 'هذا البريد مرتبط بحساب موجود بالفعل.',
    credentialInUse: 'هذه البيانات مرتبطة بحساب آخر. بقي ملف الضيف كما هو.',
    providerLinked: 'طريقة الدخول هذه مرتبطة بالفعل بهذا الحساب.',
    invalidCredential: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    invalidEmail: 'صيغة البريد الإلكتروني غير صحيحة.',
    network: 'تعذر الاتصال بالشبكة. تحقق من اتصالك وحاول مجدداً.',
    operationDisabled: 'طريقة تسجيل الدخول هذه غير مفعلة في Firebase.',
    popupBlocked: 'منع المتصفح نافذة Google. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.',
    popupClosed: 'أُغلقت نافذة Google قبل اكتمال تسجيل الدخول.',
    unauthorizedDomain: 'هذا العنوان غير مسموح لتسجيل Google بعد. استخدم العنوان المعتمد أو أضفه في Firebase.',
    differentCredential: 'هذا البريد مرتبط بحساب قائم بطريقة دخول أخرى. بقي حساب الضيف كما هو.',
    tooManyRequests: 'محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مجدداً.',
    weakPassword: 'استخدم كلمة مرور أقوى تتكون من 6 أحرف على الأقل.',
  },
  en: {
    generic: 'We could not complete that account action. Try again.',
    configuration: 'Sign-in is not configured in this build. Use an approved version or contact the 11.11 team.',
    timeout: 'Firebase took too long to respond. Check your connection and try again.',
    initialization: 'The sign-in system could not start. Try again in a moment.',
    unavailable: 'The sign-in service is unavailable right now. Check the Firebase setup.',
    emailInUse: 'This email is already linked to an account.',
    credentialInUse: 'These credentials are linked to another account. Your guest profile was kept.',
    providerLinked: 'This sign-in method is already linked to this account.',
    invalidCredential: 'The email or password is incorrect.',
    invalidEmail: 'Enter a valid email address.',
    network: 'We could not reach the network. Check your connection and try again.',
    operationDisabled: 'This sign-in method is not enabled in Firebase.',
    popupBlocked: 'Your browser blocked the Google window. Allow pop-ups and try again.',
    popupClosed: 'The Google window was closed before sign-in finished.',
    unauthorizedDomain: 'This address is not approved for Google sign-in yet. Use an approved address or add it in Firebase.',
    differentCredential: 'This email belongs to an account that uses another sign-in method. Your guest account was kept.',
    tooManyRequests: 'Too many attempts in a short time. Wait a moment, then try again.',
    weakPassword: 'Use a stronger password with at least 6 characters.',
  },
} as const;

export function friendlyAuthError(
  error: unknown,
  locale: NetworkLocale = 'ar',
): string {
  const copy = AUTH_ERROR_COPY[locale];
  if (!(error instanceof Error)) {
    return copy.generic;
  }

  if (error.message.includes('Firebase Auth is not configured')) {
    return copy.configuration;
  }

  const authCode = (error as { code?: unknown }).code;
  if (typeof authCode === 'string') {
    const messages: Record<string, string> = {
      auth_timeout: copy.timeout,
      auth_initialization_failed: copy.initialization,
      auth_unavailable: copy.unavailable,
      no_authenticated_user: copy.unavailable,
      uid_changed: copy.generic,
      token_timeout: copy.timeout,
      token_failed: copy.unavailable,
      'auth/email-already-in-use': copy.emailInUse,
      'auth/credential-already-in-use': copy.credentialInUse,
      'auth/provider-already-linked': copy.providerLinked,
      'auth/invalid-credential': copy.invalidCredential,
      'auth/invalid-email': copy.invalidEmail,
      'auth/network-request-failed': copy.network,
      'auth/operation-not-allowed': copy.operationDisabled,
      'auth/popup-blocked': copy.popupBlocked,
      'auth/popup-closed-by-user': copy.popupClosed,
      'auth/unauthorized-domain': copy.unauthorizedDomain,
      'auth/account-exists-with-different-credential': copy.differentCredential,
      'auth/too-many-requests': copy.tooManyRequests,
      'auth/weak-password': copy.weakPassword,
    };
    if (messages[authCode]) return messages[authCode];
  }

  return copy.generic;
}

function currentLocale(): NetworkLocale {
  return useUiPreferencesStore.getState().locale;
}

async function runAuthAction(
  set: (state: Partial<AuthStoreState>) => void,
  action: () => Promise<void>,
): Promise<void> {
  try {
    set({ busy: true, error: null });
    await action();
  } catch (error) {
    set({ error: friendlyAuthError(error, currentLocale()) });
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
          error: state.error ? friendlyAuthError(state.error, currentLocale()) : null,
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
