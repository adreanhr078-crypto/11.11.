import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createGameProgressionActions,
} from '../application/game/createGameProgressionActions';
import {
  createAchievementsReadModel,
  createProgressScreenReadModel,
} from '../application/ui/gameUiReadModels';
import { ACHIEVEMENT_DEFINITIONS } from '../core/achievementDefinitions';
import {
  createInitialAchievementProgressState,
} from '../core/gameProgressionDefaults';
import type { PuzzleReward } from '../core/puzzleRewardTypes';
import {
  createAchievementViews,
  synchronizeAchievementProgress,
} from '../domain/achievements/achievementProgression';
import {
  mergeGameState,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';

const TEST_TIMESTAMP = '2026-07-28T11:11:00.000Z';
const TEST_UNLOCKED_AT = Date.parse(TEST_TIMESTAMP);

function createHarness(initialState = buildInitialState()) {
  let state = initialState;
  const set: GameStateSetter = (update) => {
    const partial = typeof update === 'function'
      ? update(state)
      : update;
    state = {
      ...state,
      ...partial,
    };
  };
  const get: GameStateGetter = () => state;

  return {
    actions: createGameProgressionActions(
      set,
      get,
      () => TEST_TIMESTAMP,
    ),
    getState: () => state,
  };
}

describe('achievement progression domain', () => {
  it('keeps static definitions separate from saved player progress', () => {
    const progress = createInitialAchievementProgressState();
    const ids = ACHIEVEMENT_DEFINITIONS.map((definition) => definition.id);

    assert.equal(new Set(ids).size, ids.length);
    assert.equal(
      Object.hasOwn(ACHIEVEMENT_DEFINITIONS[0]!, 'unlocked'),
      false,
    );
    assert.deepEqual(progress.byId.ten_puzzles, {
      current: 0,
      target: 10,
      unlockedAt: null,
    });
    assert.deepEqual(progress.byId.trust_25, {
      current: 0,
      target: 25,
      unlockedAt: null,
    });
  });

  it('does not unlock first_puzzle when no puzzle is complete', () => {
    const progress = synchronizeAchievementProgress(
      createInitialAchievementProgressState(),
      {
        completedPuzzleCount: 0,
        echoTrust: 15,
      },
      TEST_UNLOCKED_AT,
    );
    const firstPuzzle = createAchievementViews(progress).find(
      (achievement) => achievement.id === 'first_puzzle',
    );

    assert.equal(progress.byId.first_puzzle?.current, 0);
    assert.equal(progress.byId.first_puzzle?.unlockedAt, null);
    assert.equal(firstPuzzle?.unlocked, false);
  });

  it('synchronizes puzzle and Echo achievements monotonically', () => {
    const unlocked = synchronizeAchievementProgress(
      createInitialAchievementProgressState(),
      {
        completedPuzzleCount: 10,
        echoTrust: 50,
      },
      TEST_UNLOCKED_AT,
    );
    const afterLowerSignals = synchronizeAchievementProgress(
      unlocked,
      {
        completedPuzzleCount: 0,
        echoTrust: 0,
      },
      TEST_UNLOCKED_AT + 1000,
    );

    assert.deepEqual(unlocked.byId.ten_puzzles, {
      current: 10,
      target: 10,
      unlockedAt: TEST_UNLOCKED_AT,
    });
    assert.equal(unlocked.byId.twenty_puzzles?.current, 10);
    assert.equal(unlocked.byId.twenty_puzzles?.unlockedAt, null);
    assert.deepEqual(unlocked.byId.trust_50, {
      current: 50,
      target: 50,
      unlockedAt: TEST_UNLOCKED_AT,
    });
    assert.deepEqual(
      afterLowerSignals.byId.ten_puzzles,
      unlocked.byId.ten_puzzles,
    );
    assert.deepEqual(
      afterLowerSignals.byId.trust_50,
      unlocked.byId.trust_50,
    );
  });

  it('applies direct Puzzle Reward progress and derived progress together', () => {
    const harness = createHarness();
    const reward: PuzzleReward = {
      rewardVersion: 1,
      achievementProgress: {
        first_chat: 1,
        ten_puzzles: 3,
      },
    };

    const result = harness.actions.applyPuzzleReward(
      'puzzle_achievement_reward',
      reward,
    );
    const achievements =
      harness.getState().progressionState.achievements.byId;

    assert.equal(result.success, true);
    assert.deepEqual(achievements.first_chat, {
      current: 1,
      target: 1,
      unlockedAt: TEST_UNLOCKED_AT,
    });
    assert.deepEqual(achievements.first_puzzle, {
      current: 1,
      target: 1,
      unlockedAt: TEST_UNLOCKED_AT,
    });
    assert.deepEqual(achievements.ten_puzzles, {
      current: 3,
      target: 10,
      unlockedAt: null,
    });
  });

  it('resynchronizes Echo achievements through canonical actions', () => {
    const harness = createHarness();

    assert.equal(harness.actions.applyEchoEffects({ trust: 10 }), true);

    const trust =
      harness.getState().progressionState.achievements.byId.trust_25;
    assert.deepEqual(trust, {
      current: 25,
      target: 25,
      unlockedAt: TEST_UNLOCKED_AT,
    });
    assert.equal(
      harness.getState().progressionState.achievements.byId.first_puzzle
        ?.current,
      0,
    );
  });
});

describe('achievement save compatibility and read models', () => {
  it('preserves legacy unlocked achievements with missing progress', () => {
    const migrated = migrateGameState({
      achievements: [{
        id: 'ten_puzzles',
        name: 'Researcher',
        desc: 'Solve ten',
        icon: '10',
        unlocked: true,
        unlockedAt: null,
      }],
    }, 10);
    const entry =
      migrated.progressionState?.achievements.byId.ten_puzzles;

    assert.deepEqual(entry, {
      current: 10,
      target: 10,
      unlockedAt: null,
    });
    const reloaded = mergeGameState(migrated, buildInitialState());
    assert.equal(
      reloaded.achievements.find(
        (achievement) => achievement.id === 'ten_puzzles',
      )?.unlocked,
      true,
    );
  });

  it('corrects old canonical targets without relocking them', () => {
    const initial = buildInitialState();
    const canonical = structuredClone(initial.progressionState);
    canonical.achievements.byId.ten_puzzles = {
      current: 1,
      target: 1,
      unlockedAt: 1234,
    };

    const migrated = migrateGameState({
      progressionState: canonical,
    }, 11);

    assert.deepEqual(
      migrated.progressionState?.achievements.byId.ten_puzzles,
      {
        current: 10,
        target: 10,
        unlockedAt: 1234,
      },
    );
  });

  it('round-trips current, target, and unlockedAt without loss', () => {
    const harness = createHarness();
    harness.actions.applyPuzzleReward(
      'puzzle_achievement_round_trip',
      {
        rewardVersion: 1,
        achievementProgress: {
          ten_puzzles: 4,
        },
      },
    );
    const before = harness.getState()
      .progressionState.achievements.byId.ten_puzzles;
    const reloaded = mergeGameState(
      partializeGameState(harness.getState()),
      buildInitialState(),
    );

    assert.deepEqual(
      reloaded.progressionState.achievements.byId.ten_puzzles,
      before,
    );
  });

  it('builds achievement UI models from canonical state', () => {
    const state = buildInitialState();
    state.progressionState.achievements.byId.first_puzzle = {
      current: 1,
      target: 1,
      unlockedAt: TEST_UNLOCKED_AT,
    };
    assert.equal(
      state.achievements.find(
        (achievement) => achievement.id === 'first_puzzle',
      )?.unlocked,
      false,
    );

    const achievements = createAchievementsReadModel(state);
    const progress = createProgressScreenReadModel(state);

    assert.equal(
      achievements.items.find(
        (achievement) => achievement.id === 'first_puzzle',
      )?.unlocked,
      true,
    );
    assert.equal(achievements.unlockedCount, 1);
    assert.equal(progress.achievementsUnlocked, 1);
    assert.equal(progress.achievementsTotal, ACHIEVEMENT_DEFINITIONS.length);
  });
});
