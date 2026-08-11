import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SMART_MECHANIC_ROTATION,
  SMART_WEEKLY_STAGE_COUNT,
  type SmartMechanic,
  isSmartLiveTemplateValid,
  smartLiveFingerprint,
  smartLiveTemplateFor,
} from '../domain/live-challenges/smartLivePuzzleGenerator';

describe('smart live puzzle generator', () => {
  it('creates deterministic, materially distinct daily instances without a 1000-item pool', () => {
    const first = smartLiveTemplateFor('2026-08-11', 'daily');
    const repeat = smartLiveTemplateFor('2026-08-11', 'daily');
    const generatedDays = Array.from({ length: 1096 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10);
      return smartLiveTemplateFor(date, 'daily');
    });
    assert.deepEqual(first, repeat);
    assert.equal(new Set(generatedDays.map(smartLiveFingerprint)).size, generatedDays.length);
    assert.ok(generatedDays.every(isSmartLiveTemplateValid));
    assert.equal(new Set(generatedDays.map((template) => template.mechanic)).size, SMART_MECHANIC_ROTATION.length);
  });

  it('varies weekly mechanics and eventually exercises the full mechanic family', () => {
    const weeks = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, 5 + index * 7)).toISOString().slice(0, 10);
      return Array.from({ length: SMART_WEEKLY_STAGE_COUNT }, (_, stage) => (
        smartLiveTemplateFor(date, 'weekly', stage)
      ));
    }).flat();
    assert.ok(weeks.every(isSmartLiveTemplateValid));
    assert.ok(new Set(weeks.map((template) => template.mechanic)).size >= SMART_MECHANIC_ROTATION.length - 1);
    for (let index = 0; index < weeks.length; index += SMART_WEEKLY_STAGE_COUNT) {
      assert.equal(new Set(weeks.slice(index, index + SMART_WEEKLY_STAGE_COUNT).map((template) => template.mechanic)).size, SMART_WEEKLY_STAGE_COUNT);
    }
  });

  it('keeps the account reward sealed until verified weekly completion', () => {
    const stages = Array.from({ length: SMART_WEEKLY_STAGE_COUNT }, (_, stage) => (
      smartLiveTemplateFor('2026-08-10', 'weekly', stage)
    ));
    assert.equal(stages[0]!.reward.tier, 'rare');
    assert.equal(stages[0]!.reward.kind, 'sealed');
    const hasCoreMemorySet = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, 5 + index * 7)).toISOString().slice(0, 10);
      return new Set(Array.from({ length: SMART_WEEKLY_STAGE_COUNT }, (_, stage) => (
        smartLiveTemplateFor(date, 'weekly', stage).mechanic
      )));
    }).some((set) => (['memory-fragment', 'wiring', 'cipher'] as SmartMechanic[]).every((mechanic) => set.has(mechanic)));
    assert.ok(hasCoreMemorySet);
  });

  it('builds image pieces and wiring answers from visible, valid evidence', () => {
    const samples = Array.from({ length: 180 }, (_, index) => {
      const date = new Date(Date.UTC(2027, 0, 1 + index)).toISOString().slice(0, 10);
      return smartLiveTemplateFor(date, 'daily');
    });
    const memories = samples.filter((template) => template.mechanic === 'memory-fragment');
    const wirings = samples.filter((template) => template.mechanic === 'wiring');
    assert.ok(memories.length > 0);
    assert.ok(wirings.length > 0);
    for (const template of memories) {
      assert.doesNotMatch(JSON.stringify(template.visual), /NaN/);
    }
    for (const template of wirings) {
      assert.equal(isSmartLiveTemplateValid(template), true);
      const visual = template.visual.kind === 'wiring' ? template.visual : null;
      assert.ok(visual);
      for (const pair of template.answer.split('|')) {
        const [sourceId, targetId] = pair.split('=');
        assert.equal(
          visual.sources.find((source) => source.id === sourceId)?.signature,
          visual.targets.find((target) => target.id === targetId)?.signature,
        );
      }
    }
  });

  it('creates exactly one visible anomaly and one valid load-balance choice', () => {
    const generated = Array.from({ length: 240 }, (_, index) => {
      const date = new Date(Date.UTC(2028, 0, 1 + index)).toISOString().slice(0, 10);
      return smartLiveTemplateFor(date, 'daily');
    });
    const patterns = generated.filter((template) => template.mechanic === 'pattern-scan');
    const balances = generated.filter((template) => template.mechanic === 'load-balance');
    assert.ok(patterns.length > 0);
    assert.ok(balances.length > 0);
    for (const template of patterns) {
      const visual = template.visual.kind === 'choice' ? template.visual : null;
      assert.equal(visual?.items.filter((item) => item.detail === '◇').length, 1);
    }
    for (const template of balances) {
      const valid = template.options.filter((option) => {
        const values = Object.fromEntries(option.split('|').map((part) => {
          const [key, value] = part.split(':');
          return [key, Number(value)];
        }));
        return values.A === 40 && values.B === values.C + 10
          && values.A + values.B + values.C === 100;
      });
      assert.deepEqual(valid, [template.answer]);
    }
  });
});
