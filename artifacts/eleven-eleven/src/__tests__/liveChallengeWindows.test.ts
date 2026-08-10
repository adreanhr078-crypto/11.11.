import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  liveDailyPeriodKeyFor,
  liveWeekIdFor,
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
});
