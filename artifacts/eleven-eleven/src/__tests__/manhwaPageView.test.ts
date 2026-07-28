import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGameProgressionActions } from '../application/game/createGameProgressionActions';
import { createManhwaPageViewActions } from '../application/game/createManhwaPageViewActions';
import { createPuzzleCampaignActions } from '../application/game/createPuzzleCampaignActions';
import {
  CHAPTER_01_PUZZLES,
} from '../content/puzzles/chapter01Campaign';
import type { GameState } from '../core/gameTypes';
import type {
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
} from '../domain/puzzles/campaignContracts';
import {
  GAME_SAVE_VERSION,
  mergeGameState,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';
import { buildInitialState } from '../stores/gameStoreHelpers';

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

function createHarness(initial: GameState = buildInitialState()) {
  let state = initial;
  let setCallCount = 0;
  const get: GameStateGetter = () => state;
  const set: GameStateSetter = (partial) => {
    setCallCount += 1;
    const update = typeof partial === 'function'
      ? partial(state)
      : partial;
    state = { ...state, ...update };
  };
  const progressionActions = createGameProgressionActions(set, get);
  return {
    campaign: createPuzzleCampaignActions(
      set,
      get,
      progressionActions,
    ),
    pageView: createManhwaPageViewActions(set, get),
    getState: get,
    getSetCallCount: () => setCallCount,
  };
}

function withUnlockedPages(...pageIds: string[]): GameState {
  const state = buildInitialState();
  state.progressionState = structuredClone(state.progressionState);
  state.progressionState.manhwa.unlockedPageIds = [
    ...new Set([
      ...state.progressionState.manhwa.unlockedPageIds,
      ...pageIds,
    ]),
  ];
  return state;
}

describe('canonical Manhwa page view transaction', () => {
  it('records nothing when the page is locked', () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState().progressionState);
    const result = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_02',
      '2026-03-01T01:00:00.000Z',
    );

    assert.equal(result.success, false);
    assert.equal(result.failureReason, 'page-not-unlocked');
    assert.deepEqual(harness.getState().progressionState, before);
  });

  it('keeps Puzzle 001 at Fear 71, then applies Page 01 once to reach 73', () => {
    const harness = createHarness();
    const puzzle = CHAPTER_01_PUZZLES[0];
    assert.ok(puzzle);
    const completed = harness.campaign.completeCampaignPuzzle(
      puzzle.id,
      correctSubmission(puzzle),
    );
    assert.equal(completed.success, true);
    assert.equal(harness.getState().progressionState.echo.fear, 71);

    const writesBeforeView = harness.getSetCallCount();
    const firstView = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_01',
      '2026-03-01T01:00:00.000Z',
    );
    assert.equal(firstView.success, true);
    assert.equal(firstView.effectApplied, true);
    assert.equal(harness.getSetCallCount(), writesBeforeView + 1);
    const afterFirstView = harness.getState();
    assert.equal(afterFirstView.progressionState.echo.fear, 73);
    assert.equal(afterFirstView.echo.fear, 73);
    assert.deepEqual(
      afterFirstView.progressionState.manhwa.viewedPageIds,
      ['manhwa_ch01_page_01'],
    );
    assert.equal(
      afterFirstView.progressionState.manhwa.pageViewedAt
        .manhwa_ch01_page_01,
      '2026-03-01T01:00:00.000Z',
    );
    assert.deepEqual(
      afterFirstView.progressionState.manhwa.claimedPageEffectIds,
      ['manhwa_ch01_page_01'],
    );
    assert.equal(
      afterFirstView.narrative.activeFlags
        .first_glass_memory_restored,
      true,
    );

    const secondView = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_01',
      '2026-03-01T02:00:00.000Z',
    );
    assert.equal(secondView.success, true);
    assert.equal(secondView.alreadyViewed, true);
    assert.equal(secondView.effectApplied, false);
    assert.equal(harness.getState().progressionState.echo.fear, 73);
    assert.equal(
      harness.getState().progressionState.manhwa.pageViewedAt
        .manhwa_ch01_page_01,
      '2026-03-01T01:00:00.000Z',
    );
    assert.equal(
      harness.getState().progressionState.manhwa.claimedPageEffectIds
        .filter((id) => id === 'manhwa_ch01_page_01').length,
      1,
    );
  });

  it('applies Page 02 authored effects once', () => {
    const harness = createHarness(
      withUnlockedPages('manhwa_ch01_page_02'),
    );
    const before = harness.getState().progressionState.echo;
    const first = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_02',
      '2026-03-02T01:00:00.000Z',
    );

    assert.equal(first.success, true);
    assert.equal(first.effectApplied, true);
    assert.equal(
      harness.getState().progressionState.echo.hope,
      before.hope + 2,
    );
    assert.equal(
      harness.getState().progressionState.echo.trust,
      before.trust + 2,
    );
    assert.equal(
      harness.getState().narrative.activeFlags
        .time_0333_discovered,
      true,
    );

    const afterFirst = structuredClone(
      harness.getState().progressionState,
    );
    const second = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_02',
      '2026-03-02T02:00:00.000Z',
    );
    assert.equal(second.alreadyViewed, true);
    assert.deepEqual(harness.getState().progressionState, afterFirst);
  });

  it('respects an old effect receipt while recording the first view', () => {
    const state = withUnlockedPages();
    state.progressionState.manhwa.claimedPageEffectIds = [
      'manhwa_ch01_page_01',
    ];
    const migrated = mergeGameState(
      migrateGameState({
        progressionState: state.progressionState,
      }, 12),
      buildInitialState(),
    );
    const fearBefore = migrated.progressionState.echo.fear;
    const harness = createHarness(migrated);
    const result = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_01',
      '2026-03-03T01:00:00.000Z',
    );

    assert.equal(result.success, true);
    assert.equal(result.effectApplied, false);
    assert.equal(
      harness.getState().progressionState.echo.fear,
      fearBefore,
    );
    assert.ok(
      harness.getState().progressionState.manhwa.viewedPageIds.includes(
        'manhwa_ch01_page_01',
      ),
    );
    assert.deepEqual(
      harness.getState().progressionState.manhwa.claimedPageEffectIds,
      ['manhwa_ch01_page_01'],
    );
  });

  it('records a deferred page without creating an empty effect receipt', () => {
    const state = withUnlockedPages(
      'manhwa_ch01_page_02',
      'manhwa_ch01_page_03',
    );
    const harness = createHarness(state);
    const result = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_03',
      '2026-03-04T01:00:00.000Z',
    );

    assert.equal(result.success, true);
    assert.equal(result.effectApplied, false);
    assert.ok(
      harness.getState().progressionState.manhwa.viewedPageIds.includes(
        'manhwa_ch01_page_03',
      ),
    );
    assert.equal(
      harness.getState().progressionState.manhwa.claimedPageEffectIds
        .includes('manhwa_ch01_page_03'),
      false,
    );
  });

  it('keeps the compatibility wrapper and persistence round-trip idempotent', () => {
    const firstHarness = createHarness();
    firstHarness.pageView.markManhwaPageViewed(
      'manhwa_ch01_page_01',
    );
    const firstState = firstHarness.getState();
    assert.ok(
      firstState.progressionState.manhwa.viewedPageIds.includes(
        'manhwa_ch01_page_01',
      ),
    );

    const saved = partializeGameState(firstState);
    const reloaded = mergeGameState(
      migrateGameState(saved, GAME_SAVE_VERSION),
      buildInitialState(),
    );
    const secondHarness = createHarness(reloaded);
    const timestampBefore =
      reloaded.progressionState.manhwa.pageViewedAt
        .manhwa_ch01_page_01;
    const result = secondHarness.pageView.viewManhwaPage(
      'manhwa_ch01_page_01',
      '2026-03-05T01:00:00.000Z',
    );

    assert.equal(result.alreadyViewed, true);
    assert.equal(
      secondHarness.getState().progressionState.manhwa.pageViewedAt
        .manhwa_ch01_page_01,
      timestampBefore,
    );
  });
});
