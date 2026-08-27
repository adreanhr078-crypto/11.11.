import { useEffect, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import {
  GameIcon,
  GameIconLabel,
} from '../../ui/icons';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import { useShellStore } from '../../app/shell/shellStore';
import { EchoPresence } from '../../ui/presentation';
import { EchoStatusPanel } from '../../components/echo/EchoStatusPanel';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useLiveChallengeStore } from '../live-challenges/liveChallengeStore';

export default function DashboardScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const storyPuzzleSnapshot = useStoryPuzzleStore((store) => store.snapshot);
  const liveSnapshot = useLiveChallengeStore((store) => store.snapshot);
  const liveStatus = useLiveChallengeStore((store) => store.status);
  const loadLive = useLiveChallengeStore((store) => store.actions.load);
  useEffect(() => {
    if (liveStatus === 'idle') void loadLive();
  }, [liveStatus, loadLive]);
  const model = useMemo(
    () => createDashboardReadModel(state, storyPuzzleSnapshot),
    [state, storyPuzzleSnapshot],
  );
  const latestDecision = model.decisions[0];

  return (
    <div className="shell-screen shell-dashboard shell-dashboard--echo-system">
      <aside
        className="shell-dashboard__side-menu shell-dashboard__context"
        aria-label="ملخص الرحلة"
      >
        <header>
          <span>11:11</span>
          <strong>الخطوة التالية</strong>
          <small>رحلة واضحة بدون ازدحام</small>
        </header>
        <div className="shell-dashboard__context-list">
          <article>
            <GameIcon id="status-route" />
            <span>
              <strong>{model.chapter.title}</strong>
              <small>{model.chapter.description}</small>
            </span>
          </article>
          <article>
            <GameIcon id="screen-memory" />
            <span>
              <strong>{model.memory.fragments} شظايا مستعادة</strong>
              <small>{model.memory.unlocked} ذكريات مفتوحة</small>
            </span>
          </article>
          <article>
            <GameIcon id="screen-progress" />
            <span>
              <strong>
                {latestDecision ? 'آخر قرار محفوظ' : 'لا يوجد قرار محوري بعد'}
              </strong>
              <small>
                {latestDecision
                  ? `${latestDecision.id} / ${latestDecision.choiceId}`
                  : 'سيظهر هنا أول قرار مؤثر على رحلة Echo'}
              </small>
            </span>
          </article>
        </div>
      </aside>

      <section className="shell-dashboard__echo-core" aria-label="حالة Echo">
        <div className="shell-dashboard__core-header shell-dashboard__core-header--clean">
          <span>
            <small>ECHO CORE</small>
            <strong>الحالة الحالية</strong>
          </span>
          <span className="shell-dashboard__core-badge">
            الفصل {model.chapter.id}
          </span>
        </div>
        <EchoPresence
          className="shell-dashboard__echo-presence"
          variant="profile"
          eager
        />
        <div className="shell-dashboard__core-reticle" aria-hidden="true">
          <span /><span /><i />
        </div>
        <div className="shell-dashboard__identity">
          <small>Echo</small>
          <h1>داخل النظام</h1>
          <p>
            الشخصية، الذاكرة، والقرارات كلها متصلة بنفس طبقة السرد الحالية.
          </p>
          <div className="shell-dashboard__status-row">
            <span data-tone="memory">
              الاستقرار {model.echoStatus.metrics.memoryStability}%
            </span>
            <span>الإنسانية {model.echoStatus.metrics.humanity}%</span>
            <span>{model.echoStatus.stage.label}</span>
          </div>
        </div>

        <div className="shell-dashboard__memory-timeline">
          <header>
            <span>
              <small>MEMORY LINE</small>
              <strong>إشارات الذاكرة</strong>
            </span>
            <span>{model.memory.fragments}</span>
          </header>
          <div aria-label="إشارات الذكريات المتاحة">
            {Array.from({ length: 5 }, (_, index) => {
              const active = index < Math.min(5, model.memory.fragments);
              return (
                <article key={index} data-locked={!active}>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  <span>{active ? 'FRAGMENT LINKED' : 'FRAGMENT LOCKED'}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <EchoStatusPanel
        className="shell-dashboard__personality"
        model={model.echoStatus}
      />

      <GlassPanel
        className="shell-dashboard__trajectory"
        tone="danger"
        eyebrow="Choice Pressure"
        title="اتجاه الحالة"
      >
        <div className="shell-dashboard__axis">
          <span>
            <small>الثقة</small>
            <strong>{model.echoStatus.metrics.trust}</strong>
          </span>
          <i><b /></i>
          <span>
            <small>الفساد</small>
            <strong>{model.echoStatus.metrics.corruption}</strong>
          </span>
        </div>
        <GameProgress
          value={model.echoStatus.metrics.humanity}
          tone="progression"
        />
      </GlassPanel>

      <HudPanel
        className="shell-dashboard__journey"
        tone="danger"
        eyebrow={model.chapter.id}
        title={model.chapter.title}
      >
        <div className="shell-dashboard__journey-copy">
          <p>{model.chapter.description}</p>
          <GameProgress
            value={model.puzzleProgress.progress}
            label="تقدم الفصل"
            tone="danger"
          />
        </div>
        <div className="shell-dashboard__chapter-meta">
          <span>
            <strong>{model.puzzleProgress.resolved}</strong>
            ألغاز محسومة
          </span>
          <span>
            <strong>{model.memory.fragments || model.memory.legacyCollected}</strong>
            شظايا
          </span>
          <span>
            <strong>{model.decisions.length}</strong>
            قرارات مرئية
          </span>
        </div>
        <div className="shell-dashboard__primary-actions">
          <GameButton
            variant="danger"
            fullWidth
            onClick={() => navigate('puzzles')}
          >
            <GameIconLabel
              iconId="screen-puzzles"
              label="PUZZLE HUB // 3 MODES"
              description={liveSnapshot
                ? liveSnapshot.weekly
                  ? `DAILY ${liveSnapshot.daily.status.replace('_', ' ').toUpperCase()} // WEEKLY ${liveSnapshot.weekly.completedStages}/${liveSnapshot.weekly.totalStages}`
                  : `DAILY ${liveSnapshot.daily.status.replace('_', ' ').toUpperCase()}`
                : 'القصة والإشارة اليومية واختبار النظام الأسبوعي'}
              compact
            />
          </GameButton>
          <GameButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('characters')}
          >
            <GameIconLabel
              iconId="screen-characters"
              label="ملفات الشخصيات"
              description="راجع العلاقات والمعلومات التي كشفها مسار القصة"
              compact
            />
          </GameButton>
          <GameButton
            variant="ghost"
            fullWidth
            onClick={() => navigate('echo-mind')}
          >
            <GameIconLabel
              iconId="screen-echo-mind"
              label="افتح Echo Mind"
              description="التحدث مع Echo وربط الذكريات"
              compact
            />
          </GameButton>
        </div>
      </HudPanel>
    </div>
  );
}
