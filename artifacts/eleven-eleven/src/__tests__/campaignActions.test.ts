import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createPlayerResourceActions } from '../application/game/createPlayerResourceActions';
import { createManhwaArchiveActions } from '../application/game/createManhwaArchiveActions';
import { createManhwaPageViewActions } from '../application/game/createManhwaPageViewActions';
import { createPuzzleCampaignActions } from '../application/game/createPuzzleCampaignActions';
import {
  createGameProgressionActions,
} from '../application/game/createGameProgressionActions';
import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
  CHAPTER_01_PUZZLES,
} from '../content/puzzles/chapter01Campaign';
import type { GameState } from '../core/gameTypes';
import type {
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
} from '../domain/puzzles/campaignContracts';
import { getCampaignPageStatus } from '../domain/puzzles/campaignEngine';
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

function correctSubmission(
  definition: CampaignPuzzleDefinition,
): CampaignPuzzleProgress[] {
  return definition.stages.map((stage, stageIndex) => (
    stage.mode === 'match'
      ? {
          stageIndex,
          values: [],
          matches: { ...stage.solution },
        }
      : {
          stageIndex,
          values: [...stage.solution],
          matches: {},
        }
  ));
}

function definition(order: number): CampaignPuzzleDefinition {
  const puzzle = CHAPTER_01_PUZZLES.find((item) => item.order === order);
  assert.ok(puzzle, `Missing authored campaign puzzle ${order}`);
  return puzzle;
}

function createHarness(initial?: Partial<GameState>) {
  let state: GameState = {
    ...buildInitialState(),
    ...initial,
  };
  const get: GameStateGetter = () => state;
  const set: GameStateSetter = (partial) => {
    const update = typeof partial === 'function'
      ? partial(state)
      : partial;
    state = { ...state, ...update };
  };
  const progressionActions = createGameProgressionActions(set, get);
  const campaignActions = createPuzzleCampaignActions(
    set,
    get,
    progressionActions,
  );
  const pageViewActions = createManhwaPageViewActions(set, get);
  const actions = {
    ...campaignActions,
    ...pageViewActions,
  };
  const resourceActions = createPlayerResourceActions(
    set,
    get,
    progressionActions,
  );
  const archiveActions = createManhwaArchiveActions(set, get);

  return {
    actions,
    archiveActions,
    progressionActions,
    resourceActions,
    getState: get,
    patch(partial: Partial<GameState>) {
      set(partial);
    },
  };
}

function completeRange(
  harness: ReturnType<typeof createHarness>,
  start: number,
  end: number,
) {
  const results = [];
  for (let order = start; order <= end; order += 1) {
    const puzzle = definition(order);
    results.push(
      harness.actions.completeCampaignPuzzle(
        puzzle.id,
        correctSubmission(puzzle),
      ),
    );
  }
  return results;
}

