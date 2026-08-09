import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  LoaderCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ECHO_PRESENTATION_ASSETS } from '../../ui/presentation/visualAssets';
import {
  PLAYER_AVATAR_CATALOG,
  playerAvatarSrc,
} from '../../ui/presentation/playerAvatarCatalog';
import {
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MIN_LENGTH,
  type PlayerAvatarId,
  type PlayerProfile,
} from '../../domain/player-profile/playerProfile';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useShellStore } from '../../app/shell/shellStore';
import { needsFirstTimeOnboarding } from './onboardingRules';

const WELCOME_TEXT = 'أهلاً بك في تجربة 11.11';
const ONBOARDING_STORAGE_PREFIX = '11-11-onboarding-complete:';
const MAX_PROFILE_RETRIES = 6;

type OnboardingStep = 'welcome' | 'identity';
type UsernameCheck = 'idle' | 'valid' | 'invalid';

function onboardingStorageKey(uid: string): string {
  return `${ONBOARDING_STORAGE_PREFIX}${uid}`;
}

function hasCompletedOnboarding(uid: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(onboardingStorageKey(uid)) === '1';
  } catch {
    return false;
  }
}

function markOnboardingComplete(uid: string): void {
  try {
    window.localStorage.setItem(onboardingStorageKey(uid), '1');
  } catch {
    // The server profile is still the source of truth for the identity.
  }
}

function useTypewriter(text: string, speed = 42): string {
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    setVisibleText('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [speed, text]);

  return visibleText;
}

function cleanUsername(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PROFILE_USERNAME_MAX_LENGTH);
}

function isUsernameShapeValid(value: string): boolean {
  const cleaned = cleanUsername(value);
  return cleaned.length >= PROFILE_USERNAME_MIN_LENGTH
    && /^[\p{L}\p{N} ._-]+$/u.test(cleaned);
}

interface EchoStageProps {
  avatarId: PlayerAvatarId;
}

function EchoStage({ avatarId }: EchoStageProps) {
  return (
    <aside className="onboarding-echo-stage" aria-label="Echo system presence">
      <div className="onboarding-echo-stage__backdrop" aria-hidden="true" />
      <div className="onboarding-echo-stage__halo" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>
      <div className="onboarding-echo-stage__character" aria-hidden="true">
        <img
          src={ECHO_PRESENTATION_ASSETS.fullBodyNormal}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
        />
        <span className="onboarding-echo-stage__grade" />
        <span className="onboarding-echo-stage__scan" />
        <span className="onboarding-echo-stage__glow onboarding-echo-stage__glow--cyan" />
        <span className="onboarding-echo-stage__glow onboarding-echo-stage__glow--red" />
      </div>
      <div className="onboarding-echo-stage__telemetry">
        <span><small>ECHO // UNIT 11</small><strong>IDENTITY LINK</strong></span>
        <span><i /> SIGNAL STABLE</span>
      </div>
      <div className="onboarding-echo-stage__avatar-readout">
        <img src={playerAvatarSrc(avatarId)} alt="" />
        <span><small>PLAYER AVATAR</small><strong>{avatarId.replace('_', ' ').toUpperCase()}</strong></span>
      </div>
      <div className="onboarding-echo-stage__quote">
        <Sparkles aria-hidden="true" />
        <span>أنت لست مجرد مستخدم...<br />أنت جزء من الإشارة.</span>
      </div>
    </aside>
  );
}

