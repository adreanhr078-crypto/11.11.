import {
  lazy,
  Suspense,
  type KeyboardEvent as ReactKeyboardEvent,
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

function PuzzleModeLoading() {
  return (
    <div className="puzzle-hub__loading" role="status">
      <i aria-hidden="true" />
      <span>تثبيت قناة اللعب…</span>
    </div>
  );
}

export default function PuzzleHubScreen() {
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

  function focusModeFromKeyboard(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % PUZZLE_HUB_MODES.length;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextIndex = (
        currentIndex - 1 + PUZZLE_HUB_MODES.length
      ) % PUZZLE_HUB_MODES.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = PUZZLE_HUB_MODES.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextMode = PUZZLE_HUB_MODES[nextIndex]!.id;
    setMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById(`puzzle-hub-tab-${nextMode}`)?.focus();
    });
  }

  const statusByMode = useMemo<Record<PuzzleHubMode, string>>(() => {
    if (authStatus !== 'signed-in') {
      return {
        story: 'يتطلب تسجيل الدخول',
        daily: 'يتطلب تسجيل الدخول',
        weekly: 'يتطلب تسجيل الدخول',
      };
    }

    return {
      story: storySnapshot
        ? `${storySnapshot.mainCompletedCount} / 14 مكتمل`
        : 'جاهز للمزامنة',
      daily: liveSnapshot
        ? liveSnapshot.daily.status.replace('_', ' ').toUpperCase()
        : 'متاح عند الدخول',
      weekly: liveSnapshot
        ? `${liveSnapshot.weekly.completedStages} / ${liveSnapshot.weekly.totalStages} مراحل`
        : 'متاح عند الدخول',
    };
  }, [authStatus, liveSnapshot, storySnapshot]);

  return (
    <div className="puzzle-hub" dir="rtl">
      <header className="puzzle-hub__hero">
        <div className="puzzle-hub__signal" aria-hidden="true">
          <i /><i /><i />
          <strong>11:11</strong>
        </div>
        <div className="puzzle-hub__hero-copy">
          <small>PUZZLE OPERATIONS // PART 1</small>
          <h1>مركز الألغاز</h1>
          <p>
            ثلاث قنوات لعب، سجل واحد موثّق، وتقدّم محفوظ على الخادم.
            اختر مسارك وواصل من آخر نقطة آمنة.
          </p>
        </div>
        <div className="puzzle-hub__integrity" aria-label="حالة تكامل مركز الألغاز">
          <span><b>20</b> STORY</span>
          <span><b>01</b> DAILY</span>
          <span><b>07</b> WEEKLY</span>
        </div>
      </header>

      <div
        className="puzzle-hub__modes"
        role="tablist"
        aria-label="أنماط مركز الألغاز"
      >
        {PUZZLE_HUB_MODES.map((definition, index) => {
          const Icon = MODE_ICONS[definition.id];
          const active = mode === definition.id;
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
                <small>{definition.eyebrow}</small>
                <strong>{definition.label}</strong>
                <em>{definition.description}</em>
              </span>
              <bdi className="puzzle-hub__mode-status" dir="ltr">
                {statusByMode[definition.id]}
              </bdi>
            </button>
          );
        })}
      </div>

      <section
        key={mode}
        id={`puzzle-hub-panel-${mode}`}
        className="puzzle-hub__content"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`puzzle-hub-tab-${mode}`}
        data-mode={mode}
      >
        <Suspense fallback={<PuzzleModeLoading />}>
          {mode === 'story' ? (
            <StoryPuzzleMode />
          ) : (
            <LiveChallengeMode mode={mode} embedded />
          )}
        </Suspense>
      </section>
    </div>
  );
}
