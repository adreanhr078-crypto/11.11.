import { useEffect, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useCollectionStore } from '../collection/collectionStore';
import {
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { Lock, RotateCcw, ScanLine, Sparkles } from 'lucide-react';
import { createProgressScreenReadModel } from '../../application/ui/gameUiReadModels';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import { localizeCollectionAchievement } from '../../domain/collection/collectionPresentation';

export default function ProgressScreen() {
  const state = useGameStore();
  const storyPuzzleSnapshot = useStoryPuzzleStore((store) => store.snapshot);
  const collection = useCollectionStore((store) => store.snapshot);
  const collectionStatus = useCollectionStore((store) => store.status);
  const collectionError = useCollectionStore((store) => store.error);
  const collectionActions = useCollectionStore((store) => store.actions);
  const locale = useUiPreferencesStore((store) => store.locale);
  useEffect(() => {
    if (collectionStatus === 'idle') void collectionActions.load();
  }, [collectionActions, collectionStatus]);
  const model = useMemo(
    () => createProgressScreenReadModel(state, storyPuzzleSnapshot),
    [state, storyPuzzleSnapshot],
  );
  const canonicalAchievements = collection?.achievements ?? [];
  const canonicalAchievementsUnlocked = canonicalAchievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  const canonicalAchievementsTotal = collection
    ? canonicalAchievements.length
    : model.achievementsTotal;

  return (
    <div className="shell-screen shell-progress-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">08</span>
        <span>
          <small>JOURNEY PROGRESS</small>
          <h1>تقدم الرحلة</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span><bdi dir="ltr">{model.resolvedPuzzles} / {model.totalPuzzles}</bdi> ألغاز</span>
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
            value={canonicalAchievementsTotal > 0
              ? Math.round((canonicalAchievementsUnlocked / canonicalAchievementsTotal) * 100)
              : 0}
            label="الإنجازات"
            tone="progression"
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
            <strong>{canonicalAchievementsUnlocked}</strong>
            <p>إنجازات مفتوحة من أصل {canonicalAchievementsTotal}.</p>
          </GlassPanel>
          <GlassPanel tone="rare" title="الاستعادة الموثقة">
            <strong>{collection?.systemRecovery.percent ?? 0}%</strong>
            <p>نسبة التقدم المثبت من الخادم.</p>
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

      {collection && (
        <section className="collection-hub" aria-label="11.11 recovery collection">
          <HudPanel
            className="collection-hub__recovery"
            tone="danger"
            eyebrow="11.11 DATABASE // RECOVERY SYSTEM"
            title="SYSTEM RECOVERY"
          >
            <div className="collection-hub__recovery-value">
              <strong>{collection.systemRecovery.percent}%</strong>
              <span>VERIFIED COLLECTION RECOVERED</span>
            </div>
            <GameProgress value={collection.systemRecovery.percent} tone="danger" label="SYSTEM RECOVERY" />
            <div className="collection-hub__recovery-grid">
              <span>STORY <b>{collection.systemRecovery.story}%</b></span>
              <span>PUZZLES <b>{collection.systemRecovery.puzzles}%</b></span>
              <span>MEMORY <b>{collection.systemRecovery.memory}%</b></span>
              <span>ARCHIVE <b>{collection.systemRecovery.archive}%</b></span>
            </div>
          </HudPanel>

          <GlassPanel className="collection-hub__shards" tone="memory" title="MEMORY SHARDS">
            <div className="collection-hub__counter"><strong dir="ltr">{collection.shardCount} / {collection.totalShards}</strong><small>UNIQUE VERIFIED SHARDS</small></div>
            <div className="collection-hub__sets">
              {collection.memorySets.map((set) => (
                <article key={set.chapterId} data-complete={set.complete}>
                  <header><span>CHAPTER {set.order.toString().padStart(2, '0')}</span><b dir="ltr">{set.collected} / {set.total}</b></header>
                  <div className="collection-hub__shard-slots" aria-label={`Chapter ${set.order} shards`}>
                    {Array.from({ length: set.total }, (_, index) => (
                      <i key={index} data-collected={index < set.collected} aria-hidden="true">{index < set.collected ? '◆' : '◇'}</i>
                    ))}
                  </div>
                  {set.reconstructed ? (
                    <small className="collection-hub__status">MEMORY SLOT OPEN // NEEDS OWNER CONTENT</small>
                  ) : set.reconstructionAvailable ? (
                    <button type="button" onClick={() => void collectionActions.reconstruct(set.chapterId)}>
                      <RotateCcw aria-hidden="true" /> RECONSTRUCT
                    </button>
                  ) : (
                    <small className="collection-hub__status">{set.complete ? 'SYNC READY' : 'UNKNOWN / CORRUPTED'}</small>
                  )}
                </article>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="collection-hub__signals" tone="rare" title="SECRET SIGNALS">
            <div className="collection-hub__counter"><strong dir="ltr">{collection.secretSignals.filter((signal) => signal.discovered).length} / {collection.secretSignals.length}</strong><small>DISCOVERY RECORDS</small></div>
            <div className="collection-hub__signal-list">
              {collection.secretSignals.map((signal) => (
                <div key={signal.id} data-discovered={signal.discovered}>
                  {signal.discovered ? <ScanLine aria-hidden="true" /> : <Lock aria-hidden="true" />}
                  <span>{signal.discovered ? signal.label : 'CLASSIFIED SIGNAL'}</span>
                  <small>{signal.discovered ? 'VERIFIED' : '???'}</small>
                </div>
              ))}
            </div>
            <p className="collection-hub__note">Secrets Found remains separate from Memory Shards and uses only canonical Memory Fragment receipts.</p>
          </GlassPanel>

          <GlassPanel className="collection-hub__achievements" tone="progression" title="ACHIEVEMENTS // SYSTEM RECORDS">
            <div className="collection-hub__counter"><strong dir="ltr">{collection.achievements.filter((achievement) => achievement.unlocked).length} / {collection.achievements.length}</strong><small>UNLOCKED RECORDS</small></div>
            <div className="collection-hub__achievement-list">
              {collection.achievements.map((achievement) => {
                const copy = localizeCollectionAchievement(achievement, locale);
                return (
                  <article key={achievement.id} data-unlocked={achievement.unlocked} data-tier={achievement.presentationTier}>
                    <span aria-hidden="true">{achievement.unlocked ? achievement.icon : '???'}</span>
                    <div>
                      <strong>{achievement.unlocked ? copy.name : (locale === 'ar' ? 'سجل مصنف' : 'CLASSIFIED RECORD')}</strong>
                      <small>{achievement.unlocked ? copy.description : (locale === 'ar' ? 'البيانات غير متاحة' : 'DATA UNAVAILABLE')}</small>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="collection-hub__note"><Sparkles aria-hidden="true" /> Hidden records stay CLASSIFIED until verified.</p>
          </GlassPanel>
        </section>
      )}
      {collectionStatus === 'error' && <p className="shell-inline-empty" role="alert">{collectionError}</p>}
    </div>
  );
}
