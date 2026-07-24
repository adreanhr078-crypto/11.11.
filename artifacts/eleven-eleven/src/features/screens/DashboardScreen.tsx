import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
  StatMeter,
} from '../../ui/design-system';
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

const SYSTEM_CHANNELS = [
  { id: 'dashboard' as const, code: '◉', label: 'الرئيسية' },
  { id: 'memories' as const, code: '✦', label: 'الذكريات' },
  { id: 'puzzles' as const, code: '⬡', label: 'إعادة البناء' },
  { id: 'dialogue' as const, code: '⌁', label: 'التواصل' },
  { id: 'cinematic' as const, code: '▷', label: 'المشاهد' },
  { id: 'settings' as const, code: '⚙', label: 'الإعدادات' },
];

export default function DashboardScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const model = useMemo(() => createDashboardReadModel(state), [state]);

  return (
    <div className="shell-screen shell-dashboard shell-dashboard--echo-system">
      <aside className="shell-dashboard__side-menu" aria-label="قنوات النظام">
        <header>
          <span>11:11</span>
          <strong>النظام الرئيسي</strong>
          <small>SYSTEM CHANNELS</small>
        </header>
        <nav>
          {SYSTEM_CHANNELS.map((channel) => (
            <button
              key={channel.id}
              type="button"
              data-active={channel.id === 'dashboard'}
              onClick={() => navigate(channel.id)}
            >
              <i>{channel.code}</i>
              <span>{channel.label}</span>
            </button>
          ))}
        </nav>
        <div className="shell-dashboard__side-signal">
          <i />
          <span>
            <small>CONNECTION</small>
            <strong>STABLE</strong>
          </span>
        </div>
      </aside>

      <section className="shell-dashboard__echo-core" aria-label="حالة Echo">
        <div className="shell-dashboard__core-header">
          <span>
            <small>ECHO MIND</small>
            <strong>A-17 // ONLINE</strong>
          </span>
          <span className="shell-live-indicator">LIVE SIGNAL</span>
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
          <small>ECHO MIND // A-17</small>
          <h1>Echo</h1>
          <p>البصمة العاطفية متصلة بطبقة العرض السينمائي.</p>
          <div className="shell-dashboard__status-row">
            <span data-tone="memory">● متصل</span>
            <span>المستوى {state.echo.level}</span>
            <span>الاستقرار {state.echo.memoryStability}%</span>
          </div>
        </div>

        <div className="shell-dashboard__memory-timeline">
          <header>
            <span>
              <small>MEMORY TIMELINE</small>
              <strong>الذكريات المتصلة</strong>
            </span>
            <span>{model.memory.unlocked}/{model.memory.totalDefinitions || '—'}</span>
          </header>
          <div>
            {Array.from({ length: 5 }, (_, index) => (
              <button
                key={index}
                type="button"
                data-locked
                onClick={() => navigate('memories')}
                aria-label={`خانة ذاكرة ${index + 1}`}
              >
                <i>{String(index + 1).padStart(2, '0')}</i>
                <span>MEM-—</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <HudPanel
        className="shell-dashboard__personality"
        tone="memory"
        eyebrow="EMOTION VISUAL SYSTEM"
        title="الحالة النفسية"
        actions={<span className="shell-live-indicator">SYNC</span>}
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
        eyebrow="TRANSFORMATION VECTOR"
        title="نقطة التحول"
      >
        <div className="shell-dashboard__axis">
          <span>
            <small>ANGER</small>
            <strong>{model.personality.anger}</strong>
          </span>
          <i><b /></i>
          <span>
            <small>TRUST</small>
            <strong>{model.personality.trust}</strong>
          </span>
        </div>
        <GameProgress value={model.personality.corruption} tone="danger" />
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
            عقد محسومة
          </span>
          <span>
            <strong>{model.memory.fragments || model.memory.legacyCollected}</strong>
            شظايا
          </span>
          <span>
            <strong>{model.decisions.length}</strong>
            قرارات
          </span>
        </div>
        <GameButton
          variant="secondary"
          fullWidth
          onClick={() => navigate('puzzles')}
        >
          متابعة الرحلة
        </GameButton>
      </HudPanel>
    </div>
  );
}
