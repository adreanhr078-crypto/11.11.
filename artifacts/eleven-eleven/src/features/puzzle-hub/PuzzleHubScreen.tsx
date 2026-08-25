import {
  lazy,
  Suspense,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BookOpenCheck,
  CalendarClock,
  RadioTower,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useLiveChallengeStore } from '../live-challenges/liveChallengeStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  PUZZLE_HUB_MODES,
  type PuzzleHubMode,
} from './puzzleHubModes';
import './puzzle-hub.css';

const StoryPuzzleMode = lazy(() => import('../screens/PuzzleScreen'));
const LiveChallengeMode = lazy(() => import('../live-challenges/LiveChallengesScreen'));

const MODE_ICONS = {
  story: BookOpenCheck,
  daily: RadioTower,
  weekly: CalendarClock,
} as const;

const HUB_COPY = {
  ar: { loading: 'تثبيت قناة اللعب…', title: 'مركز الألغاز', description: 'تظهر مهمتك القصصية الحالية هنا. تُفتح قنوات إضافية فقط بعد تقدمك القصصي الموثّق.', integrity: 'حالة تكامل مركز الألغاز', modes: 'أنماط مركز الألغاز', operations: 'عمليات الألغاز // الجزء الأول', storyMetric: 'قصة', channelMetric: 'قناة', signIn: 'يتطلب تسجيل الدخول', ready: 'جاهز للمزامنة', available: 'متاح عند الدخول', complete: 'مكتمل', stages: 'مراحل', eyebrows: { story: 'ألغاز القصة', daily: 'الإشارة اليومية', weekly: 'اختبار النظام' }, labels: { story: ['ألغاز القصة', 'عشرون لغزًا قصصيًا: 14 رئيسيًا و6 إشارات سرية.'], daily: ['إشارة 11:11 اليومية', 'إشارة خادمية متجددة ومكافأة واحدة موثقة لكل دورة.'], weekly: ['اختبار النظام الأسبوعي', 'مراحل متتابعة، حفظ تلقائي، واستعادة أسبوعية موثقة.'] } },
  en: { loading: 'Securing play channel…', title: 'Puzzle Hub', description: 'Your current story mission appears here. Additional channels open only after verified story progress.', integrity: 'Puzzle Hub integrity status', modes: 'Puzzle Hub modes', operations: 'PUZZLE OPERATIONS // PART 1', storyMetric: 'STORY', channelMetric: 'CHANNEL', signIn: 'Sign-in required', ready: 'Ready to sync', available: 'Available when signed in', complete: 'complete', stages: 'stages', eyebrows: { story: 'STORY PUZZLES', daily: 'DAILY SIGNAL', weekly: 'SYSTEM TRIAL' }, labels: { story: ['Story puzzles', 'Twenty story puzzles: 14 main puzzles and 6 secret signals.'], daily: ['Daily 11:11 Signal', 'A renewing server signal and one verified reward per cycle.'], weekly: ['Weekly system trial', 'Sequential stages, automatic save, and verified weekly recovery.'] } },
} as const;

function PuzzleModeLoading({ locale }: { locale: 'ar' | 'en' }) {
  return (
    <div className="puzzle-hub__loading" role="status">
      <i aria-hidden="true" />
      <span>{HUB_COPY[locale].loading}</span>
    </div>
  );
}

