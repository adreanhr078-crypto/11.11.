import { useEffect, useRef } from 'react';

interface OpeningMemoryBeatProps {
  reducedMotion: boolean;
  onComplete: () => void;
}

/** A short memory beat. It grants nothing; the room receipt still does that. */
export function OpeningMemoryBeat({
  reducedMotion,
  onComplete,
}: OpeningMemoryBeatProps) {
  const completedRef = useRef(false);
  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, reducedMotion ? 850 : 9_600);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <section
      className={`opening-memory-beat ${reducedMotion ? 'is-reduced' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-memory-beat-title"
    >
      <div className="opening-memory-beat__signal" aria-hidden="true">
        <span />
        <i />
        <b />
      </div>
      <small>MEMORY BEAT // 11:11</small>
      <h2 id="opening-memory-beat-title">A shape returns before a name.</h2>
      <p>Echo does not explain it yet. The room leaves one trace behind.</p>
      <button type="button" onClick={finish}>Skip scene</button>
    </section>
  );
}
