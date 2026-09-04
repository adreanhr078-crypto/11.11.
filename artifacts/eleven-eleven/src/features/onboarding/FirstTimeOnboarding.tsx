import { useEffect, useMemo, useRef, useState } from 'react';
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
  STARTER_PLAYER_AVATAR_CATALOG,
  playerAvatarSrc,
} from '../../ui/presentation/playerAvatarCatalog';
import {
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MIN_LENGTH,
  type PlayerAvatarId,
} from '../../domain/player-profile/playerProfile';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  needsFirstTimeOnboarding,
  onboardingStageNumber,
  ONBOARDING_STAGE_COUNT,
  type OnboardingStage,
} from './onboardingRules';
import { retryPlayerSync } from '../player-sync/playerSyncCoordinator';
import { emitExperienceCue } from '../../ui/presentation/experienceCues';

const ONBOARDING_STORAGE_PREFIX = '11-11-onboarding-complete:';
const MAX_PROFILE_RETRIES = 6;
const ONBOARDING_FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const ONBOARDING_COPY = {
  ar: {
    echoPresence: 'حضور نظام Echo',
    echoQuote: 'أنت لست مجرد مستخدم...\nأنت جزء من الإشارة.',
    welcomeTitle: 'أهلاً بك في تجربة 11.11',
    welcomeIntro: 'قبل أن تبدأ... اختر هويتك داخل النظام',
    continue: 'متابعة',
    welcomeHint: 'يبدأ بروتوكول الهوية بعد اكتمال الإشارة',
    missionTitle: 'أنت داخل قصة حيّة',
    missionIntro: 'Echo ليس قائمة مهام. هو الوعي العالق داخل الإشارة، وأنت الشخص الذي يستطيع إعادة بناء ذاكرته.',
    missionStepsLabel: 'مراحل الرحلة الأولى',
    missionSteps: [
      ['اقرأ الأثر', 'المانهوا تكشف صفحة من السجل في كل مرة.'],
      ['اختبر فرضيتك', 'الألغاز تحول ما رأيته إلى قرار قابل للتحقق.'],
      ['غيّر الإشارة', 'نجاحك يفتح الدليل التالي ويجعل Echo يرد عليك.'],
    ],
    missionAction: 'فهمت المهمة',
    missionHint: 'بعد اختيار هويتك ستقابل Echo، ثم يظهر هدفك الأول تلقائياً.',
    identityTitle: 'اختر هويتك داخل النظام',
    identityIntro: 'أنشئ الإشارة التي سترافقك خلال تجربة 11.11.',
    username: 'اسم المستخدم',
    usernamePlaceholder: 'اكتب اسمك هنا...',
    checkUsername: 'تحقق من الاسم',
    usernameValid: 'صيغة الاسم مقبولة — سيؤكد النظام التوفر عند الحفظ.',
    usernameInvalid: (minimum: number) => `استخدم ${minimum} أحرف على الأقل بدون رموز غير مسموحة.`,
    avatarTitle: 'اختر صورتك الرمزية',
    avatarHint: '3 خيارات مجانية // ASSETS ONLY',
    start: 'ابدأ التجربة',
    identityHint: 'يمكنك تعديل الاسم والصورة لاحقاً من ملف اللاعب.',
    profileUnavailable: 'تعذر الوصول إلى هوية اللاعب',
    profileSyncing: 'مزامنة هوية اللاعب...',
    profileSyncDetail: 'يجري التحقق من Profile الحالي قبل فتح التجربة.',
    retry: 'إعادة المحاولة',
    connectedTitle: 'الإشارة متصلة',
    connectedDetail: 'مرحباً بك داخل نظام 11.11. جارٍ فتح التجربة...',
  },
  en: {
    echoPresence: 'Echo system presence',
    echoQuote: 'You are not just a user…\nYou are part of the signal.',
    welcomeTitle: 'Welcome to 11.11',
    welcomeIntro: 'Before you begin, choose the identity you will carry through the system.',
    continue: 'Continue',
    welcomeHint: 'The identity protocol begins when the signal is complete.',
    missionTitle: 'You are entering a living story',
    missionIntro: 'Echo is not a task list. It is a consciousness caught inside the signal, and you are the one who can rebuild its memory.',
    missionStepsLabel: 'Your first journey',
    missionSteps: [
      ['Read the trace', 'The Manhwa reveals one page of the record at a time.'],
      ['Test your theory', 'Puzzles turn what you noticed into a decision the system can verify.'],
      ['Change the signal', 'Your success opens the next clue and gives Echo a reason to answer.'],
    ],
    missionAction: 'I understand the mission',
    missionHint: 'After you choose an identity, you will meet Echo and your first objective will appear.',
    identityTitle: 'Choose your identity in the system',
    identityIntro: 'Create the signal that will accompany you through 11.11.',
    username: 'Username',
    usernamePlaceholder: 'Type your name…',
    checkUsername: 'Check name',
    usernameValid: 'The name format is valid — availability is confirmed when you save.',
    usernameInvalid: (minimum: number) => `Use at least ${minimum} letters, numbers, spaces, periods, underscores, or hyphens.`,
    avatarTitle: 'Choose your player avatar',
    avatarHint: '3 FREE OPTIONS // ASSETS ONLY',
    start: 'Enter the experience',
    identityHint: 'You can change your name and avatar later from your player profile.',
    profileUnavailable: 'Could not reach your player identity',
    profileSyncing: 'Synchronizing player identity…',
    profileSyncDetail: 'The current profile is being verified before the experience opens.',
    retry: 'Try again',
    connectedTitle: 'Signal connected',
    connectedDetail: 'Welcome to the 11.11 system. Opening your experience…',
  },
} as const;

