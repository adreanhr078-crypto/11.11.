import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createGameProgressionActions,
} from '../application/game/createGameProgressionActions';
import { createEchoActions } from '../application/game/createEchoActions';
import {
  createPlayerResourceActions,
} from '../application/game/createPlayerResourceActions';
import type { PuzzleReward } from '../core/puzzleRewardTypes';
import {
  mergeGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';

const TEST_TIMESTAMP = '2026-07-28T11:11:00.000Z';

function createHarness(initialState = buildInitialState()) {
  let state = initialState;
  let setCalls = 0;
  const set: GameStateSetter = (update) => {
    setCalls += 1;
    const partial = typeof update === 'function'
      ? update(state)
      : update;
    state = {
      ...state,
      ...partial,
    };
  };
  const get: GameStateGetter = () => state;
  const actions = createGameProgressionActions(
    set,
    get,
    () => TEST_TIMESTAMP,
  );

  return {
    actions,
    getState: () => state,
    getSetCalls: () => setCalls,
    set,
    get,
  };
}

function completeReward(overrides: Partial<PuzzleReward> = {}): PuzzleReward {
  return {
    rewardVersion: 1,
    memoryShards: [{ id: 'reward_shard_01' }],
    coins: 100,
    echoEffect: {
      fear: 2,
      humanity: 1,
    },
    storyFlags: {
      reward_applied: true,
    },
    achievementProgress: {
      first_puzzle: 1,
    },
    pageUnlocks: [{
      pageId: 'test_page_02',
      requiredShardIds: ['reward_shard_01'],
    }],
    ...overrides,
  };
}

describe('game progression resource commands', () => {
  it('adds, checks, and spends canonical coins', () => {
    const harness = createHarness();

    assert.equal(harness.actions.addCoins(120), true);
    assert.equal(harness.actions.canAffordCoins(120), true);
    assert.equal(harness.actions.spendCoins(45), true);
    assert.equal(harness.getState().progressionState.resources.coins, 75);
    assert.equal(harness.getState().currency, 75);
    assert.equal(harness.getState().echo.coins, 75);
    assert.equal(harness.actions.spendCoins(100), false);
    assert.equal(harness.getState().progressionState.resources.coins, 75);
  });

  it('rejects invalid resource values without changing balances', () => {
    const harness = createHarness();
    assert.equal(harness.actions.addCoins(Number.NaN), false);
    assert.equal(harness.actions.addCoins(Number.POSITIVE_INFINITY), false);
    assert.equal(harness.actions.addCoins(-1), false);
    assert.equal(harness.actions.spendCoins(0), false);
    assert.equal(harness.actions.spendMemoryShards(-1), false);
    assert.equal(harness.getState().progressionState.resources.coins, 0);
    assert.equal(
      harness.getState().progressionState.resources.memoryShards
        .spendableBalance,
      0,
    );
  });

  it('keeps shard discovery permanent and increments balance only once', () => {
    const harness = createHarness();

    assert.equal(
      harness.actions.grantMemoryShard('shard_permanent_01'),
      true,
    );
    assert.equal(
      harness.actions.grantMemoryShard('shard_permanent_01'),
      false,
    );
    assert.equal(harness.actions.hasMemoryShards(1), true);
    assert.equal(harness.actions.spendMemoryShards(1), true);

    const shards =
      harness.getState().progressionState.resources.memoryShards;
    assert.equal(shards.spendableBalance, 0);
    assert.equal(shards.totalSpent, 1);
    assert.deepEqual(shards.discoveredShardIds, ['shard_permanent_01']);
    assert.equal(
      shards.discoveredAt.shard_permanent_01,
      TEST_TIMESTAMP,
    );
  });

  it('never relocks an unlocked page when shard balance is spent', () => {
    const harness = createHarness();
    harness.actions.grantMemoryShard('page_test_shard_01');
    harness.actions.grantMemoryShard('page_test_shard_02');
    const reward = completeReward({
      memoryShards: [],
      coins: 0,
      echoEffect: {},
      storyFlags: {},
      achievementProgress: {},
      pageUnlocks: [{
        pageId: 'test_paid_page',
        requiredShardIds: [
          'page_test_shard_01',
          'page_test_shard_02',
        ],
      }],
    });

    assert.equal(
      harness.actions.applyPuzzleReward(
        'puzzle_test_page_unlock',
        reward,
      ).success,
      true,
    );
    assert.equal(harness.actions.spendMemoryShards(2), true);
    assert.equal(
      harness.getState().progressionState.resources.memoryShards
        .spendableBalance,
      0,
    );
    assert.ok(
      harness.getState().progressionState.manhwa.unlockedPageIds
        .includes('test_paid_page'),
    );
  });
});

describe('canonical Echo effects', () => {
  it('clamps independent Echo channels without legacy semantic merging', () => {
    const harness = createHarness();

    assert.equal(harness.actions.applyEchoEffects({
      humanity: 10,
      anger: 8,
      memoryStability: 20,
      memoriesRecovered: 4,
      fear: 100,
    }), true);

    const state = harness.getState();
    assert.equal(state.progressionState.echo.humanity, 45);
    assert.equal(state.progressionState.echo.hope, 20);
    assert.equal(state.echo.personality.humanity, 45);
    assert.equal(state.echo.hope, 20);
    assert.equal(state.progressionState.echo.anger, 8);
    assert.equal(state.progressionState.echo.ragePoints, 0);
    assert.equal(state.echo.personality.anger, 8);
    assert.equal(state.echo.ragePoints, 0);
    assert.equal(state.progressionState.echo.memoryStability, 25);
    assert.equal(state.progressionState.echo.memoriesRecovered, 4);
    assert.equal(state.echo.memoryStability, 25);
    assert.equal(state.echo.personality.memoriesRecovered, 4);
    assert.equal(state.progressionState.echo.fear, 100);
  });

  it('rejects non-finite Echo deltas without changing state', () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState().progressionState);

    assert.equal(harness.actions.applyEchoEffects({
      trust: Number.NaN,
    }), false);
    assert.deepEqual(harness.getState().progressionState, before);
  });
});

