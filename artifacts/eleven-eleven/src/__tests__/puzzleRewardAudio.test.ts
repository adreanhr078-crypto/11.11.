import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createRewardTonePlan,
} from '../infrastructure/audio/puzzleRewardAudio';

describe('puzzle and achievement reward audio', () => {
  it('creates a deterministic ascending completion signature', () => {
    const plan = createRewardTonePlan('puzzle', 0.7);
    assert.equal(plan.length, 4);
    assert.equal(plan[0]?.wave, 'triangle');
    assert.equal(
      plan.every((tone, index) => index === 0 || tone.frequency > plan[index - 1]!.frequency),
      true,
    );
    assert.equal(plan.at(-1)!.duration > plan[0]!.duration, true);
  });

  it('clamps unsafe volume and keeps muted plans silent', () => {
    assert.equal(
      createRewardTonePlan('rare', -2).every((tone) => tone.gain === 0),
      true,
    );
    assert.equal(
      createRewardTonePlan('system', 50).every((tone) => tone.gain <= 0.1),
      true,
    );
    assert.equal(
      createRewardTonePlan('standard', Number.NaN).every((tone) => tone.gain === 0),
      true,
    );
  });
});
