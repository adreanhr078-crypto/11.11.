import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameCard,
  GameProgress,
  GlassPanel,
  HudPanel,
  StatMeter,
} from '../../ui/design-system';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import { useShellStore } from '../../app/shell/shellStore';
import type { GameTone } from '../../ui/design-system';

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

  return (
    <div className="shell-screen shell-dashboard">
      <section className="shell-dashboard__portrait" aria-label="حالة Echo">
        <div className="shell-echo-portrait" aria-hidden="true">
          <span className="shell-echo-portrait__halo" />
          <span className="shell-echo-portrait__silhouette">
            <i className="shell-echo-portrait__eye shell-echo-portrait__eye--red" />
            <i className="shell-echo-portrait__eye shell-echo-portrait__eye--cyan" />
          </span>
          <span className="shell-echo-portrait__scan" />
        </div>
        <div className="shell-dashboard__identity">
          <small>ECHO MIND // A-17</small>
          <h1>Echo</h1>
          <p>الحالة النفسية متصلة بنظام العرض العاطفي.</p>
          <div className="shell-dashboard__status-row">
            <span data-tone="memory">● متصل</span>
            <span>المستوى {state.echo.level}</span>
            <span>الاستقرار {state.echo.memoryStability}%</span>
          </div>
        </div>
      </section>

      <HudPanel
        className="shell-dashboard__personality"
        tone="memory"
        eyebrow="Emotion Visual System"
        title="بصمة Echo النفسية"
        actions={<span className="shell-live-indicator">LIVE</span>}
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
        className="shell-dashboard__journey"
        tone="danger"
        eyebrow={model.chapter.id}
        title={model.chapter.title}
      >
        <p>{model.chapter.description}</p>
        <GameProgress
          value={model.puzzleProgress.progress}
          label="تقدم الرحلة"
          tone="danger"
        />
        <div className="shell-dashboard__chapter-meta">
          <span>
            <strong>{model.puzzleProgress.resolved}</strong>
            ألغاز محسومة
          </span>
          <span>
            <strong>{model.memory.fragments || model.memory.legacyCollected}</strong>
            شظايا مستعادة
          </span>
          <span>
            <strong>{model.decisions.length}</strong>
            قرارات مؤثرة
          </span>
        </div>
        <div className="shell-resource-row">
          <span><i data-tone="gold" />{model.resources.coins} عملة</span>
          <span><i data-tone="rare" />{model.resources.crystals} بلورة</span>
          <span><i data-tone="memory" />{model.resources.shards} شظية</span>
        </div>
        <GameButton
          variant="secondary"
          fullWidth
          onClick={() => navigate('puzzles')}
        >
          متابعة إعادة البناء
        </GameButton>
      </GlassPanel>

      <section className="shell-dashboard__cards">
        <GameCard
          tone="memory"
          overline="MEMORY NETWORK"
          title="الذكريات"
          description="تعريفات بيانات قابلة للتوسع مع حالات فتح مستقلة."
          footer={(
            <GameButton
              variant="memory"
              size="sm"
              onClick={() => navigate('memories')}
            >
              فتح الشبكة
            </GameButton>
          )}
        >
          <GameProgress
            value={model.memory.progress}
            showValue
            tone="memory"
          />
        </GameCard>
        <GameCard
          tone="rare"
          overline="ANIME EPISODE RUNTIME"
          title="المشهد السينمائي"
          description={
            model.cinematic.authoredEpisodes > 0
              ? `${model.cinematic.authoredEpisodes} حلقات متاحة`
              : 'المشغل جاهز لبيانات الحلقات والأصول.'
          }
          footer={(
            <GameButton
              variant="rare"
              size="sm"
              onClick={() => navigate('cinematic')}
            >
              فتح المشغل
            </GameButton>
          )}
        />
        <GameCard
          tone="danger"
          overline="DECISION LEDGER"
          title="الحوار والقرارات"
          description="كل اختيار مهم يُسجل ويؤثر في المشاهد والنهايات."
          footer={(
            <GameButton
              variant="secondary"
              size="sm"
              onClick={() => navigate('dialogue')}
            >
              تواصل مع Echo
            </GameButton>
          )}
        />
      </section>

      <HudPanel
        className="shell-dashboard__ledger"
        tone="danger"
        eyebrow="آخر التأثيرات"
        title="سجل القرارات"
      >
        {model.decisions.length > 0 ? (
          <ol className="shell-ledger-list">
            {model.decisions.map((decision) => (
              <li key={decision.id}>
                <span>{decision.source}</span>
                <strong>{decision.id}</strong>
                <small>{decision.choiceId}</small>
              </li>
            ))}
          </ol>
        ) : (
          <div className="shell-empty-inline">
            <span aria-hidden="true">◇</span>
            <p>لم تُسجل قرارات مصيرية بعد.</p>
          </div>
        )}
      </HudPanel>
    </div>
  );
}