describe('atomic puzzle reward transaction', () => {
  it('applies the complete reward exactly once in one store write', () => {
    const harness = createHarness();
    const result = harness.actions.applyPuzzleReward(
      'puzzle_atomic_test',
      completeReward(),
    );

    assert.equal(result.success, true);
    assert.equal(result.receiptKey, 'puzzle_atomic_test:1');
    assert.equal(harness.getSetCalls(), 1);
    const state = harness.getState().progressionState;
    assert.equal(state.resources.coins, 100);
    assert.equal(state.resources.memoryShards.spendableBalance, 1);
    assert.deepEqual(
      state.resources.memoryShards.discoveredShardIds,
      ['reward_shard_01'],
    );
    assert.equal(state.echo.fear, 72);
    assert.equal(state.echo.humanity, 36);
    assert.equal(state.story.narrative.activeFlags.reward_applied, true);
    assert.equal(state.achievements.byId.first_puzzle?.current, 1);
    assert.equal(
      state.achievements.byId.first_puzzle?.unlockedAt,
      Date.parse(TEST_TIMESTAMP),
    );
    assert.ok(state.manhwa.unlockedPageIds.includes('test_page_02'));
    assert.ok(
      state.puzzles.journey.completedPuzzleIds
        .includes('puzzle_atomic_test'),
    );
    assert.deepEqual(
      state.puzzles.claimedRewardReceipts,
      ['puzzle_atomic_test:1'],
    );

    const beforeDuplicate = structuredClone(state);
    const duplicate = harness.actions.applyPuzzleReward(
      'puzzle_atomic_test',
      completeReward(),
    );
    assert.equal(duplicate.success, false);
    assert.equal(duplicate.alreadyClaimed, true);
    assert.deepEqual(
      harness.getState().progressionState,
      beforeDuplicate,
    );
  });

  it('rejects a failure in the final reward section without partial grants', () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState().progressionState);
    const result = harness.actions.applyPuzzleReward(
      'puzzle_atomic_failure',
      completeReward({
        achievementProgress: {
          missing_achievement: 1,
        },
      }),
    );

    assert.equal(result.success, false);
    assert.equal(result.failureReason, 'unknown-achievement');
    assert.deepEqual(harness.getState().progressionState, before);
    assert.equal(harness.getState().currency, 0);
    assert.deepEqual(harness.getState().collectedMemoryFragments, []);
  });

  it('allows a new reward version for the same puzzle independently', () => {
    const harness = createHarness();
    const first = harness.actions.applyPuzzleReward(
      'puzzle_versioned_reward',
      completeReward(),
    );
    const second = harness.actions.applyPuzzleReward(
      'puzzle_versioned_reward',
      completeReward({
        rewardVersion: 2,
        memoryShards: [{ id: 'reward_shard_02' }],
        coins: 25,
        achievementProgress: {},
        pageUnlocks: [],
      }),
    );

    assert.equal(first.success, true);
    assert.equal(second.success, true);
    const state = harness.getState().progressionState;
    assert.equal(state.resources.coins, 125);
    assert.deepEqual(state.puzzles.claimedRewardReceipts, [
      'puzzle_versioned_reward:1',
      'puzzle_versioned_reward:2',
    ]);
    assert.deepEqual(state.resources.memoryShards.discoveredShardIds, [
      'reward_shard_01',
      'reward_shard_02',
    ]);
  });

  it('keeps receipts idempotent after persistence reload', () => {
    const firstHarness = createHarness();
    firstHarness.actions.applyPuzzleReward(
      'puzzle_reload_reward',
      completeReward(),
    );
    const reloaded = mergeGameState(
      partializeGameState(firstHarness.getState()),
      buildInitialState(),
    );
    const secondHarness = createHarness(reloaded);
    const before = structuredClone(
      secondHarness.getState().progressionState,
    );

    const duplicate = secondHarness.actions.applyPuzzleReward(
      'puzzle_reload_reward',
      completeReward(),
    );
    assert.equal(duplicate.success, false);
    assert.equal(duplicate.alreadyClaimed, true);
    assert.deepEqual(
      secondHarness.getState().progressionState,
      before,
    );
  });

  it('rejects malformed rewards without applying any field', () => {
    const harness = createHarness();
    const invalidRewards: PuzzleReward[] = [
      completeReward({ rewardVersion: 0 }),
      completeReward({ coins: Number.POSITIVE_INFINITY }),
      completeReward({
        memoryShards: [
          { id: 'duplicate_shard' },
          { id: 'duplicate_shard' },
        ],
      }),
      completeReward({
        storyFlags: {
          '': true,
        },
      }),
    ];

    for (const [index, reward] of invalidRewards.entries()) {
      const before = structuredClone(harness.getState().progressionState);
      const result = harness.actions.applyPuzzleReward(
        `puzzle_invalid_${index}`,
        reward,
      );
      assert.equal(result.success, false);
      assert.deepEqual(harness.getState().progressionState, before);
    }
  });
});