describe('campaign completion actions', () => {
  it('applies Puzzle 001 reward, shard, Echo, and narrative exactly once', () => {
    const harness = createHarness();
    const puzzle = definition(1);
    const submission = correctSubmission(puzzle);

    const first = harness.actions.completeCampaignPuzzle(
      puzzle.id,
      submission,
    );
    assert.equal(first.success, true);
    assert.equal(first.alreadyCompleted, false);

    const completed = harness.getState();
    assert.equal(completed.currency, 15);
    assert.deepEqual(
      completed.collectedMemoryFragments,
      ['page01_shard_01'],
    );
    assert.deepEqual(completed.claimedPuzzleRewards, [puzzle.id]);
    assert.ok(completed.memoryFragmentCollectedAt.page01_shard_01);
    assert.deepEqual(
      completed.progression.completedPuzzleIds,
      [puzzle.id],
    );
    assert.equal(completed.echo.fear, 71);
    assert.equal(completed.echo.personality.fear, 71);
    assert.equal(completed.echo.awareness, 4);
    assert.ok(
      completed.narrative.beliefs.includes(
        'My awakening began with a failing heartbeat.',
      ),
    );
    assert.equal(
      completed.narrative.activeFlags.first_pulse_reconstructed,
      true,
    );
    assert.equal(
      completed.consumedDialogueTriggerIds.filter(
        (id) => id === 'dialogue_after_puzzle_001_broken_pulse',
      ).length,
      1,
    );

    const snapshot = {
      currency: completed.currency,
      fragments: [...completed.collectedMemoryFragments],
      claimed: [...completed.claimedPuzzleRewards],
      fear: completed.echo.fear,
      awareness: completed.echo.awareness,
      beliefs: [...completed.narrative.beliefs],
      timelineLength: completed.memory.timelineEvents.length,
    };
    const duplicate = harness.actions.completeCampaignPuzzle(
      puzzle.id,
      submission,
    );

    assert.equal(duplicate.success, false);
    assert.equal(duplicate.alreadyCompleted, true);
    const afterDuplicate = harness.getState();
    assert.deepEqual(
      {
        currency: afterDuplicate.currency,
        fragments: afterDuplicate.collectedMemoryFragments,
        claimed: afterDuplicate.claimedPuzzleRewards,
        fear: afterDuplicate.echo.fear,
        awareness: afterDuplicate.echo.awareness,
        beliefs: afterDuplicate.narrative.beliefs,
        timelineLength: afterDuplicate.memory.timelineEvents.length,
      },
      snapshot,
    );

    const reloaded = mergeGameState(
      partializeGameState(completed),
      buildInitialState(),
    );
    assert.equal(reloaded.currency, 15);
    assert.deepEqual(
      reloaded.collectedMemoryFragments,
      ['page01_shard_01'],
    );
    assert.deepEqual(reloaded.claimedPuzzleRewards, [puzzle.id]);
    assert.ok(
      reloaded.narrative.beliefs.includes(
        'My awakening began with a failing heartbeat.',
      ),
    );
    const reloadedHarness = createHarness(reloaded);
    const reloadDuplicate = reloadedHarness.actions.completeCampaignPuzzle(
      puzzle.id,
      submission,
    );
    assert.equal(reloadDuplicate.success, false);
    assert.equal(reloadDuplicate.alreadyCompleted, true);
    assert.equal(reloadedHarness.getState().currency, 15);
    assert.deepEqual(
      reloadedHarness.getState().progressionState.puzzles
        .claimedRewardReceipts,
      [`${puzzle.id}:1`],
    );
  });

  it('enforces sequential hints, free tutorial hints, costs, insufficient funds, and idempotency', () => {
    const harness = createHarness();
    const first = definition(1);

    const outOfOrder = harness.actions.purchaseCampaignHint(
      first.id,
      'connection',
    );
    assert.equal(outOfOrder.success, false);
    assert.equal(harness.getState().currency, 0);

    const freeObservation = harness.actions.purchaseCampaignHint(
      first.id,
      'observation',
    );
    assert.equal(freeObservation.success, true);
    assert.equal(freeObservation.alreadyUnlocked, false);
    assert.equal(freeObservation.hint?.cost, 0);
    assert.equal(harness.getState().currency, 0);

    const freeObservationAgain = harness.actions.purchaseCampaignHint(
      first.id,
      'observation',
    );
    assert.equal(freeObservationAgain.success, true);
    assert.equal(freeObservationAgain.alreadyUnlocked, true);
    assert.equal(harness.getState().currency, 0);

    assert.equal(
      harness.actions.purchaseCampaignHint(first.id, 'connection').success,
      true,
    );
    assert.equal(
      harness.actions.purchaseCampaignHint(first.id, 'assistance').success,
      true,
    );
    assert.deepEqual(
      harness.getState().unlockedHintTiersByPuzzle[first.id],
      ['observation', 'connection', 'assistance'],
    );

    assert.equal(
      harness.actions.completeCampaignPuzzle(
        first.id,
        correctSubmission(first),
      ).success,
      true,
    );
    const second = definition(2);
    const paidObservation = harness.actions.purchaseCampaignHint(
      second.id,
      'observation',
    );
    assert.equal(paidObservation.success, true);
    assert.equal(paidObservation.hint?.cost, 5);
    assert.equal(harness.getState().currency, 10);

    const paidObservationAgain = harness.actions.purchaseCampaignHint(
      second.id,
      'observation',
    );
    assert.equal(paidObservationAgain.alreadyUnlocked, true);
    assert.equal(harness.getState().currency, 10);

    const insufficient = harness.actions.purchaseCampaignHint(
      second.id,
      'connection',
    );
    assert.equal(insufficient.success, false);
    assert.equal(harness.getState().currency, 10);
    assert.deepEqual(
      harness.getState().unlockedHintTiersByPuzzle[second.id],
      ['observation'],
    );

    harness.resourceActions.setCurrency(100);
    assert.equal(
      harness.actions.purchaseCampaignHint(second.id, 'connection').success,
      true,
    );
    assert.equal(harness.getState().currency, 85);
    assert.equal(
      harness.actions.purchaseCampaignHint(second.id, 'assistance').success,
      true,
    );
    assert.equal(harness.getState().currency, 55);
  });

  it('completes Puzzles 001–010 while keeping Page 01 free', () => {
    const harness = createHarness();
    const results = completeRange(harness, 1, 10);

    assert.ok(results.every((result) => result.success));
    assert.equal(results.at(-1)?.restoredPageId, undefined);
    const state = harness.getState();
    assert.equal(
      CHAPTER_01_PUZZLES
        .filter((puzzle) => puzzle.order <= 10)
        .reduce((total, puzzle) => total + puzzle.rewards.coins, 0),
      235,
    );
    assert.equal(state.currency, 235);
    assert.equal(state.progression.completedPuzzleIds.length, 10);
    assert.deepEqual(
      state.collectedMemoryFragments,
      Array.from(
        { length: 10 },
        (_, index) => `page01_shard_${String(index + 1).padStart(2, '0')}`,
      ),
    );
    assert.equal(state.integratedMemoryFragmentIds.length, 0);
    assert.ok(
      state.unlockedManhwaPageIds.includes('manhwa_ch01_page_01'),
    );
    assert.equal(
      state.narrative.activeFlags.manhwa_page_01_unlocked,
      undefined,
    );
    assert.equal(
      state.progressionState.manhwa.claimedPageEffectIds.includes(
        'manhwa_ch01_page_01',
      ),
      false,
    );
  });

  it('keeps Puzzle 011 gated by Puzzle 010, not paid Page 01', () => {
    const harness = createHarness();
    completeRange(harness, 1, 9);
    const eleventh = definition(11);

    const gated = harness.actions.completeCampaignPuzzle(
      eleventh.id,
      correctSubmission(eleventh),
    );
    assert.equal(gated.success, false);
    assert.equal(gated.alreadyCompleted, false);
    assert.equal(harness.getState().currency, 195);
    assert.equal(
      harness.getState().collectedMemoryFragments.includes(
        eleventh.rewards.shardId,
      ),
      false,
    );

    const tenth = definition(10);
    assert.equal(
      harness.actions.completeCampaignPuzzle(
        tenth.id,
        correctSubmission(tenth),
      ).success,
      true,
    );
    assert.equal(
      harness.actions.completeCampaignPuzzle(
        eleventh.id,
        correctSubmission(eleventh),
      ).success,
      true,
    );
  });

  it('keeps archive unlock and page effects separate from puzzle completion', () => {
    const harness = createHarness();
    completeRange(harness, 1, 10);
    const results = completeRange(harness, 11, 20);

    assert.ok(results.every((result) => result.success));
    assert.equal(results.at(-1)?.restoredPageId, undefined);
    const state = harness.getState();
    assert.equal(state.currency, 505);
    assert.equal(state.progression.completedPuzzleIds.length, 20);
    assert.equal(state.collectedMemoryFragments.length, 20);
    assert.equal(state.integratedMemoryFragmentIds.length, 0);
    assert.equal(state.memory.totalFragments, 280);
    assert.equal(
      state.unlockedManhwaPageIds.includes('manhwa_ch01_page_02'),
      false,
    );
    assert.equal(
      state.unlockedManhwaPageIds.includes('manhwa_ch01_page_03'),
      false,
    );

    const pageTwo = CHAPTER_01_MANHWA_PAGE_BY_ID.manhwa_ch01_page_02;
    assert.ok(pageTwo);
    assert.equal(pageTwo.restoredStatus, 'questioned');
    assert.equal(
      getCampaignPageStatus(
        pageTwo,
        state.collectedMemoryFragments,
      ),
      'questioned',
    );
    assert.equal(
      state.narrative.activeFlags.manhwa_page_02_unlocked,
      undefined,
    );
    assert.equal(
      state.narrative.questions.includes(
        'Is the figure in the corridor really Yuki?',
      ),
      false,
    );
    assert.equal(
      state.progressionState.manhwa.claimedPageEffectIds.includes(
        'manhwa_ch01_page_02',
      ),
      false,
    );

    const unlocked = harness.archiveActions.unlockManhwaPage(
      'manhwa_ch01_page_02',
      '2026-01-02T03:04:05.000Z',
    );
    assert.equal(unlocked.success, true);
    assert.equal(unlocked.costSpent, 3);
    assert.equal(
      harness.getState().progressionState.resources.memoryShards.totalSpent,
      3,
    );
    assert.equal(harness.progressionActions.spendMemoryShards(17), true);
    assert.equal(
      harness.getState().progressionState.resources.memoryShards
        .spendableBalance,
      0,
    );
    assert.ok(
      harness.getState().unlockedManhwaPageIds.includes(
        'manhwa_ch01_page_02',
      ),
    );
    const pageThree = CHAPTER_01_MANHWA_PAGE_BY_ID.manhwa_ch01_page_03;
    assert.ok(pageThree);
    assert.equal(
      getCampaignPageStatus(pageThree, state.collectedMemoryFragments),
      'locked',
    );
  });
});

