import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PlayerApiError } from '../../functions/api/player/_shared';
import {
  verifyXpRewardClaim,
} from '../../functions/api/player/_xpRewards';
import {
  MAX_PLAYER_LEVEL,
  PLAYER_XP_SOURCE_TYPES,
  createXpRewardKey,
  getPlayerLevelProgress,
  totalXpRequiredForLevel,
} from '../domain/player-progression/playerProgression';

describe('server-authoritative player progression', () => {
  it('derives level from total XP with one shared deterministic curve', () => {
    assert.equal(getPlayerLevelProgress(0).level, 1);
    assert.equal(getPlayerLevelProgress(99).level, 1);
    assert.equal(getPlayerLevelProgress(100).level, 2);
    assert.equal(getPlayerLevelProgress(399).level, 2);
    assert.equal(getPlayerLevelProgress(400).level, 3);
    assert.equal(
      getPlayerLevelProgress(Number.MAX_SAFE_INTEGER).level,
      MAX_PLAYER_LEVEL,
    );
    assert.equal(totalXpRequiredForLevel(10), 8_100);
  });

  it('keeps the verified Manhwa source in the shared XP source contract', () => {
    assert.deepEqual(PLAYER_XP_SOURCE_TYPES, [
      'puzzle',
      'manhwa',
      'story',
      'secret',
      'achievement',
      'daily_trial',
      'online_chess',
    ]);
    assert.equal(
      createXpRewardKey('online_chess', 'match-01'),
      'online_chess:match-01:v1',
    );
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'online_chess',
        sourceId: 'match-01',
        proof: {},
      }),
      (error) => (
        error instanceof PlayerApiError
        && error.code === 'reward_source_not_active'
      ),
    );
  });

  it('keeps the retired puzzle claim endpoint closed', () => {
    assert.throws(() => verifyXpRewardClaim({
      sourceType: 'puzzle',
      sourceId: 'story_puzzle_01_signal_calibration',
      proof: {},
    }), (error) => error instanceof PlayerApiError
      && error.code === 'reward_source_not_active');
  });

  it('validates Manhwa chapter completion against the official final page range', () => {
    const reward = verifyXpRewardClaim({
      sourceType: 'manhwa',
      sourceId: 'chapter_1',
      proof: { finalPageNumber: 11 },
    });
    assert.equal(reward.sourceType, 'manhwa');
    assert.equal(reward.xpAmount, 100);
    assert.equal(reward.rewardKey, 'manhwa:chapter_1:v1');
    assert.deepEqual(reward.requiredRewardKeys, []);

    const secondChapter = verifyXpRewardClaim({
      sourceType: 'manhwa',
      sourceId: 'chapter_2',
      proof: { finalPageNumber: 28 },
    });
    assert.equal(secondChapter.xpAmount, 150);
    assert.deepEqual(secondChapter.requiredRewardKeys, ['manhwa:chapter_1:v1']);
  });

  it('rejects chapter claims before the chapter end and never accepts client XP', () => {
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'manhwa',
        sourceId: 'chapter_1',
        proof: { finalPageNumber: 10 },
      }),
      (error) => error instanceof PlayerApiError
        && error.code === 'reward_not_verified',
    );
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'manhwa',
        sourceId: 'chapter_1',
        proof: { finalPageNumber: 11 },
        totalXp: 999_999,
      }),
      (error) => error instanceof PlayerApiError
        && error.code === 'client_xp_forbidden',
    );
  });

  it('rejects forged XP amounts before routing to any reward validator', () => {
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'puzzle',
        sourceId: 'story_puzzle_01_signal_calibration',
        proof: {},
        amount: 999_999,
      }),
      (error) => (
        error instanceof PlayerApiError
        && error.code === 'client_xp_forbidden'
      ),
    );
  });
});
