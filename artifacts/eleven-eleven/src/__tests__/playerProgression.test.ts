import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PlayerApiError } from '../../functions/api/player/_shared';
import {
  verifyXpRewardClaim,
} from '../../functions/api/player/_xpRewards';
import {
  CHAPTER_01_PUZZLES,
} from '../content/puzzles/chapter01Campaign';
import type {
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
} from '../domain/puzzles/campaignContracts';
import {
  MAX_PLAYER_LEVEL,
  PLAYER_XP_SOURCE_TYPES,
  createXpRewardKey,
  getPlayerLevelProgress,
  totalXpRequiredForLevel,
} from '../domain/player-progression/playerProgression';

function correctSubmission(
  definition: CampaignPuzzleDefinition,
): CampaignPuzzleProgress[] {
  return definition.stages.map((stage, stageIndex) => ({
    stageIndex,
    values: stage.mode === 'match' ? [] : [...stage.solution],
    matches: stage.mode === 'match' ? { ...stage.solution } : {},
  }));
}

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

  it('reserves every requested future source without activating it', () => {
    assert.deepEqual(PLAYER_XP_SOURCE_TYPES, [
      'puzzle',
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

  it('calculates puzzle XP on the server after validating the solution', () => {
    const puzzle = CHAPTER_01_PUZZLES[0];
    assert.ok(puzzle);
    const reward = verifyXpRewardClaim({
      sourceType: 'puzzle',
      sourceId: puzzle.id,
      proof: correctSubmission(puzzle),
    });

    assert.equal(reward.sourceId, puzzle.id);
    assert.equal(reward.rewardKey, `puzzle:${puzzle.id}:v1`);
    assert.equal(reward.xpAmount, 75);
    assert.deepEqual(reward.requiredRewardKeys, []);
  });

  it('rejects forged XP amounts and invalid puzzle proof', () => {
    const puzzle = CHAPTER_01_PUZZLES[0];
    assert.ok(puzzle);
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'puzzle',
        sourceId: puzzle.id,
        proof: correctSubmission(puzzle),
        amount: 999_999,
      }),
      (error) => (
        error instanceof PlayerApiError
        && error.code === 'client_xp_forbidden'
      ),
    );
    assert.throws(
      () => verifyXpRewardClaim({
        sourceType: 'puzzle',
        sourceId: puzzle.id,
        proof: [{ stageIndex: 0, values: ['wrong'], matches: {} }],
      }),
      (error) => (
        error instanceof PlayerApiError
        && error.code === 'reward_not_verified'
      ),
    );
  });
});