describe('campaign persistence actions', () => {
  it('migrates missing campaign fields to safe defaults without erasing unrelated save data', () => {
    const player = {
      curiosity: 77,
      interactions: 9,
      choices: ['remember'],
    };
    const world = {
      stability: 64,
      glitchLevel: 12,
      corruptionLevel: 4,
      anomalyCount: 2,
    };
    const migrated = migrateGameState({
      player,
      world,
      finalChoice: 'mercy',
      narrativeTriggers: { legacy_signal_seen: true },
    }, 6);

    assert.equal(migrated.currency, 0);
    assert.deepEqual(migrated.collectedMemoryFragments, []);
    assert.deepEqual(migrated.puzzleProgress, {});
    assert.deepEqual(migrated.claimedPuzzleRewards, []);
    assert.deepEqual(migrated.unlockedHintTiersByPuzzle, {});
    assert.deepEqual(migrated.integratedMemoryFragmentIds, []);
    assert.deepEqual(
      migrated.unlockedManhwaPageIds,
      ['manhwa_ch01_page_01'],
    );
    assert.deepEqual(migrated.viewedManhwaPageIds, []);
    assert.deepEqual(migrated.memoryFragmentCollectedAt, {});
    assert.deepEqual(migrated.manhwaPageUnlockedAt, {});
    assert.deepEqual(migrated.manhwaPageViewedAt, {});
    assert.deepEqual(migrated.consumedDialogueTriggerIds, []);
    assert.equal(
      migrated.lastAvailablePuzzleId,
      'puzzle_001_broken_pulse',
    );
    assert.deepEqual(migrated.player, player);
    assert.deepEqual(migrated.world, world);
    assert.equal(migrated.finalChoice, 'mercy');
    assert.deepEqual(
      migrated.narrativeTriggers,
      { legacy_signal_seen: true },
    );

    const merged = mergeGameState({
      player,
      world,
      finalChoice: 'mercy',
    }, buildInitialState());
    assert.equal(merged.echo.fear, buildInitialState().echo.fear);
    assert.deepEqual(merged.player, player);
    assert.deepEqual(merged.collectedMemoryFragments, []);
  });

  it('reconciles campaign invariants without exposing incomplete pages', () => {
    const first = definition(1);
    const completedOnly = migrateGameState({
      progression: {
        contentVersion: 'legacy',
        currentChapterId: 'chapter_1',
        completedPuzzleIds: [first.id],
        skippedPuzzleIds: [],
        unlockedChapterIds: ['chapter_1'],
        completedChapterIds: [],
      },
      unlockedManhwaPageIds: ['manhwa_ch01_page_01'],
    }, 9);

    assert.ok(completedOnly.claimedPuzzleRewards?.includes(first.id));
    assert.equal(
      completedOnly.collectedMemoryFragments?.includes(
        first.rewards.shardId,
      ),
      false,
    );
    assert.equal(
      completedOnly.unlockedManhwaPageIds?.includes(
        'manhwa_ch01_page_01',
      ),
      true,
    );
    assert.equal(
      completedOnly.lastAvailablePuzzleId,
      'puzzle_002_do_not_look_back',
    );

    const tenShardsOnly = migrateGameState({
      collectedMemoryFragments: Array.from(
        { length: 10 },
        (_, index) => `page01_shard_${String(index + 1).padStart(2, '0')}`,
      ),
    }, 9);
    assert.ok(
      tenShardsOnly.unlockedManhwaPageIds?.includes(
        'manhwa_ch01_page_01',
      ),
    );
    assert.equal(
      tenShardsOnly.unlockedManhwaPageIds?.includes(
        'manhwa_ch01_page_02',
      ),
      false,
    );

    const outOfOrderPage = migrateGameState({
      collectedMemoryFragments: Array.from(
        { length: 10 },
        (_, index) => `page02_shard_${String(index + 1).padStart(2, '0')}`,
      ),
      unlockedManhwaPageIds: ['manhwa_ch01_page_02'],
      viewedManhwaPageIds: ['manhwa_ch01_page_02'],
    }, 10);
    assert.deepEqual(outOfOrderPage.unlockedManhwaPageIds, [
      'manhwa_ch01_page_02',
      'manhwa_ch01_page_01',
    ]);
    assert.deepEqual(
      outOfOrderPage.viewedManhwaPageIds,
      ['manhwa_ch01_page_02'],
    );

    const fabricatedFuturePage = migrateGameState({
      collectedMemoryFragments: [
        'legacy_fragment_kept',
        ...Array.from(
          { length: 10 },
          (_, index) => `page03_shard_${String(index + 1).padStart(2, '0')}`,
        ),
      ],
      integratedMemoryFragmentIds: ['page03_shard_01'],
      unlockedManhwaPageIds: ['manhwa_ch01_page_03'],
      viewedManhwaPageIds: ['manhwa_ch01_page_03'],
      memoryFragmentCollectedAt: {
        page03_shard_01: '2026-01-01T00:00:00.000Z',
      },
      manhwaPageUnlockedAt: {
        manhwa_ch01_page_03: '2026-01-01T00:00:00.000Z',
      },
      manhwaPageViewedAt: {
        manhwa_ch01_page_03: '2026-01-01T00:00:00.000Z',
      },
    }, 10);
    assert.deepEqual(
      fabricatedFuturePage.collectedMemoryFragments,
      ['legacy_fragment_kept'],
    );
    assert.deepEqual(
      fabricatedFuturePage.integratedMemoryFragmentIds,
      Array.from(
        { length: 10 },
        (_, index) => (
          `page03_shard_${String(index + 1).padStart(2, '0')}`
        ),
      ),
    );
    assert.deepEqual(fabricatedFuturePage.unlockedManhwaPageIds, [
      'manhwa_ch01_page_03',
      'manhwa_ch01_page_01',
    ]);
    assert.deepEqual(
      fabricatedFuturePage.viewedManhwaPageIds,
      ['manhwa_ch01_page_03'],
    );
    assert.deepEqual(fabricatedFuturePage.memoryFragmentCollectedAt, {});
    assert.deepEqual(fabricatedFuturePage.manhwaPageUnlockedAt, {
      manhwa_ch01_page_03: '2026-01-01T00:00:00.000Z',
    });
    assert.deepEqual(fabricatedFuturePage.manhwaPageViewedAt, {
      manhwa_ch01_page_03: '2026-01-01T00:00:00.000Z',
    });

    const repeatedRingValues = migrateGameState({
      puzzleProgress: {
        puzzle_019_333_lock: [{
          stageIndex: 0,
          values: ['0', '3', '3', '3'],
          matches: {},
        }],
      },
    }, 10);
    assert.deepEqual(
      repeatedRingValues.puzzleProgress?.puzzle_019_333_lock?.[0]?.values,
      ['0', '3', '3', '3'],
    );
  });

  it('keeps canonical campaign shards exclusive to puzzle completion', () => {
    const harness = createHarness();

    assert.equal(
      harness.resourceActions.collectMemoryFragment('page03_shard_01'),
      false,
    );
    assert.equal(
      harness.resourceActions.collectMemoryFragment('page01_shard_01'),
      false,
    );
    assert.equal(
      harness.resourceActions.collectMemoryFragment('legacy_fragment'),
      true,
    );
    assert.deepEqual(
      harness.getState().collectedMemoryFragments,
      ['legacy_fragment'],
    );
  });

  it('marks only unlocked manhwa pages viewed and remains idempotent', () => {
    const harness = createHarness();
    harness.actions.markManhwaPageViewed('manhwa_ch01_page_01');
    harness.actions.markManhwaPageViewed('manhwa_ch01_page_01');

    const state = harness.getState();
    assert.deepEqual(
      state.viewedManhwaPageIds,
      ['manhwa_ch01_page_01'],
    );
    assert.equal(
      state.consumedDialogueTriggerIds.filter(
        (id) => id === 'echo_reacts_to_page_01',
      ).length,
      1,
    );
    assert.ok(state.manhwaPageViewedAt.manhwa_ch01_page_01);
  });
});