export default function PuzzleHubScreen() {
  const locale = useUiPreferencesStore((state) => state.locale);
  const copy = HUB_COPY[locale];
  const availableModes = useShellStore((state) => (
    state.experienceEntitlements.puzzleModes
  ));
  const [mode, setMode] = useState<PuzzleHubMode>(() => {
    try {
      const requested = sessionStorage.getItem('eleven_puzzle_hub_requested_mode');
      sessionStorage.removeItem('eleven_puzzle_hub_requested_mode');
      return PUZZLE_HUB_MODES.some((candidate) => candidate.id === requested)
        ? requested as PuzzleHubMode
        : 'story';
    } catch {
      return 'story';
    }
  });
  const authStatus = useAuthStore((state) => state.status);
  const storySnapshot = useStoryPuzzleStore((state) => state.snapshot);
  const liveSnapshot = useLiveChallengeStore((state) => state.snapshot);
  const visibleModes = useMemo(
    () => PUZZLE_HUB_MODES.filter((definition) => availableModes.includes(definition.id)),
    [availableModes],
  );
  const activeMode = visibleModes.some((definition) => definition.id === mode)
    ? mode
    : 'story';

  useEffect(() => {
    if (activeMode !== mode) setMode(activeMode);
  }, [activeMode, mode]);

  function focusModeFromKeyboard(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % visibleModes.length;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextIndex = (
        currentIndex - 1 + visibleModes.length
      ) % visibleModes.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = visibleModes.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextMode = visibleModes[nextIndex]!.id;
    setMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById(`puzzle-hub-tab-${nextMode}`)?.focus();
    });
  }

  const statusByMode = useMemo<Record<PuzzleHubMode, string>>(() => {
    if (authStatus !== 'signed-in') {
      return {
        story: copy.signIn, daily: copy.signIn, weekly: copy.signIn,
      };
    }

    return {
      story: storySnapshot
        ? `${storySnapshot.mainCompletedCount} / 14 ${copy.complete}`
        : copy.ready,
      daily: liveSnapshot
        ? liveSnapshot.daily.status.replace('_', ' ').toUpperCase()
        : copy.available,
      weekly: liveSnapshot
        ? `${liveSnapshot.weekly.completedStages} / ${liveSnapshot.weekly.totalStages} ${copy.stages}`
        : copy.available,
    };
  }, [authStatus, copy, liveSnapshot, storySnapshot]);

  return (
    <div className="puzzle-hub" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="puzzle-hub__hero">
        <div className="puzzle-hub__signal" aria-hidden="true">
          <i /><i /><i />
          <strong>11:11</strong>
        </div>
        <div className="puzzle-hub__hero-copy">
          <small>{copy.operations}</small>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="puzzle-hub__integrity" aria-label={copy.integrity}>
          <span><b>20</b> {copy.storyMetric}</span>
          <span><b>{String(visibleModes.length).padStart(2, '0')}</b> {copy.channelMetric}</span>
        </div>
      </header>

      <div
        className="puzzle-hub__modes"
        role="tablist"
        aria-label={copy.modes}
      >
        {visibleModes.map((definition, index) => {
          const Icon = MODE_ICONS[definition.id];
          const [label, description] = copy.labels[definition.id];
          const active = activeMode === definition.id;
          return (
            <button
              key={definition.id}
              id={`puzzle-hub-tab-${definition.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`puzzle-hub-panel-${definition.id}`}
              tabIndex={active ? 0 : -1}
              data-active={active}
              data-mode={definition.id}
              onClick={() => setMode(definition.id)}
              onKeyDown={(event) => focusModeFromKeyboard(event, index)}
            >
              <span className="puzzle-hub__mode-icon" aria-hidden="true">
                <Icon />
                <small>{definition.code}</small>
              </span>
              <span className="puzzle-hub__mode-copy">
                <small>{copy.eyebrows[definition.id]}</small>
                <strong>{label}</strong>
                <em>{description}</em>
              </span>
              <bdi className="puzzle-hub__mode-status" dir="ltr">
                {statusByMode[definition.id]}
              </bdi>
            </button>
          );
        })}
      </div>

      <section
        key={activeMode}
        id={`puzzle-hub-panel-${activeMode}`}
        className="puzzle-hub__content"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`puzzle-hub-tab-${activeMode}`}
        data-mode={activeMode}
      >
        <Suspense fallback={<PuzzleModeLoading locale={locale} />}>
          {activeMode === 'story' ? (
            <StoryPuzzleMode />
          ) : (
            <LiveChallengeMode mode={activeMode} embedded />
          )}
        </Suspense>
      </section>
    </div>
  );
}
