import {
  useId,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  GameButton,
  GameModal,
  GlassPanel,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
import { useAuthStore } from './authStore';

interface AuthPanelProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = 'sign-in' | 'create';

function displayUserName(
  user: ReturnType<typeof useAuthStore.getState>['user'],
): string {
  if (!user) return 'لاعب غير متصل';
  return user.displayName || user.email || (
    user.isAnonymous ? 'ضيف 11:11' : 'لاعب 11:11'
  );
}

export function AuthPanel({ open, onClose }: AuthPanelProps) {
  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const {
    status,
    user,
    configured,
    missingConfigKeys,
    busy,
    error,
    actions,
  } = useAuthStore();
  const signedIn = status === 'signed-in' && user !== null;
  const title = signedIn ? 'حساب اللاعب' : 'تسجيل الدخول';
  const description = signedIn
    ? 'الحساب جاهز للربط مع المزامنة ولوحة الصدارة في المراحل القادمة.'
    : 'سجل الدخول الآن لتجهيز الحفظ السحابي ولوحة الصدارة العالمية لاحقا.';
  const canSubmit = configured
    && email.trim().length > 3
    && password.length >= 6
    && !busy;
  const providerLabel = useMemo(() => {
    if (!user) return null;
    if (user.isAnonymous) return 'ضيف';
    if (user.providerId === 'google.com') return 'Google';
    if (user.providerId === 'password') return 'Email';
    return 'حساب متصل';
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (mode === 'create') {
      await actions.createAccountWithEmail(
        email.trim(),
        password,
        displayName.trim(),
      );
    } else {
      await actions.signInWithEmail(email.trim(), password);
    }
  };

  return (
    <GameModal
      open={open}
      onClose={onClose}
      eyebrow="ONLINE ID // PHASE 1"
      title={title}
      description={description}
      tone="progression"
    >
      <div className="auth-panel">
        {!configured && (
          <GlassPanel
            tone="danger"
            eyebrow="Firebase"
            title="إعدادات الحسابات غير مكتملة"
            className="auth-panel__notice"
          >
            <p>
              أضف مفاتيح Firebase في ملف البيئة حتى تعمل الحسابات الحقيقية.
            </p>
            <code>{missingConfigKeys.join(', ')}</code>
          </GlassPanel>
        )}

        {signedIn ? (
          <div className="auth-panel__profile">
            <span className="auth-panel__avatar" aria-hidden="true">
              <GameIcon id="category-characters" />
            </span>
            <div>
              <small>{providerLabel}</small>
              <strong>{displayUserName(user)}</strong>
              {user.email && <span>{user.email}</span>}
            </div>
            <GameButton
              variant="danger"
              fullWidth
              loading={busy}
              onClick={() => actions.signOut()}
            >
              تسجيل الخروج
            </GameButton>
          </div>
        ) : (
          <>
            <div className="auth-panel__modes" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'sign-in'}
                data-active={mode === 'sign-in'}
                onClick={() => setMode('sign-in')}
              >
                دخول
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'create'}
                data-active={mode === 'create'}
                onClick={() => setMode('create')}
              >
                حساب جديد
              </button>
            </div>

            <form className="auth-panel__form" onSubmit={handleSubmit}>
              {mode === 'create' && (
                <label htmlFor={nameId}>
                  <span>اسم اللاعب</span>
                  <input
                    id={nameId}
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Echo Runner"
                    disabled={busy || !configured}
                  />
                </label>
              )}

              <label htmlFor={emailId}>
                <span>البريد الإلكتروني</span>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="player@example.com"
                  disabled={busy || !configured}
                />
              </label>

              <label htmlFor={passwordId}>
                <span>كلمة المرور</span>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete={
                    mode === 'create' ? 'new-password' : 'current-password'
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  disabled={busy || !configured}
                />
              </label>

              <GameButton
                type="submit"
                fullWidth
                loading={busy}
                disabled={!canSubmit}
              >
                {mode === 'create' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
              </GameButton>
            </form>

            <div className="auth-panel__providers">
              <GameButton
                variant="secondary"
                fullWidth
                disabled={!configured || busy}
                loading={busy}
                onClick={() => actions.signInWithGoogle()}
              >
                المتابعة باستخدام Google
              </GameButton>
              <GameButton
                variant="ghost"
                fullWidth
                disabled={!configured || busy}
                loading={busy}
                onClick={() => actions.continueAsGuest()}
              >
                الدخول كضيف
              </GameButton>
            </div>
          </>
        )}

        {error && (
          <p className="auth-panel__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </GameModal>
  );
}