function OnboardingFrame({
  children,
  step,
  busy = false,
}: {
  children: React.ReactNode;
  step: OnboardingStep | 'loading' | 'complete';
  busy?: boolean;
}) {
  const stepNumber = step === 'welcome' || step === 'loading' ? '01' : '02';
  return (
    <div className="onboarding-overlay" dir="rtl">
      <div className="onboarding-overlay__grid" aria-hidden="true" />
      <div className="onboarding-overlay__noise" aria-hidden="true" />
      <div className="onboarding-shell">
        <header className="onboarding-header">
          <div className="onboarding-brand" dir="ltr">
            <strong><b>11</b>.11</strong>
            <span>ECHO SYSTEM // 11.11</span>
          </div>
          <div className="onboarding-header__status">
            <span className="onboarding-live-dot" />
            <small>ONBOARDING PROTOCOL</small>
            <strong>{busy ? 'SYNCING' : 'SYSTEM ONLINE'}</strong>
          </div>
          <div className="onboarding-step-indicator" dir="ltr">
            <strong>{stepNumber}</strong>
            <span>/ 02</span>
            <small>IDENTITY SETUP</small>
          </div>
        </header>

        <main className="onboarding-main">
          <section className="onboarding-panel">
            <div className="onboarding-panel__topline">
              <span><i /> SYSTEM MESSAGE</span>
              <small>11.11 // SECURE CHANNEL</small>
            </div>
            {children}
            <div className="onboarding-panel__seal" aria-hidden="true">
              <ShieldCheck /> <span>PROFILE DATA ENCRYPTED // UID VERIFIED</span>
            </div>
          </section>
          <EchoStage avatarId="echo" />
        </main>

        <footer className="onboarding-footer">
          <span>BUILD 1.0.0 // FIRST TIME ONBOARDING</span>
          <span className="onboarding-footer__signal"><i /><i /><i /><i /><i /> CYBER LINK READY</span>
          <span>LANDSCAPE MOBILE EXPERIENCE</span>
        </footer>
      </div>
    </div>
  );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  const visibleText = useTypewriter(WELCOME_TEXT);
  const isComplete = visibleText.length === WELCOME_TEXT.length;

  return (
    <div className="onboarding-welcome">
      <span className="onboarding-kicker">FIRST CONTACT // 01</span>
      <h1>{visibleText}<i className="onboarding-cursor" aria-hidden="true" /></h1>
      <p>قبل أن تبدأ... اختر هويتك داخل النظام</p>
      <div className="onboarding-welcome__signal" aria-hidden="true">
        <i /><i /><i />
      </div>
      <button
        type="button"
        className="onboarding-primary-action"
        disabled={!isComplete}
        onClick={onContinue}
      >
        <span>متابعة</span><ChevronLeft aria-hidden="true" />
      </button>
      <small className="onboarding-hint">يبدأ بروتوكول الهوية بعد اكتمال الإشارة</small>
    </div>
  );
}