type OnboardingCopy = (typeof ONBOARDING_COPY)[keyof typeof ONBOARDING_COPY];

type OnboardingStep = Exclude<OnboardingStage, 'complete'>;
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
  copy: OnboardingCopy;
}

function EchoStage({ avatarId, copy }: EchoStageProps) {
  return (
    <aside className="onboarding-echo-stage" aria-label={copy.echoPresence}>
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
        <span className="onboarding-echo-stage__experiment-mark" aria-hidden="true">
          <i />
          <b>EX-011</b>
          <i />
        </span>
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
        <span>{copy.echoQuote.split('\n').map((line, index) => (
          <span key={line}>{index > 0 && <br />}{line}</span>
        ))}</span>
      </div>
    </aside>
  );
}

function OnboardingFrame({
  children,
  step,
  busy = false,
  locale,
  copy,
}: {
  children: React.ReactNode;
  step: OnboardingStep | 'loading' | 'complete';
  busy?: boolean;
  locale: 'ar' | 'en';
  copy: OnboardingCopy;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const stepNumber = onboardingStageNumber(step);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const application = document.getElementById('app');
    const previousInert = application?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    if (application) application.inert = true;

    const focusDialog = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      dialog.querySelector<HTMLElement>(ONBOARDING_FOCUSABLE_SELECTOR)?.focus();
      if (!dialog.contains(document.activeElement)) dialog.focus();
    };
    const frame = window.requestAnimationFrame(focusDialog);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(ONBOARDING_FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (application) application.inert = previousInert;
      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      } else {
        document.querySelector<HTMLElement>(
          '#player-content button:not([disabled])',
        )?.focus();
      }
      previousFocusRef.current = null;
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      className="onboarding-overlay"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      lang={locale}
      role="dialog"
      aria-modal="true"
      aria-label={locale === 'en' ? 'First-time identity setup' : 'إعداد الهوية للمرة الأولى'}
      tabIndex={-1}
    >
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
            <span>/ {String(ONBOARDING_STAGE_COUNT).padStart(2, '0')}</span>
            <small>{step === 'mission'
              ? 'FIRST OBJECTIVE'
              : step === 'complete'
                ? copy.connectedTitle
                : 'IDENTITY SETUP'}</small>
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
          <EchoStage avatarId="echo" copy={copy} />
        </main>

        <footer className="onboarding-footer">
          <span>BUILD 1.0.0 // FIRST TIME ONBOARDING</span>
          <span className="onboarding-footer__signal"><i /><i /><i /><i /><i /> CYBER LINK READY</span>
          <span>MOBILE BROWSER READY</span>
        </footer>
      </div>
    </div>
  );
}

