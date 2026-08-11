import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  liveDailyPeriodKeyFor,
  liveDailyTemplateFor,
  liveWeekIdFor,
  liveWeeklyTemplatesFor,
  parseLiveAction,
} from '../../functions/api/player/_liveChallenges';

describe('live challenge server windows', () => {
  it('changes the daily period at 11:11 UTC, not at a client-selected clock', () => {
    assert.equal(liveDailyPeriodKeyFor(Date.parse('2026-08-10T11:10:59.000Z')), '2026-08-09');
    assert.equal(liveDailyPeriodKeyFor(Date.parse('2026-08-10T11:11:00.000Z')), '2026-08-10');
  });

  it('uses a Monday-starting weekly recovery window', () => {
    assert.equal(liveWeekIdFor('2026-08-10'), '2026-08-10');
    assert.equal(liveWeekIdFor('2026-08-16'), '2026-08-10');
    assert.equal(liveWeekIdFor('2026-08-17'), '2026-08-17');
  });

  it('keeps daily and weekly challenge instances varied and deterministic', () => {
    const daily = Array.from({ length: 30 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return liveDailyTemplateFor(`2026-09-${day}`);
    });
    assert.equal(new Set(daily.map((template) => template.prompt)).size, 30);
    assert.deepEqual(liveDailyTemplateFor('2026-09-11'), liveDailyTemplateFor('2026-09-11'));

    const weekly = liveWeeklyTemplatesFor('2026-08-10');
    assert.equal(weekly.length, 4);
    assert.equal(new Set(weekly.map((template) => template.mechanic)).size, 4);
    assert.equal(new Set(weekly.map((template) => template.prompt)).size, 4);
  });

  it('rejects unknown actions and non-numeric hint indices at the boundary', async () => {
    await assert.rejects(
      () => parseLiveAction({ action: 'collect-client-reward' }),
      (error: unknown) => (
        error instanceof Error
        && 'code' in error
        && error.code === 'invalid_live_action'
      ),
    );
    await assert.rejects(
      () => parseLiveAction({ action: 'use-daily-hint', hintIndex: null }),
      (error: unknown) => (
        error instanceof Error
        && 'code' in error
        && error.code === 'invalid_hint'
      ),
    );
  });
});