describe('legacy resource wrappers', () => {
  it('routes compatibility actions through canonical progression', () => {
    const harness = createHarness();
    const wrappers = createPlayerResourceActions(
      harness.set,
      harness.get,
      harness.actions,
    );

    wrappers.addCurrency(10.8);
    assert.equal(harness.getState().currency, 10);
    assert.equal(wrappers.spendCurrency(4), true);
    assert.equal(harness.getState().progressionState.resources.coins, 6);
    assert.equal(wrappers.collectMemoryFragment('legacy_fragment'), true);
    assert.equal(wrappers.collectMemoryFragment('legacy_fragment'), false);
    assert.equal(wrappers.hasMemoryFragment('legacy_fragment'), true);
    wrappers.resetMemoryFragments();
    assert.deepEqual(
      harness.getState().progressionState.resources.memoryShards
        .discoveredShardIds,
      [],
    );
  });

  it('routes legacy Echo controls without merging independent channels', () => {
    const harness = createHarness();
    const wrappers = createEchoActions(
      harness.set,
      harness.get,
      harness.actions,
    );

    wrappers.incrementTrust(5);
    wrappers.decrementFear(10);
    wrappers.updateTransformation?.('rage', 12);

    const state = harness.getState();
    assert.equal(state.progressionState.echo.trust, 20);
    assert.equal(state.echo.trust, 20);
    assert.equal(state.progressionState.echo.fear, 60);
    assert.equal(state.echo.fear, 60);
    assert.equal(state.progressionState.echo.ragePoints, 12);
    assert.equal(state.echo.ragePoints, 12);
    assert.equal(state.progressionState.echo.anger, 0);
    assert.equal(state.echo.personality.anger, 0);
  });
});
