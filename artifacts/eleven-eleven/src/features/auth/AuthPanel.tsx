import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Cloud,
  CloudDownload,
  CloudOff,
  CloudUpload,
  Eye,
  EyeOff,
  Link2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { ENVIRONMENT_PRESENTATION_ASSETS } from '../../ui/presentation';
import {
  resolveCloudConflictWithCloud,
  resolveCloudConflictWithLocal,
  retryCloudSaveSync,
} from '../cloud-save/cloudSaveCoordinator';
import {
  useCloudSaveStore,
  type CloudSaveStatus,
} from '../cloud-save/cloudSaveStore';
import { useAuthStore } from './authStore';

interface AuthPanelProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = 'sign-in' | 'create';
type AccountLinkMode = 'choices' | 'email';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function displayUserName(
  user: ReturnType<typeof useAuthStore.getState>['user'],
): string {
  if (!user) return 'لاعب غير متصل';
  return user.displayName || user.email || (
    user.isAnonymous ? 'ضيف 11:11' : 'لاعب 11:11'
  );
}

function cloudStatusCopy(status: CloudSaveStatus): string {
  const labels: Record<CloudSaveStatus, string> = {
    disabled: 'الحفظ السحابي متوقف',
    connecting: 'جارٍ الاتصال بحفظ الحساب...',
    pending: 'تغييرات بانتظار الرفع',
    syncing: 'جارٍ رفع التقدم...',
    synced: 'التقدم محفوظ على السحابة',
    conflict: 'يوجد تعارض بين نسختين',
    error: 'تعذر الوصول إلى الحفظ السحابي',
  };
  return labels[status];
}