function IdentityStep({
  username,
  avatarId,
  usernameCheck,
  profileError,
  busy,
  onUsernameChange,
  onCheckUsername,
  onAvatarChange,
  onSubmit,
}: {
  username: string;
  avatarId: PlayerAvatarId;
  usernameCheck: UsernameCheck;
  profileError: string | null;
  busy: boolean;
  onUsernameChange: (value: string) => void;
  onCheckUsername: () => void;
  onAvatarChange: (value: PlayerAvatarId) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="onboarding-identity">
      <span className="onboarding-kicker">PLAYER IDENTITY SETUP // 02</span>
      <h1>اختر هويتك داخل النظام</h1>
      <p className="onboarding-identity__intro">أنشئ الإشارة التي سترافقك خلال تجربة 11.11.</p>

      <label className="onboarding-field">
        <span>اسم المستخدم</span>
        <div className="onboarding-field__row">
          <input
            value={username}
            maxLength={PROFILE_USERNAME_MAX_LENGTH}
            autoComplete="nickname"
            placeholder="اكتب اسمك هنا..."
            onChange={(event) => onUsernameChange(event.target.value)}
          />
          <button
            type="button"
            className="onboarding-check-action"
            onClick={onCheckUsername}
          >
            {usernameCheck === 'valid' ? <Check aria-hidden="true" /> : <ScanLine aria-hidden="true" />}
            <span>تحقق من الاسم</span>
          </button>
        </div>
      </label>
      <div className={`onboarding-validation onboarding-validation--${usernameCheck}`} role="status">
        {usernameCheck === 'valid' && 'صيغة الاسم مقبولة — سيؤكد النظام التوفر عند الحفظ.'}
        {usernameCheck === 'invalid' && `استخدم ${PROFILE_USERNAME_MIN_LENGTH} أحرف على الأقل بدون رموز غير مسموحة.`}
      </div>

      <div className="onboarding-avatar-picker">
        <div className="onboarding-avatar-picker__heading">
          <span>اختر صورتك الرمزية</span>
          <small>3 خيارات مجانية // ASSETS ONLY</small>
        </div>
        <div className="onboarding-avatar-grid">
          {PLAYER_AVATAR_CATALOG.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              className="onboarding-avatar-card"
              data-selected={avatarId === avatar.id}
              aria-pressed={avatarId === avatar.id}
              onClick={() => onAvatarChange(avatar.id)}
            >
              <img src={avatar.src} alt="" />
              <span>{avatar.label}</span>
              {avatarId === avatar.id && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      {profileError && <p className="onboarding-error" role="alert">{profileError}</p>}
      <button
        type="button"
        className="onboarding-primary-action onboarding-primary-action--identity"
        disabled={busy || !isUsernameShapeValid(username)}
        onClick={onSubmit}
      >
        {busy ? <LoaderCircle className="onboarding-spinner" aria-hidden="true" /> : <span>ابدأ التجربة</span>}
        {!busy && <ChevronLeft aria-hidden="true" />}
      </button>
      <small className="onboarding-hint">يمكنك تعديل الاسم والصورة لاحقًا من ملف اللاعب</small>
    </div>
  );
}

function LoadingStep({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  return (
    <div className="onboarding-loading">
      <LoaderCircle className="onboarding-spinner" aria-hidden="true" />
      <span className="onboarding-kicker">PROFILE CHANNEL // VERIFYING</span>
      <h1>{error ? 'تعذر الوصول إلى هوية اللاعب' : 'مزامنة هوية اللاعب...'}</h1>
      <p>{error ?? 'يجري التحقق من Profile الحالي قبل فتح التجربة.'}</p>
      {error && <button type="button" className="onboarding-secondary-action" onClick={onRetry}>إعادة المحاولة</button>}
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="onboarding-loading onboarding-complete">
      <Check className="onboarding-complete__check" aria-hidden="true" />
      <span className="onboarding-kicker">IDENTITY LINK // COMPLETE</span>
      <h1>الإشارة متصلة</h1>
      <p>مرحبًا بك داخل نظام 11.11. جارٍ فتح التجربة...</p>
    </div>
  );
}

export function FirstTimeOnboarding() {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const profile = usePlayerProgressionStore((state) => state.profile);
  const profileStatus = usePlayerProgressionStore((state) => state.profileStatus);
  const profileError = usePlayerProgressionStore((state) => state.profileError);
  const loadProfile = usePlayerProgressionStore((state) => state.actions.loadProfile);
  const updateProfile = usePlayerProgressionStore((state) => state.actions.updateProfile);
  const navigate = useShellStore((state) => state.navigate);
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState<PlayerAvatarId>('echo');
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>('idle');
  const [completedLocally, setCompletedLocally] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileRetryCount, setProfileRetryCount] = useState(0);

  const profileForUser = profile?.uid === user?.uid ? profile : null;
  const isProfileReady = profileStatus === 'ready' && profileForUser !== null;
  const requiresOnboarding = useMemo(
    () => needsFirstTimeOnboarding(profileForUser, completedLocally),
    [completedLocally, profileForUser],
  );

  useEffect(() => {
    if (!user) return;
    setCompletedLocally(hasCompletedOnboarding(user.uid));
    setStep('welcome');
    setFinishing(false);
    setProfileRetryCount(0);
  }, [user?.uid]);

  useEffect(() => {
    if (!profileForUser) return;
    setUsername(profileForUser.username.startsWith('SUBJECT-') ? '' : profileForUser.username);
    setAvatarId(profileForUser.avatarId);
  }, [profileForUser]);

  useEffect(() => {
    if (
      authStatus !== 'signed-in'
      || profileStatus !== 'error'
      || profileRetryCount >= MAX_PROFILE_RETRIES
      || !user
    ) return;
    const retryDelay = 1000 * (profileRetryCount + 1);
    const timer = window.setTimeout(() => {
      setProfileRetryCount((count) => count + 1);
      void loadProfile();
    }, retryDelay);
    return () => window.clearTimeout(timer);
  }, [
    authStatus,
    loadProfile,
    profileRetryCount,
    profileStatus,
    user,
  ]);

  if (authStatus !== 'signed-in' || !user) return null;

  const shouldShow = finishing || (!isProfileReady || requiresOnboarding);
  if (!shouldShow) return null;

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameCheck('idle');
  };

  const handleCheckUsername = () => {
    const cleaned = cleanUsername(username);
    setUsername(cleaned);
    setUsernameCheck(isUsernameShapeValid(cleaned) ? 'valid' : 'invalid');
  };

  const handleSubmit = async () => {
    const cleaned = cleanUsername(username);
    if (!isUsernameShapeValid(cleaned)) {
      setUsernameCheck('invalid');
      return;
    }
    setSaving(true);
    const saved = await updateProfile({ username: cleaned, bio: '', avatarId });
    setSaving(false);
    if (!saved) return;
    markOnboardingComplete(user.uid);
    setCompletedLocally(true);
    setFinishing(true);
    window.setTimeout(() => {
      setFinishing(false);
      navigate('main-menu');
    }, 900);
  };

  const retryProfile = () => {
    setProfileRetryCount(0);
    void loadProfile();
  };

  return (
    <OnboardingFrame step={finishing ? 'complete' : !isProfileReady ? 'loading' : step} busy={saving}>
      {finishing ? (
        <CompleteStep />
      ) : !isProfileReady ? (
        <LoadingStep
          error={profileStatus === 'error' ? profileError : null}
          onRetry={retryProfile}
        />
      ) : step === 'welcome' ? (
        <WelcomeStep onContinue={() => setStep('identity')} />
      ) : (
        <IdentityStep
          username={username}
          avatarId={avatarId}
          usernameCheck={usernameCheck}
          profileError={profileError}
          busy={saving}
          onUsernameChange={handleUsernameChange}
          onCheckUsername={handleCheckUsername}
          onAvatarChange={setAvatarId}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </OnboardingFrame>
  );
}
