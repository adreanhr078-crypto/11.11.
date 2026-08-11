import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  WEEKLY_REWARD_PREVIEW,
  weeklyRewardPlanFor,
} from '../domain/live-challenges/weeklyRewardCatalog';

describe('weekly rare reward sequence', () => {
  it('alternates unique story shards with avatars in the intended character order', () => {
    const owned: Array<'rare_yuki' | 'rare_nara' | 'rare_kenja' | 'rare_lina' | 'rare_zero'> = [];
    const kinds: string[] = [];
    const avatars: string[] = [];
    const rewardIds = new Set<string>();

    for (let completed = 0; completed < 10; completed += 1) {
      const weekId = new Date(Date.UTC(2026, 0, 5 + completed * 7)).toISOString().slice(0, 10);
      const plan = weeklyRewardPlanFor(completed, weekId, owned);
      kinds.push(plan.reward.kind);
      if (plan.reward.rewardId) {
        assert.equal(rewardIds.has(plan.reward.rewardId), false);
        rewardIds.add(plan.reward.rewardId);
      }
      if (plan.avatarId) {
        avatars.push(plan.avatarId);
        owned.push(plan.avatarId);
      }
    }

    assert.deepEqual(kinds, [
      'memory-shard', 'avatar', 'memory-shard', 'avatar', 'memory-shard',
      'avatar', 'memory-shard', 'avatar', 'memory-shard', 'avatar',
    ]);
    assert.deepEqual(avatars, [
      'rare_yuki', 'rare_nara', 'rare_kenja', 'rare_lina', 'rare_zero',
    ]);
  });

  it('never exposes a character asset in the pre-completion preview', () => {
    assert.equal(WEEKLY_REWARD_PREVIEW.kind, 'sealed');
    assert.equal(WEEKLY_REWARD_PREVIEW.imageSrc, undefined);
    assert.equal(WEEKLY_REWARD_PREVIEW.avatarId, undefined);
  });
});
