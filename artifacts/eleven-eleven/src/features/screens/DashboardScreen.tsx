import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
  StatMeter,
} from '../../ui/design-system';
import {
  GameIcon,
  GameIconLabel,
} from '../../ui/icons';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import { useShellStore } from '../../app/shell/shellStore';
import type { GameTone } from '../../ui/design-system';
import { EchoPresence } from '../../ui/presentation';

const PERSONALITY_STATS: Array<{
  key: 'humanity' | 'trust' | 'fear' | 'anger' | 'sadness' | 'corruption';
  label: string;
  tone: GameTone;
}> = [
  { key: 'humanity', label: 'الإنسانية', tone: 'progression' },
  { key: 'trust', label: 'الثقة', tone: 'memory' },
  { key: 'fear', label: 'الخوف', tone: 'danger' },
  { key: 'anger', label: 'الغضب', tone: 'danger' },
  { key: 'sadness', label: 'الحزن', tone: 'rare' },
  { key: 'corruption', label: 'الفساد', tone: 'rare' },
];

export default function DashboardScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const model = useMemo(() => createDashboardReadModel(state), [state]);
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
            <span data-tone="memory">الاستقرار {state.echo.memoryStability}%</span>
            <span>المستوى {state.echo.level}</span>
            <span>التفاعلات {state.player.interactions}</span>
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

      <HudPanel
        className="shell-dashboard__personality"
        tone="memory"
        eyebrow="Emotion Visual System"
        title="الحالة النفسية"
      >
        <div className="shell-dashboard__stat-grid">
          {PERSONALITY_STATS.map((stat) => (
            <StatMeter
              key={stat.key}
              compact
              label={stat.label}
              value={model.personality[stat.key]}
              tone={stat.tone}
            />
          ))}
        </div>
      </HudPanel>

      <GlassPanel
        className="shell-dashboard__trajectory"
        tone="danger"
        eyebrow="Choice Pressure"
        title="اتجاه الحالة"
      >
        <div className="shell-dashboard__axis">
          <span>
            <small>الثقة</small>
            <strong>{model.personality.trust}</strong>
          </span>
          <i><b /></i>
          <span>
            <small>الفساد</small>
            <strong>{model.personality.corruption}</strong>
          </span>
        </div>
        <GameProgress value={model.personality.humanity} tone="progression" />
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
            variant="secondary"
            fullWidth
            onClick={() => navigate('puzzles')}
          >
            <GameIconLabel
              iconId="screen-puzzles"
              label="ابدأ اللغز التالي"
              description="فتح مساحة إعادة البناء الحالية"
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