export function AuthPanel({ open, onClose }: AuthPanelProps) {
  const titleId = useId();
  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [accountLinkMode, setAccountLinkMode] = useState<AccountLinkMode>('choices');
  const {
    status,
    user,
    configured,
    busy,
    error,
    actions,
  } = useAuthStore();
  const cloudSave = useCloudSaveStore();

  const signedIn = status === 'signed-in' && user !== null;
  const isGuest = signedIn && user?.isAnonymous === true;
  const canSubmit = configured
    && email.trim().length > 3
    && password.length >= 6
    && !busy;
  const canResetPassword = configured
    && email.trim().length > 3
    && !busy;
  const canLinkWithEmail = isGuest && canSubmit;
  const providerLabel = useMemo(() => {
    if (!user) return null;
    if (user.isAnonymous) return 'حساب ضيف';
    if (user.providerId === 'google.com') return 'Google';
    if (user.providerId === 'password') return 'البريد الإلكتروني';
    return 'حساب متصل';
  }, [user]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setResetSent(false);
      setAccountLinkMode('choices');
      actions.clearError();
    }
  }, [actions, open]);

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setResetSent(false);
    actions.clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      if (mode === 'create') {
        await actions.createAccountWithEmail(
          email.trim(),
          password,
          displayName.trim(),
        );
      } else {
        await actions.signInWithEmail(email.trim(), password);
      }
    } catch {
      // The store exposes the localized error inside the panel.
    }
  };

  const handleResetPassword = async () => {
    if (!canResetPassword) return;
    try {
      await actions.resetPassword(email.trim());
      setResetSent(true);
    } catch {
      setResetSent(false);
    }
  };

  const runProviderAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch {
      // The store exposes the localized error inside the panel.
    }
  };

  const openEmailAccountLink = () => {
    setAccountLinkMode('email');
    setResetSent(false);
    actions.clearError();
  };

  const handleLinkWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canLinkWithEmail) return;

    try {
      await actions.linkAnonymousAccountWithEmail(
        email.trim(),
        password,
        displayName.trim(),
      );
    } catch {
      // The store exposes the localized error inside the account-link panel.
    }
  };

  const handleLinkWithGoogle = async () => {
    actions.clearError();
    await runProviderAction(actions.linkAnonymousAccountWithGoogle);
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="auth-experience" dir="ltr">
      <div
        className="auth-experience__world"
        style={{
          backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.mainMenuWorld}")`,
        }}
        aria-hidden="true"
      />
      <div className="auth-experience__veil" aria-hidden="true" />

      <div
        ref={dialogRef}
        className="auth-experience__frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="auth-experience__topbar">
          <div className="auth-experience__logo" aria-label="Eleven Eleven">
            <strong>11</strong>
            <span>ELEVEN · ELEVEN</span>
          </div>
          <button
            type="button"
            className="auth-experience__close"
            onClick={onClose}
            aria-label="إغلاق شاشة تسجيل الدخول"
            title="إغلاق"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <main className="auth-experience__layout">
          <section className="auth-brand" aria-label="هوية مشروع 11:11">
            <div className="auth-brand__signal" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="auth-brand__number-wrap" aria-hidden="true">
              <span className="auth-brand__halo" />
              <strong className="auth-brand__number">11.11</strong>
              <span className="auth-brand__sweep" />
            </div>
            <p className="auth-brand__name">ELEVEN · ELEVEN</p>
            <div className="auth-brand__message" dir="rtl">
              <span>الإشارة بانتظارك.</span>
              <strong>ما الذي ستتذكره؟</strong>
            </div>
            <div className="auth-brand__status" dir="rtl">
              <span className="auth-brand__status-dot" aria-hidden="true" />
              <small>حالة النظام</small>
              <strong>{configured ? 'متصل' : 'بانتظار الإعداد'}</strong>
            </div>
          </section>

          <section className="auth-card" dir="rtl">
            <div className="auth-card__corner" aria-hidden="true" />
            {signedIn ? (
              <div className="auth-profile">
                <div className="auth-profile__avatar" aria-hidden="true">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <UserRound />
                  )}
                </div>
                <div className="auth-profile__copy">
                  <span>{providerLabel}</span>
                  <h2 id={titleId}>{displayUserName(user)}</h2>
                  {user.email && <p>{user.email}</p>}
                </div>
                {isGuest && (
                  <section
                    className="auth-account-link"
                    aria-labelledby={`${titleId}-account-link`}
                  >
                    <div className="auth-account-link__heading">
                      <span className="auth-account-link__signal" aria-hidden="true">
                        <Link2 />
                      </span>
                      <div>
                        <span>ACCOUNT LINK // SECURE</span>
                        <h3 id={`${titleId}-account-link`}>
                          ثبّت رحلتك على حسابك
                        </h3>
                        <p>
                          اربط الضيف الآن ليبقى تقدّمك معك على الهاتف والكمبيوتر.
                          الربط لا يعيد بدء الرحلة.
                        </p>
                      </div>
                    </div>

                    {accountLinkMode === 'email' ? (
                      <form
                        className="auth-account-link__form"
                        onSubmit={handleLinkWithEmail}
                      >
                        <label className="auth-field" htmlFor={`${emailId}-link`}>
                          <span>البريد الإلكتروني الجديد</span>
                          <div className="auth-field__control">
                            <Mail aria-hidden="true" />
                            <input
                              id={`${emailId}-link`}
                              type="email"
                              inputMode="email"
                              autoComplete="email"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="player@example.com"
                              disabled={busy || !configured}
                              required
                            />
                          </div>
                        </label>
                        <label className="auth-field" htmlFor={`${passwordId}-link`}>
                          <span>كلمة مرور للحساب</span>
                          <div className="auth-field__control">
                            <LockKeyhole aria-hidden="true" />
                            <input
                              id={`${passwordId}-link`}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder="6 أحرف على الأقل"
                              minLength={6}
                              disabled={busy || !configured}
                              required
                            />
                            <button
                              type="button"
                              className="auth-field__reveal"
                              onClick={() => setShowPassword((visible) => !visible)}
                              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                              title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                            >
                              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                            </button>
                          </div>
                        </label>
                        <label className="auth-field" htmlFor={`${nameId}-link`}>
                          <span>اسم اللاعب (اختياري)</span>
                          <div className="auth-field__control">
                            <UserRound aria-hidden="true" />
                            <input
                              id={`${nameId}-link`}
                              autoComplete="nickname"
                              value={displayName}
                              onChange={(event) => setDisplayName(event.target.value)}
                              placeholder="Echo Runner"
                              disabled={busy || !configured}
                            />
                          </div>
                        </label>
                        <div className="auth-account-link__actions">
                          <button
                            type="submit"
                            className="auth-action auth-action--primary"
                            disabled={!canLinkWithEmail}
                          >
                            <span>{busy ? 'جارٍ تثبيت الحساب...' : 'ربط البريد وحفظ الرحلة'}</span>
                            <Link2 aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="auth-account-link__back"
                            disabled={busy}
                            onClick={() => {
                              setAccountLinkMode('choices');
                              actions.clearError();
                            }}
                          >
                            العودة إلى خيارات الربط
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="auth-account-link__methods">
                        <button
                          type="button"
                          className="auth-action auth-action--provider"
                          disabled={!configured || busy}
                          onClick={() => void handleLinkWithGoogle()}
                        >
                          <span className="auth-google-mark" aria-hidden="true">G</span>
                          <span>{busy ? 'جارٍ فتح Google...' : 'ربط الحساب مع Google'}</span>
                        </button>
                        <button
                          type="button"
                          className="auth-action auth-action--provider"
                          disabled={!configured || busy}
                          onClick={openEmailAccountLink}
                        >
                          <Mail aria-hidden="true" />
                          <span>ربط بالبريد الإلكتروني</span>
                        </button>
                      </div>
                    )}

                    {error && (
                      <p className="auth-card__error" role="alert">{error}</p>
                    )}
                  </section>
                )}
                <div
                  className="auth-profile__ready"
                  data-status={cloudSave.status}
                >
                  {cloudSave.status === 'error'
                    ? <CloudOff aria-hidden="true" />
                    : <Cloud aria-hidden="true" />}
                  <span>{cloudStatusCopy(cloudSave.status)}</span>
                </div>
                {cloudSave.message && (
                  <p className="auth-profile__sync-message" role="status">
                    {cloudSave.message}
                  </p>
                )}
                {cloudSave.status === 'synced' && cloudSave.lastSyncedAt && (
                  <small className="auth-profile__sync-meta">
                    المراجعة {cloudSave.revision} · آخر مزامنة{' '}
                    {new Date(cloudSave.lastSyncedAt).toLocaleString('ar')}
                  </small>
                )}
                {cloudSave.status === 'conflict' && (
                  <div className="auth-profile__conflict-actions">
                    <button
                      type="button"
                      className="auth-action auth-action--provider"
                      onClick={() => void resolveCloudConflictWithCloud()}
                    >
                      <CloudDownload aria-hidden="true" />
                      <span>استخدام نسخة السحابة</span>
                    </button>
                    <button
                      type="button"
                      className="auth-action auth-action--provider"
                      onClick={() => void resolveCloudConflictWithLocal()}
                    >
                      <CloudUpload aria-hidden="true" />
                      <span>الاحتفاظ بهذا الجهاز</span>
                    </button>
                  </div>
                )}
                {cloudSave.status === 'error' && (
                  <button
                    type="button"
                    className="auth-profile__retry"
                    onClick={() => void retryCloudSaveSync()}
                  >
                    إعادة محاولة الاتصال
                  </button>
                )}
                <button
                  type="button"
                  className="auth-action auth-action--primary"
                  disabled={busy}
                  onClick={() => void runProviderAction(actions.signOut)}
                >
                  <span>{busy ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}</span>
                  <ArrowLeft aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <header className="auth-card__heading">
                  <span>ONLINE ID // PHASE 01</span>
                  <h2 id={titleId}>
                    {mode === 'sign-in' ? 'مرحباً بعودتك' : 'ابدأ رحلتك'}
                  </h2>
                  <p>
                    {mode === 'sign-in'
                      ? 'سجّل الدخول للعودة إلى الإشارة.'
                      : 'أنشئ هويتك واحفظ أثر رحلتك.'}
                  </p>
                </header>

                <div className="auth-card__modes" role="tablist" aria-label="نوع الحساب">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'sign-in'}
                    data-active={mode === 'sign-in'}
                    onClick={() => selectMode('sign-in')}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'create'}
                    data-active={mode === 'create'}
                    onClick={() => selectMode('create')}
                  >
                    حساب جديد
                  </button>
                </div>

                {!configured && (
                  <div className="auth-card__notice" role="status">
                    <ShieldCheck aria-hidden="true" />
                    <span>
                      تسجيل الدخول غير جاهز في هذه النسخة بعد. لا يمكن بدء رحلة محفوظة
                      أو منح مكافآت موثّقة حتى تتصل هوية اللاعب بالخدمة.
                    </span>
                  </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                  {mode === 'create' && (
                    <label className="auth-field" htmlFor={nameId}>
                      <span>اسم اللاعب</span>
                      <div className="auth-field__control">
                        <UserRound aria-hidden="true" />
                        <input
                          id={nameId}
                          autoComplete="nickname"
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder="Echo Runner"
                          disabled={busy || !configured}
                        />
                      </div>
                    </label>
                  )}

                  <label className="auth-field" htmlFor={emailId}>
                    <span>البريد الإلكتروني</span>
                    <div className="auth-field__control">
                      <Mail aria-hidden="true" />
                      <input
                        id={emailId}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setResetSent(false);
                        }}
                        placeholder="player@example.com"
                        disabled={busy || !configured}
                        required
                      />
                    </div>
                  </label>

                  <label className="auth-field" htmlFor={passwordId}>
                    <span>كلمة المرور</span>
                    <div className="auth-field__control">
                      <LockKeyhole aria-hidden="true" />
                      <input
                        id={passwordId}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={
                          mode === 'create' ? 'new-password' : 'current-password'
                        }
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="6 أحرف على الأقل"
                        minLength={6}
                        disabled={busy || !configured}
                        required
                      />
                      <button
                        type="button"
                        className="auth-field__reveal"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </button>
                    </div>
                  </label>

                  {mode === 'sign-in' && (
                    <button
                      type="button"
                      className="auth-form__forgot"
                      disabled={!canResetPassword}
                      onClick={() => void handleResetPassword()}
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}

                  {resetSent && (
                    <p className="auth-form__success" role="status">
                      أرسلنا رابط استعادة كلمة المرور إلى بريدك.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="auth-action auth-action--primary"
                    disabled={!canSubmit}
                  >
                    <span>
                      {busy
                        ? 'جارٍ الاتصال...'
                        : mode === 'create' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
                    </span>
                    <ArrowLeft aria-hidden="true" />
                  </button>
                </form>

                <div className="auth-card__divider">
                  <span>أو المتابعة باستخدام</span>
                </div>

                <div className="auth-providers">
                  <button
                    type="button"
                    className="auth-action auth-action--provider"
                    disabled={!configured || busy}
                    onClick={() => void runProviderAction(actions.signInWithGoogle)}
                  >
                    <span className="auth-google-mark" aria-hidden="true">G</span>
                    <span>المتابعة باستخدام Google</span>
                  </button>
                  <button
                    type="button"
                    className="auth-action auth-action--guest"
                    disabled={!configured || busy}
                    onClick={() => void runProviderAction(actions.continueAsGuest)}
                  >
                    <UserRound aria-hidden="true" />
                    <span>الدخول كضيف</span>
                  </button>
                </div>

                {error && (
                  <p className="auth-card__error" role="alert">{error}</p>
                )}

                <footer className="auth-card__footer">
                  <ShieldCheck aria-hidden="true" />
                  <span>بيانات الدخول محمية عبر Firebase Authentication</span>
                </footer>
              </>
            )}
          </section>
        </main>

        <footer className="auth-experience__footer">
          <span>BUILD 1.0.0</span>
          <strong>ECHO SYSTEMS</strong>
          <span>11:11 PROJECT</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