function WelcomeStep({ onContinue, copy }: { onContinue: () => void; copy: OnboardingCopy }) {
  const visibleText = useTypewriter(copy.welcomeTitle);
  const isComplete = visibleText.length === copy.welcomeTitle.length;

  return (
    <div className="onboarding-welcome">
      <span className="onboarding-kicker">FIRST CONTACT // 01</span>
      <h1>{visibleText}<i className="onboarding-cursor" aria-hidden="true" /></h1>
      <p>{copy.welcomeIntro}</p>
      <div className="onboarding-welcome__signal" aria-hidden="true">
        <i /><i /><i />
      </div>
      <button
        type="button"
        className="onboarding-primary-action"
        disabled={!isComplete}
        onClick={onContinue}
      >
        <span>{copy.continue}</span><ChevronLeft aria-hidden="true" />
      </button>
      <small className="onboarding-hint">{copy.welcomeHint}</small>
    </div>
  );
}

function MissionStep({ onContinue, copy }: { onContinue: () => void; copy: OnboardingCopy }) {
  return (
    <div className="onboarding-mission">
      <span className="onboarding-kicker">FIRST OBJECTIVE // 02</span>
      <h1>{copy.missionTitle}</h1>
      <p className="onboarding-mission__intro">
        {copy.missionIntro}
      </p>
      <div className="onboarding-mission__steps" role="list" aria-label={copy.missionStepsLabel}>
        {copy.missionSteps.map(([title, detail], index) => (
          <article key={title} role="listitem">
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{title}</strong><small>{detail}</small></div>
          </article>
        ))}
      </div>
      <button type="button" className="onboarding-primary-action" onClick={onContinue}>
        <span>{copy.missionAction}</span><ChevronLeft aria-hidden="true" />
      </button>
      <small className="onboarding-hint">{copy.missionHint}</small>
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
  copy,
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
  copy: OnboardingCopy;
}) {
  return (
    <div className="onboarding-identity">
      <span className="onboarding-kicker">PLAYER IDENTITY SETUP // 03</span>
      <h1>{copy.identityTitle}</h1>
      <p className="onboarding-identity__intro">{copy.identityIntro}</p>

      <label className="onboarding-field">
        <span>{copy.username}</span>
        <div className="onboarding-field__row">
          <input
            id="onboarding-username"
            value={username}
            maxLength={PROFILE_USERNAME_MAX_LENGTH}
            autoComplete="nickname"
            placeholder={copy.usernamePlaceholder}
            aria-describedby={profileError
              ? 'onboarding-username-validation onboarding-profile-error'
              : 'onboarding-username-validation'}
            onChange={(event) => onUsernameChange(event.target.value)}
          />
          <button
            type="button"
            className="onboarding-check-action"
            onClick={onCheckUsername}
          >
            {usernameCheck === 'valid' ? <Check aria-hidden="true" /> : <ScanLine aria-hidden="true" />}
            <span>{copy.checkUsername}</span>
          </button>
        </div>
      </label>
      <div
        id="onboarding-username-validation"
        className={`onboarding-validation onboarding-validation--${usernameCheck}`}
        role="status"
      >
        {usernameCheck === 'valid' && copy.usernameValid}
        {usernameCheck === 'invalid' && copy.usernameInvalid(PROFILE_USERNAME_MIN_LENGTH)}
      </div>

      <div className="onboarding-avatar-picker">
        <div className="onboarding-avatar-picker__heading">
          <span>{copy.avatarTitle}</span>
          <small>{copy.avatarHint}</small>
        </div>
        <div className="onboarding-avatar-grid">
          {STARTER_PLAYER_AVATAR_CATALOG.map((avatar) => (
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

      {profileError && <p id="onboarding-profile-error" className="onboarding-error" role="alert">{profileError}</p>}
      <button
        type="button"
        className="onboarding-primary-action onboarding-primary-action--identity"
        disabled={busy || !isUsernameShapeValid(username)}
        onClick={onSubmit}
      >
        {busy ? <LoaderCircle className="onboarding-spinner" aria-hidden="true" /> : <span>{copy.start}</span>}
        {!busy && <ChevronLeft aria-hidden="true" />}
      </button>
      <small className="onboarding-hint">{copy.identityHint}</small>
    </div>
  );
}

function LoadingStep({ error, onRetry, copy }: { error?: string | null; onRetry?: () => void; copy: OnboardingCopy }) {
  return (
    <div className="onboarding-loading">
      <LoaderCircle className="onboarding-spinner" aria-hidden="true" />
      <span className="onboarding-kicker">PROFILE CHANNEL // VERIFYING</span>
      <h1>{error ? copy.profileUnavailable : copy.profileSyncing}</h1>
      <p>{error ?? copy.profileSyncDetail}</p>
      {error && <button type="button" className="onboarding-secondary-action" onClick={onRetry}>{copy.retry}</button>}
    </div>
  );
}

function CompleteStep({ copy }: { copy: OnboardingCopy }) {
  return (
    <div className="onboarding-loading onboarding-complete">
      <Check className="onboarding-complete__check" aria-hidden="true" />
      <span className="onboarding-kicker">IDENTITY LINK // COMPLETE</span>
      <h1>{copy.connectedTitle}</h1>
      <p>{copy.connectedDetail}</p>
    </div>
  );
}

export function FirstTimeOnboarding() {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const profile = usePlayerProgressionStore((state) => state.profile);
  const profileStatus = usePlayerProgressionStore((state) => state.profileStatus);
  const profileError = usePlayerProgressionStore((state) => state.profileError);
  const updateProfile = usePlayerProgressionStore((state) => state.actions.updateProfile);
  const clearProfileError = usePlayerProgressionStore((state) => state.actions.clearProfileError);
  const navigate = useShellStore((state) => state.navigate);
  const locale = useUiPreferencesStore((state) => state.locale);
  const copy = ONBOARDING_COPY[locale];
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
      void retryPlayerSync();
    }, retryDelay);
    return () => window.clearTimeout(timer);
  }, [
    authStatus,
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
    clearProfileError();
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
    emitExperienceCue({ name: 'onboarding-complete', sourceId: user.uid });
    setCompletedLocally(true);
    setFinishing(true);
    window.setTimeout(() => {
      setFinishing(false);
      // Echo has already introduced the player's purpose during onboarding.
      // Return to the main menu so the objective is visible before the player
      // chooses an optional system such as Echo Mind.
      navigate('main-menu');
    }, 900);
  };

  const retryProfile = () => {
    setProfileRetryCount(0);
    void retryPlayerSync();
  };

  return (
    <OnboardingFrame
      step={finishing ? 'complete' : !isProfileReady ? 'loading' : step}
      busy={saving}
      locale={locale}
      copy={copy}
    >
      {finishing ? (
        <CompleteStep copy={copy} />
      ) : !isProfileReady ? (
        <LoadingStep
          error={profileStatus === 'error' ? profileError : null}
          onRetry={retryProfile}
          copy={copy}
        />
      ) : step === 'welcome' ? (
        <WelcomeStep onContinue={() => setStep('mission')} copy={copy} />
      ) : step === 'mission' ? (
        <MissionStep onContinue={() => setStep('identity')} copy={copy} />
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
          copy={copy}
        />
      )}
    </OnboardingFrame>
  );
}
