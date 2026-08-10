import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LIVE_TEMPLATE_POOL,
  chooseRotatingTemplate,
  isLiveAnswerCorrect,
  stableHash,
  validateLiveTemplate,
} from '../domain/live-challenges/liveChallengeEngine';

describe('live challenge engine', () => {
  it('keeps authored templates solvable without runtime AI', () => {
    assert.ok(LIVE_TEMPLATE_POOL.length >= 5);
    assert.equal(LIVE_TEMPLATE_POOL.every(validateLiveTemplate), true);
    assert.equal(LIVE_TEMPLATE_POOL.every((template) => template.options.includes(template.answer)), true);
  });

  it('is deterministic and rotates consecutive mechanics', () => {
    const first = chooseRotatingTemplate('live:2026-08-10');
    const repeat = chooseRotatingTemplate('live:2026-08-10');
    const next = chooseRotatingTemplate('live:2026-08-11', first.mechanic);
    assert.deepEqual(repeat, first);
    assert.notEqual(next.mechanic, first.mechanic);
    assert.equal(stableHash('same-seed'), stableHash('same-seed'));
  });

  it('normalizes answers but does not accept a different answer', () => {
    assert.equal(isLiveAnswerCorrect('  signal ', 'SIGNAL'), true);
    assert.equal(isLiveAnswerCorrect('signal-x', 'SIGNAL'), false);
  });
});
