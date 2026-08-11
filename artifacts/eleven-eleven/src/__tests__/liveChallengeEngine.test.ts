import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LIVE_TEMPLATE_POOL,
  chooseRotatingTemplate,
  createLiveTemplateForSlot,
  isLiveAnswerCorrect,
  liveTemplateFingerprint,
  liveTemplateMaterialFingerprint,
  stableHash,
  validateLiveTemplate,
} from '../domain/live-challenges/liveChallengeEngine';

describe('live challenge engine', () => {
  it('keeps authored templates solvable without runtime AI', () => {
    assert.equal(LIVE_TEMPLATE_POOL.length, 10);
    assert.equal(new Set(LIVE_TEMPLATE_POOL.map((template) => template.mechanic)).size, 10);
    assert.equal(LIVE_TEMPLATE_POOL.every(validateLiveTemplate), true);
    assert.equal(LIVE_TEMPLATE_POOL.every((template) => template.options.includes(template.answer)), true);
    assert.equal(LIVE_TEMPLATE_POOL.every((template) => template.hints.length === 3), true);
    assert.equal(LIVE_TEMPLATE_POOL.every((template) => template.hints.every((hint) => !/UNAVAILABLE/i.test(hint))), true);
  });

  it('does not repeat an exact daily challenge across a full year', () => {
    const templates = Array.from({ length: 366 }, (_, index) => (
      createLiveTemplateForSlot(`daily:2026:${index}`, index)
    ));
    assert.equal(
      new Set(templates.map(liveTemplateFingerprint)).size,
      templates.length,
    );
    assert.equal(
      new Set(templates.map(liveTemplateMaterialFingerprint)).size,
      templates.length,
    );
    for (let index = 0; index <= templates.length - 10; index += 1) {
      assert.equal(
        new Set(templates.slice(index, index + 10).map((template) => template.mechanic)).size,
        10,
      );
    }
    for (const template of templates.filter(({ mechanic }) => mechanic === 'routing')) {
      const costs = [...template.prompt.matchAll(/[ABC]:(\d+)/g)]
        .map((match) => Number(match[1]));
      assert.equal(costs.length, 3);
      assert.equal(new Set(costs).size, 3);
    }
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
