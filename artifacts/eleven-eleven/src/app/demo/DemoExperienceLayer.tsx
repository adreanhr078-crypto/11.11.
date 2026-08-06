import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameModal,
  GameProgress,
} from '../../ui/design-system';
import {
  createDemoProgressReadModel,
  readDemoModeConfig,
} from './demoMode';
import './demo-experience.css';

const DEMO_BOUNDARY_SESSION_KEY = 'eleven_demo_boundary_dismissed_v1';

function wasBoundaryDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DEMO_BOUNDARY_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberBoundaryDismissal(): void {
  try {
    window.sessionStorage.setItem(DEMO_BOUNDARY_SESSION_KEY, 'true');
  } catch {
    // Storage can be unavailable in privacy modes; dismissal still works now.
  }
}

export function DemoExperienceLayer() {
  const config = useMemo(() => readDemoModeConfig(), []);
  const completedPuzzleIds = useGameStore(
    (state) => state.progression.completedPuzzleIds,
  );
  const progress = useMemo(
    () => createDemoProgressReadModel(completedPuzzleIds),
    [completedPuzzleIds],
  );
  const [boundaryOpen, setBoundaryOpen] = useState(false);

  useEffect(() => {
    if (progress.boundaryReached && !wasBoundaryDismissed()) {
      setBoundaryOpen(true);
    }
  }, [progress.boundaryReached]);

  if (!config.enabled) {
    return null;
  }

  const closeBoundary = () => {
    rememberBoundaryDismissal();
    setBoundaryOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="demo-experience__badge"
        onClick={() => setBoundaryOpen(true)}
        aria-label={`نسخة تجريبية، ${progress.completed} من ${progress.total}`}
      >
        <strong>DEMO</strong>
        <span>{progress.completed}/{progress.total}</span>
      </button>

      <GameModal
        open={boundaryOpen}
        onClose={closeBoundary}
        eyebrow="11:11 // DEMO SIGNAL"
        title={progress.boundaryReached
          ? 'وصلت إلى نهاية الإشارة التجريبية'
          : 'نسخة الفصل الأول التجريبية'}
        description={progress.boundaryReached
          ? 'اكتشفت كل المحتوى المنشور داخل هذه النسخة. تقدّمك محفوظ، لكن الإشارة التالية ليست ضمن العرض التجريبي.'
          : `تبقّى ${progress.remaining} من الإشارات المتاحة في هذا العرض. هذه الواجهة لا تكشف أي أحداث غير منشورة.`}
        tone="danger"
        footer={(
          <>
            <GameButton variant="ghost" onClick={closeBoundary}>
              {progress.boundaryReached ? 'متابعة الاستكشاف' : 'العودة إلى اللعبة'}
            </GameButton>
            {config.fullGameUrl && (
              <a
                className="demo-experience__full-link"
                href={config.fullGameUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                الانتقال إلى النسخة الكاملة
              </a>
            )}
          </>
        )}
      >
        <div className="demo-experience__progress">
          <div>
            <span>تقدّم العرض</span>
            <strong>{progress.percentage}%</strong>
          </div>
          <GameProgress
            value={progress.percentage}
            tone="danger"
            showValue={false}
          />
          <small>
            {progress.completed} من {progress.total} إشارة مكتشفة
          </small>
        </div>
      </GameModal>
    </>
  );
}
