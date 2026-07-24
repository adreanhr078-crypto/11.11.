import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameProgress,
  HudPanel,
} from '../../ui/design-system';
import { createMemoryScreenReadModel } from '../../application/ui/gameUiReadModels';
import { ENVIRONMENT_PRESENTATION_ASSETS } from '../../ui/presentation';

export default function MemoryScreen() {
  const state = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState(0);
  const model = useMemo(() => createMemoryScreenReadModel(state), [state]);
  const authoredFragments = model.items.reduce(
    (total, item) => total + item.definition.fragments.length,
    0,
  );

  return (
    <div className="shell-screen shell-memory-screen shell-memory-screen--reconstruction">
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

      <div className="core5-memory-workspace">
        <aside className="core5-memory-fragments">
          <header>
            <small>FRAGMENT BUFFER</small>
            <strong>الشظايا</strong>
            <span>{model.fragmentCount}/{authoredFragments || '—'}</span>
          </header>
          <div>
            {Array.from({ length: 5 }, (_, index) => (
              <button
                key={index}
                type="button"
                data-active={selectedSlot === index}
                onClick={() => setSelectedSlot(index)}
                aria-label={`شظية ${index + 1}`}
              >
                <i />
                <span>FRG-{String(index + 1).padStart(2, '0')}</span>
                <small>{index === selectedSlot ? 'SCANNING' : 'LOCKED'}</small>
              </button>
            ))}
          </div>
        </aside>

        <HudPanel
          className="core5-memory-reconstruction"
          tone="memory"
          eyebrow="PUZZLE MEMORY RECONSTRUCTION"
          title={`MEMORY_SLOT_${String(selectedSlot + 1).padStart(2, '0')}`}
          actions={<span className="shell-live-indicator">LINK READY</span>}
        >
          <div
            className="core5-memory-reconstruction__scene"
            style={{
              backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
            }}
          >
            <span className="core5-memory-reconstruction__scan" />
            <div className="core5-memory-reconstruction__subject" aria-hidden="true">
              <span /><span /><span />
              <i>◈</i>
            </div>
            <div className="core5-memory-reconstruction__telemetry">
              <span>SYNC // {state.echo.memoryStability}%</span>
              <span>NO AUTHORED MEMORY</span>
            </div>
          </div>

          <div className="core5-memory-puzzle" aria-label="شبكة إعادة البناء">
            {Array.from({ length: 12 }, (_, index) => (
              <button
                key={index}
                type="button"
                data-linked={index <= selectedSlot * 2}
                onClick={() => setSelectedSlot(index % 5)}
                aria-label={`قطعة إعادة بناء ${index + 1}`}
              >
                <span />
                <i>{String(index + 1).padStart(2, '0')}</i>
              </button>
            ))}
          </div>

          <div className="core5-memory-reconstruction__progress">
            <GameProgress
              value={state.echo.personality.memoriesRecovered}
              label="اكتمال الاستعادة"
              tone="memory"
            />
            <GameProgress
              value={100 - state.echo.personality.corruption}
              label="سلامة الإشارة"
              tone="progression"
            />
          </div>
        </HudPanel>

        <aside className="core5-memory-index">
          <header>
            <small>MEMORY INDEX</small>
            <strong>سجل الذاكرة</strong>
          </header>
          <div>
            {(model.items.length > 0
              ? model.items.slice(0, 5)
              : Array.from({ length: 5 }, () => null)
            ).map((item, index) => (
              <button
                key={item?.definition.id ?? `memory-slot-${index}`}
                type="button"
                data-active={selectedSlot === index}
                data-locked={!item?.unlocked}
                onClick={() => setSelectedSlot(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <i>{item?.unlocked ? '◈' : '◇'}</i>
                <span>
                  <strong>
                    {item?.definition.title.ar ?? `MEMORY_SLOT_${String(index + 1).padStart(2, '0')}`}
                  </strong>
                  <small>
                    {item?.unlocked ? 'RECOVERED' : 'ENCRYPTED'}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <section className="core5-memory-timeline" aria-label="سجل الاكتشاف">
        <header>
          <small>MEMORY TIMELINE</small>
          <strong>خط الاستعادة</strong>
        </header>
        <div>
          {(model.timeline.length > 0
            ? model.timeline.slice(0, 5)
            : Array.from({ length: 5 }, () => null)
          ).map((event, index) => (
            <article key={event?.id ?? `timeline-slot-${index}`}>
              <i data-active={Boolean(event)} />
              <span>
                <small>{event?.time ?? `T-${String(index + 1).padStart(2, '0')}`}</small>
                <strong>{event?.description ?? 'بانتظار إشارة ذاكرة'}</strong>
              </span>
            </article>
          ))}
        </div>
        <p>
          مصدر المحتوى:
          <code> data/memories/index.json </code>
        </p>
      </section>
    </div>
  );
}
