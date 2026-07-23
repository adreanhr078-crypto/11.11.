import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  ENDING_DEFINITIONS,
  MEMORY_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import { evaluateEndingEligibility } from '../../domain/narrative/endingEngine';

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre style={{
      margin: 0,
      overflow: 'auto',
      maxHeight: 160,
      whiteSpace: 'pre-wrap',
    }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function NarrativeDebugPanel() {
  const [open, setOpen] = useState(false);
  const echo = useGameStore((state) => state.echo.personality);
  const progression = useGameStore((state) => state.progression);
  const narrative = useGameStore((state) => state.narrative);

  const endingEligibility = useMemo(() => (
    evaluateEndingEligibility(ENDING_DEFINITIONS, {
      echo,
      progression,
      narrative,
    }).eligibility
  ), [echo, progression, narrative]);

  const unlockedMemories = useMemo(() => {
    const unlocked = new Set(narrative.unlockedMemoryIds);
    return MEMORY_DEFINITIONS
      .filter((memory) => unlocked.has(memory.id))
      .map((memory) => ({
        id: memory.id,
        title: memory.title.en,
        fragments: memory.fragments
          .filter((fragment) => (
            narrative.unlockedMemoryFragmentIds.includes(fragment.id)
          ))
          .map((fragment) => fragment.id),
      }));
  }, [narrative.unlockedMemoryIds, narrative.unlockedMemoryFragmentIds]);

  if (!import.meta.env.DEV) return null;

  return (
    <aside
      aria-label="Narrative debug panel"
      style={{
        position: 'fixed',
        zIndex: 9999,
        right: 12,
        bottom: 12,
        width: open ? 420 : 'auto',
        maxWidth: 'calc(100vw - 24px)',
        color: '#f7f7fb',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        fontSize: 12,
        direction: 'ltr',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(20, 10, 16, 0.92)',
          color: '#f7f7fb',
          borderRadius: 6,
          padding: '8px 10px',
          cursor: 'pointer',
        }}
      >
        Narrative Debug
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            maxHeight: '70vh',
            overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 6,
            background: 'rgba(8, 8, 12, 0.96)',
            boxShadow: '0 12px 42px rgba(0,0,0,0.45)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>
            Narrative State
          </h3>
          <section>
            <strong>Echo personality</strong>
            <JsonBlock value={echo} />
          </section>
          <section>
            <strong>Unlocked memories</strong>
            <JsonBlock value={unlockedMemories} />
          </section>
          <section>
            <strong>Active flags</strong>
            <JsonBlock value={narrative.activeFlags} />
          </section>
          <section>
            <strong>Decision history</strong>
            <JsonBlock value={narrative.decisionHistory} />
          </section>
          <section>
            <strong>Ending eligibility</strong>
            <JsonBlock value={endingEligibility} />
          </section>
        </div>
      )}
    </aside>
  );
}

