import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createProgressScreenReadModel } from '../../application/ui/gameUiReadModels';

export default function ProgressScreen() {
  const state = useGameStore();
  const model = useMemo(() => createProgressScreenReadModel(state), [state]);

  return (
    <div className="shell-screen shell-progress-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">08</span>
        <span>
          <small>JOURNEY PROGRESS</small>
          <h1>تقدم الرحلة</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span>{model.resolvedPuzzles}/{model.totalPuzzles} ألغاز</span>
          <span>{model.memoriesUnlocked} ذكريات</span>
        </div>
      </header>

      <div className="shell-progress-screen__grid">
        <HudPanel
          className="shell-progress-screen__summary"
          tone="progression"
          eyebrow="Canonical Progress"
          title="الملخص العام"
        >
          <GameProgress
            value={model.totalPuzzles > 0
              ? Math.round((model.resolvedPuzzles / model.totalPuzzles) * 100)
              : 0}
            label="تقدم الألغاز"
            tone="danger"
          />
          <GameProgress
            value={model.achievementsTotal > 0
              ? Math.round((model.achievementsUnlocked / model.achievementsTotal) * 100)
              : 0}
            label="الإنجازات"
            tone="progression"
          />
          <GameProgress
            value={model.endingsTotal > 0
              ? Math.round((model.endingsEligible / model.endingsTotal) * 100)
              : 0}
            label="أهلية النهايات"
            tone="rare"
          />
        </HudPanel>

        <section className="shell-progress-screen__stats">
          <GlassPanel tone="danger" title="القرارات">
            <strong>{model.decisions}</strong>
            <p>قرارات محفوظة داخل Decision Ledger.</p>
          </GlassPanel>
          <GlassPanel tone="memory" title="الذكريات">
            <strong>{model.fragmentsUnlocked}</strong>
            <p>شظايا مفتوحة داخل الشبكة السردية.</p>
          </GlassPanel>
          <GlassPanel tone="progression" title="الإنجازات">
            <strong>{model.achievementsUnlocked}</strong>
            <p>إنجازات مفتوحة من أصل {model.achievementsTotal}.</p>
          </GlassPanel>
          <GlassPanel tone="rare" title="النهايات">
            <strong>{model.endingsSeen}</strong>
            <p>نهايات مرئية و{model.endingsEligible} مؤهلة الآن.</p>
          </GlassPanel>
        </section>
      </div>

      <HudPanel
        className="shell-progress-screen__events"
        tone="memory"
        eyebrow="Recent Signals"
        title="آخر الأحداث"
      >
        <div className="shell-progress-screen__event-list">
          {model.recentEvents.length > 0 ? (
            model.recentEvents.map((event) => (
              <article key={event.id}>
                <strong>{event.label}</strong>
                <small>{event.meta}</small>
              </article>
            ))
          ) : (
            <p className="shell-inline-empty">
              سيظهر هنا سجل القرارات والأحداث فور بدء التقدم الفعلي.
            </p>
          )}
        </div>
      </HudPanel>
    </div>
  );
}
