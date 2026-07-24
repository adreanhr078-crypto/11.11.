import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameCard,
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createMemoryScreenReadModel } from '../../application/ui/gameUiReadModels';

export default function MemoryScreen() {
  const state = useGameStore();
  const model = useMemo(() => createMemoryScreenReadModel(state), [state]);
  const authoredFragments = model.items.reduce(
    (total, item) => total + item.definition.fragments.length,
    0,
  );

  return (
    <div className="shell-screen shell-memory-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>MEMORY RECONSTRUCTION</small>
          <h1>شبكة الذاكرة</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span>{model.unlockedCount}/{model.items.length} ذكريات</span>
          <span>{model.fragmentCount}/{authoredFragments} شظايا</span>
        </div>
      </header>

      <HudPanel
        className="shell-memory-screen__core"
        tone="memory"
        eyebrow="ECHO MEMORY CORE"
        title="استقرار الذاكرة"
      >
        <div className="shell-memory-orbit" aria-hidden="true">
          <span /><span /><span />
          <i />
        </div>
        <div>
          <GameProgress
            value={state.echo.personality.memoriesRecovered}
            label="الذكريات المستعادة"
            tone="memory"
          />
          <GameProgress
            value={100 - state.echo.personality.corruption}
            label="سلامة النواة"
            tone="progression"
          />
        </div>
      </HudPanel>

      {model.items.length > 0 && (
        <section className="shell-memory-grid">
          {model.items.map((item) => (
            <GameCard
              key={item.definition.id}
              tone={item.unlocked ? 'memory' : 'neutral'}
              locked={!item.unlocked}
              overline={item.definition.chapterId}
              title={item.definition.title.ar}
              description={
                item.unlocked
                  ? item.definition.description.ar
                  : 'بيانات الذاكرة مشفرة.'
              }
              footer={(
                <span>
                  {item.unlockedFragments}/{item.definition.fragments.length}
                  {' '}شظايا
                </span>
              )}
            />
          ))}
        </section>
      )}

      {model.isAuthoredContentEmpty && (
        <GlassPanel
          className="shell-editor-empty"
          tone="memory"
          title="قناة البيانات جاهزة"
        >
          <span className="shell-editor-empty__glyph">◈</span>
          <p>
            لا توجد ذكريات قصصية نهائية الآن. يمكن للمحررين إضافة آلاف
            الذكريات والشظايا عبر
            <code> data/memories/index.json </code>
            دون تعديل مكونات الواجهة.
          </p>
        </GlassPanel>
      )}

      <GlassPanel
        className="shell-memory-screen__timeline"
        tone="neutral"
        title="سجل الاكتشاف"
      >
        {model.timeline.length > 0 ? (
          <ol className="shell-memory-timeline">
            {model.timeline.map((event) => (
              <li key={event.id}>
                <time>{event.time}</time>
                <strong>{event.description}</strong>
                <small>{event.type}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="shell-muted-copy">
            ستظهر أحداث الذاكرة هنا عند وصولها من الأنظمة الحالية.
          </p>
        )}
      </GlassPanel>
    </div>
  );
}

