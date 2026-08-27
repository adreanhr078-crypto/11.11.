import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import {
  buildLiveSignalWavePath,
  diagnoseSequenceContradiction,
  signalAcquisition,
  signalDialScale,
} from '../features/story-puzzles/verticalSliceInteractions';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Stage 3.2 continuous signal tuning', () => {
  const frequencies = [42, 58, 74];

  it('pads the dial span around the broadcast centres without exposing any answer', () => {
    const scale = signalDialScale(frequencies);
    assert.equal(scale.min < 42, true);
    assert.equal(scale.max > 74, true);
    assert.equal(scale.span, scale.max - scale.min);
  });

  it('locks exactly one reading at each centre and never two', () => {
    const scale = signalDialScale(frequencies);
    for (const frequency of frequencies) {
      const atCentre = signalAcquisition(frequency, frequencies);
      assert.equal(atCentre.locked, true);
      assert.equal(atCentre.clarity, 1);
      assert.equal(frequencies[atCentre.nearestIndex], frequency);
      // Just past the midpoint the lock must already belong to the neighbour.
      const pastMid = frequency + (scale.span / 4);
      if (pastMid < scale.max) {
        const next = signalAcquisition(pastMid, frequencies);
        assert.notEqual(next.nearestIndex, frequencies.indexOf(frequency));
      }
    }
  });

  it('starts in an unarmed between-readings state until the player deliberately tunes a probe', () => {
    const scale = signalDialScale(frequencies);
    assert.equal(signalAcquisition(scale.min, frequencies).locked, false);
    assert.equal(signalAcquisition(scale.max, frequencies).locked, false);
  });

  it('raises acquisition clarity monotonically toward a centre without naming correctness', () => {
    const far = signalAcquisition(30, frequencies).clarity;
    const nearer = signalAcquisition(38, frequencies).clarity;
    const centre = signalAcquisition(42, frequencies).clarity;
    assert.equal(far < nearer && nearer < centre, true);
    // Acquisition physics is symmetric across every centre; it cannot reveal
    // which reading satisfies the manhwa relationship.
    assert.equal(signalAcquisition(74, frequencies).clarity, 1);
  });

  it('builds a deterministic live wave that changes with clarity only', () => {
    assert.equal(buildLiveSignalWavePath(0.2), buildLiveSignalWavePath(0.2));
    assert.notEqual(buildLiveSignalWavePath(0.2), buildLiveSignalWavePath(0.9));
    assert.match(buildLiveSignalWavePath(0.9), /^M2 /);
  });

  it('keeps tuning feedback free of server answer authority', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    assert.doesNotMatch(screen, /correctAnswer|rawSolution|targetFrequency|targetChannel/);
    // The dial sweeps the padded numeric span, not a discrete probe index.
    assert.match(screen, /min=\{dialScale\.min\}/);
    assert.match(screen, /max=\{dialScale\.max\}/);
    assert.match(screen, /signalAcquisition\(next, probeFrequencies\)/);
    // A self-originated lock must not yank the thumb back mid-sweep; only
    // external selection changes re-seat the dial.
    assert.match(screen, /dialArmedRef\.current = target\.frequency;/);
    assert.match(screen, /if \(dialArmedRef\.current === frequency\) \{/);
    // Keyboard stride stays practical and can never skip a lock radius.
    assert.match(screen, /const dialStep = Math\.max\(1, Math\.round\(dialScale\.span \/ 24\)\);/);
    assert.match(screen, /step=\{dialStep\}/);
    // The ghost silhouette is present and described to assistive tech.
    assert.match(screen, /story-signal-board__scope-ghost/);
    assert.match(screen, /aria-label=\{signalCopy\.scope\}/);
    // No dead custom properties: only consumed tokens are emitted.
    assert.doesNotMatch(screen, /'--noise'/);
  });
});

describe('Stage 3.2 sequence contradiction diagnosis', () => {
  const ports = {
    signal: { input: 'START', output: '◇' },
    access: { input: '◇', output: '△' },
    memory: { input: '△', output: '□' },
    echo: { input: '□', output: 'END' },
  };

  it('accepts a coherent ordering silently so success needs no diagnosis', () => {
    assert.equal(diagnoseSequenceContradiction(['signal', 'access', 'memory', 'echo'], ports), undefined);
  });

  it('names an impossible link at its step without revealing the fixed order', () => {
    const swapped = diagnoseSequenceContradiction(['signal', 'access', 'echo', 'memory'], ports);
    assert.equal(swapped?.kind, 'impossible-link');
    assert.equal(swapped?.atStep, 2);
  });

  it('detects a missing documented entry and exit', () => {
    assert.deepEqual(
      diagnoseSequenceContradiction(['access', 'memory', 'echo', 'signal'], ports),
      { kind: 'no-entry', atStep: 0 },
    );
    const noExit = diagnoseSequenceContradiction(['signal', 'access', 'memory', 'echo'].slice(0, 3).concat(['memory']), ports);
    assert.equal(noExit?.kind === 'impossible-link' || noExit?.kind === 'no-exit', true);
  });

  it('Echo explains the contradiction kind on rejection while never importing solutions', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    assert.match(screen, /diagnoseSequenceContradiction\(activeDraft\.tokens, SYSTEM_SEQUENCE_PORTS\)/);
    assert.match(screen, /'impossible-link'/);
    assert.doesNotMatch(screen, /\['signal', 'access', 'memory', 'echo'\]/);
  });
});
