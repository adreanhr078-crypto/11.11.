import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mergeGameState,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';

describe('canonical game progression persistence', () => {
  it('keeps independent Echo channels independent in the initial model', () => {
    const echo = buildInitialState().progressionState.echo;

    assert.equal(echo.memoryStability, 5);
    assert.equal(echo.memoriesRecovered, 0);
    assert.equal(echo.humanity, 35);
    assert.equal(echo.hope, 20);
    assert.equal(echo.anger, 0);
    assert.equal(echo.ragePoints, 0);
  });

  it('uses canonical values before normalized legacy fallbacks', () => {
    const initial = buildInitialState();
    const canonical = structuredClone(initial.progressionState);
    canonical.echo.humanity = 44;
    canonical.echo.anger = 18;
    canonical.echo.memoryStability = 73;
    canonical.echo.memoriesRecovered = 6;

    const canonicalWins = migrateGameState({
      progressionState: canonical,
      echo: {
        hope: 99,
        ragePoints: 92,
        memoryStability: 12,
        personality: {
          humanity: 88,
          anger: 77,
          memoriesRecovered: 55,
        },
      },
    }, 11);

    assert.equal(canonicalWins.progressionState?.echo.humanity, 44);
    assert.equal(canonicalWins.progressionState?.echo.anger, 18);
    assert.equal(canonicalWins.progressionState?.echo.memoryStability, 73);
    assert.equal(canonicalWins.progressionState?.echo.memoriesRecovered, 6);

    const normalizedFallback = migrateGameState({
      echo: {
        hope: 142.8,
        ragePoints: -8,
        memoryStability: 61,
      },
    }, 10);

    assert.equal(normalizedFallback.progressionState?.echo.humanity, 100);
    assert.equal(normalizedFallback.progressionState?.echo.anger, 0);
    assert.equal(normalizedFallback.progressionState?.echo.hope, 100);
    assert.equal(normalizedFallback.progressionState?.echo.ragePoints, 0);
    assert.equal(
      normalizedFallback.progressionState?.echo.memoryStability,
      61,
    );
    assert.equal(
      normalizedFallback.progressionState?.echo.memoriesRecovered,
      0,
    );
  });

  it('separates shard balance, permanent discovery, and lifetime spending', () => {
    const migratedLegacy = migrateGameState({
      collectedMemoryFragments: [
        'fragment_a',
        'fragment_a',
        'fragment_b',
      ],
      memory: {
        fragmentsCollected: 5,
      },
    }, 9);

    const legacyShards =
      migratedLegacy.progressionState?.resources.memoryShards;
    assert.deepEqual(
      legacyShards?.discoveredShardIds,
      ['fragment_a', 'fragment_b'],
    );
    assert.equal(legacyShards?.spendableBalance, 5);
    assert.equal(legacyShards?.totalSpent, 0);

    const initial = buildInitialState();
    const canonical = structuredClone(initial.progressionState);
    canonical.resources.memoryShards = {
      spendableBalance: 0,
      discoveredShardIds: ['fragment_a', 'fragment_b'],
      discoveredAt: {
        fragment_a: '2026-01-01T00:00:00.000Z',
      },
      totalSpent: 2,
    };
    canonical.manhwa.unlockedPageIds.push('echo_network_final_2026_09_v1_page_008');

    const migratedSpentSave = migrateGameState({
      progressionState: canonical,
      collectedMemoryFragments: [],
      unlockedManhwaPageIds: [],
    }, 11);
    const spentShards =
      migratedSpentSave.progressionState?.resources.memoryShards;

    assert.equal(spentShards?.spendableBalance, 0);
    assert.equal(spentShards?.totalSpent, 2);
    assert.deepEqual(
      spentShards?.discoveredShardIds,
      ['fragment_a', 'fragment_b'],
    );
    assert.ok(
      migratedSpentSave.progressionState?.manhwa.unlockedPageIds
        .includes('echo_network_final_2026_09_v1_page_008'),
    );
  });

  it('retires local campaign receipts while preserving unlocked achievements', () => {
    const migrated = migrateGameState({
      claimedPuzzleRewards: ['puzzle_001_broken_pulse'],
      achievements: [{
        id: 'first_puzzle',
        name: 'First',
        desc: 'Solved one',
        icon: '1',
        unlocked: true,
        unlockedAt: 1234,
      }],
    }, 10);

    assert.deepEqual(
      migrated.progressionState?.puzzles.claimedRewardReceipts,
      [],
    );
    assert.deepEqual(
      migrated.progressionState?.achievements.byId.first_puzzle,
      {
        current: 1,
        target: 1,
        unlockedAt: 1234,
      },
    );
  });

  it('does not mutate the save object supplied to migration', () => {
    const save = {
      currency: 7.8,
      collectedMemoryFragments: [' fragment_a ', 'fragment_a'],
      echo: {
        hope: 35,
        ragePoints: 9,
      },
    };
    const before = structuredClone(save);

    migrateGameState(save, 8);

    assert.deepEqual(save, before);
  });

  it('round-trips legacy saves without losing canonical or unrelated data', () => {
    const initial = buildInitialState();
    const {
      progressionState: _canonical,
      ...legacy
    } = partializeGameState(initial);
    const legacySave = {
      ...legacy,
      currency: 240,
      collectedMemoryFragments: ['fragment_a', 'fragment_b'],
      memoryFragmentCollectedAt: {
        fragment_a: '2026-02-03T11:11:00.000Z',
      },
      claimedPuzzleRewards: ['puzzle_001_broken_pulse'],
      unlockedManhwaPageIds: [
        'echo_network_final_2026_09_v1_page_001',
        'echo_network_final_2026_09_v1_page_002',
      ],
      viewedManhwaPageIds: ['echo_network_final_2026_09_v1_page_001'],
      echo: {
        ...initial.echo,
        hope: 41,
        ragePoints: 17,
        memoryStability: 62,
        personality: {
          ...initial.echo.personality,
          humanity: 58,
          anger: 23,
          memoriesRecovered: 4,
        },
      },
      narrative: {
        ...initial.narrative,
        activeFlags: {
          save_round_trip: true,
        },
        latestDecisions: {
          door: 'wait',
        },
      },
      achievements: initial.achievements.map((achievement, index) => (
        index === 0
          ? { ...achievement, unlocked: true, unlockedAt: 2222 }
          : achievement
      )),
      world: {
        stability: 88,
        glitchLevel: 12,
        corruptionLevel: 7,
        anomalyCount: 3,
      },
    };

    const firstLoad = mergeGameState(legacySave, buildInitialState());
    const persistedAgain = partializeGameState(firstLoad);
    const secondLoad = mergeGameState(
      persistedAgain,
      buildInitialState(),
    );

    assert.deepEqual(
      secondLoad.progressionState,
      firstLoad.progressionState,
    );
    assert.equal(secondLoad.currency, 240);
    assert.deepEqual(
      secondLoad.collectedMemoryFragments,
      ['fragment_a', 'fragment_b'],
    );
    assert.deepEqual(
      secondLoad.memoryFragmentCollectedAt,
      { fragment_a: '2026-02-03T11:11:00.000Z' },
    );
    assert.ok(
      secondLoad.progressionState.manhwa.unlockedPageIds
        .includes('echo_network_final_2026_09_v1_page_002'),
    );
    assert.equal(secondLoad.progressionState.echo.memoryStability, 62);
    assert.equal(secondLoad.progressionState.echo.memoriesRecovered, 4);
    assert.equal(secondLoad.progressionState.echo.humanity, 58);
    assert.equal(secondLoad.progressionState.echo.hope, 41);
    assert.equal(
      secondLoad.progressionState.achievements.byId.first_puzzle
        ?.unlockedAt,
      2222,
    );
    assert.equal(secondLoad.narrative.activeFlags.save_round_trip, true);
    assert.equal(secondLoad.narrative.latestDecisions.door, 'wait');
    assert.deepEqual(secondLoad.world, legacySave.world);
  });
});
