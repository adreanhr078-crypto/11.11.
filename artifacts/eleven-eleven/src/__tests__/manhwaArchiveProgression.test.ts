import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createManhwaArchiveActions,
} from '../application/game/createManhwaArchiveActions';
import {
  FINAL_MANHWA_ACCESS_DEFINITIONS,
  FINAL_MANHWA_REACHABILITY,
} from '../application/game/manhwaArchiveReachability';
import type { GameState } from '../core/gameTypes';
import { createManhwaUnlockReceiptKey } from '../core/manhwaArchiveTypes';
import {
  applyManhwaPageUnlockTransaction,
  createManhwaPageAccessDefinition,
} from '../domain/manhwa/manhwaArchiveProgression';
import {
  GAME_SAVE_VERSION,
  migrateGameState,
} from '../infrastructure/persistence/gamePersistence';
import type { GameStateGetter, GameStateSetter } from '../application/game/statePorts';
import { buildInitialState } from '../stores/gameStoreHelpers';
import { STORY_PUZZLES } from '../content/puzzles/storyPuzzleCatalog';

function progressionForUnlock(balance: number) {
  const progression = structuredClone(buildInitialState().progressionState);
  progression.manhwa.unlockedPageIds = ['manhwa_ch00_page_01'];
  progression.manhwa.claimedPageUnlockReceipts = [
    createManhwaUnlockReceiptKey('manhwa_ch00_page_01'),
  ];
  progression.resources.memoryShards = {
    spendableBalance: balance,
    discoveredShardIds: ['earned_a', 'earned_b'],
    discoveredAt: {
      earned_a: '2026-01-01T00:00:00.000Z',
      earned_b: '2026-01-01T00:01:00.000Z',
    },
    totalSpent: 0,
  };
  return progression;
}

function createHarness(initial: GameState) {
  let state = initial;
  const get: GameStateGetter = () => state;
  const set: GameStateSetter = (partial) => {
    const update = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...update };
  };
  return { actions: createManhwaArchiveActions(set, get), getState: get };
}

describe('Final Manhwa access definitions', () => {
  it('uses the 71-page publication and keeps chapter unlock data centralized', () => {
    assert.equal(FINAL_MANHWA_ACCESS_DEFINITIONS.length, 71);
    assert.equal(FINAL_MANHWA_REACHABILITY.availableShards, 20);
    assert.equal(FINAL_MANHWA_ACCESS_DEFINITIONS[0]?.pageId, 'manhwa_ch00_page_01');
    assert.equal(FINAL_MANHWA_ACCESS_DEFINITIONS.at(-1)?.pageId, 'manhwa_ch00_page_04');
  });
});

describe('Manhwa unlock transaction compatibility', () => {
  it('synchronizes reader windows from verified Story Puzzle completions', () => {
    const harness = createHarness(buildInitialState());
    assert.equal(harness.getState().progressionState.manhwa.unlockedPageIds.length, 4);

    assert.equal(harness.actions.synchronizeStoryPuzzleManhwaAccess([
      'story_puzzle_01_signal_calibration',
    ], '2026-02-02T02:02:02.000Z'), true);
    assert.equal(harness.getState().progressionState.manhwa.unlockedPageIds.length, 5);

    const mainPuzzleIds = STORY_PUZZLES
      .filter((puzzle) => puzzle.classification === 'main')
      .map((puzzle) => puzzle.id);
    harness.actions.synchronizeStoryPuzzleManhwaAccess(
      mainPuzzleIds,
      '2026-02-02T02:03:02.000Z',
    );
    assert.equal(harness.getState().progressionState.manhwa.unlockedPageIds.length, 71);
  });

  it('remains atomic for legacy unlock callers without affecting the final reader', () => {
    const state = progressionForUnlock(3);
    const page = createManhwaPageAccessDefinition({
      pageId: 'manhwa_ch01_page_01',
      pageNumber: 3,
      prerequisitePageId: 'manhwa_ch00_page_01',
    });
    const result = applyManhwaPageUnlockTransaction(
      state,
      page,
      '2026-02-02T02:02:02.000Z',
    );
    assert.equal(result.success, true);
    assert.equal(result.state.resources.memoryShards.spendableBalance, 0);
    assert.ok(result.state.manhwa.unlockedPageIds.includes('manhwa_ch01_page_01'));
  });

  it('does not charge an already unlocked final page twice', () => {
    const initial = buildInitialState();
    const harness = createHarness(initial);
    const result = harness.actions.unlockManhwaPage('manhwa_ch01_page_01');
    assert.equal(result.success, true);
    assert.equal(result.alreadyUnlocked, true);
    assert.equal(result.costSpent, 0);
  });
});

describe('Final Manhwa migration boundary', () => {
  it('resets only unmappable old Manhwa progress to the final publication', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    canonical.manhwa.manifestVersion = 0;
    canonical.manhwa.unlockedPageIds = ['manhwa_ch01_page_01', 'manhwa_ch01_page_02'];
    canonical.manhwa.viewedPageIds = ['manhwa_ch01_page_02'];
    const migrated = migrateGameState({ progressionState: canonical }, GAME_SAVE_VERSION);
    assert.equal(migrated.progressionState?.manhwa.unlockedPageIds.length, 4);
    assert.equal(
      migrated.progressionState?.manhwa.unlockedPageIds.at(-1),
      'manhwa_ch01_page_02',
    );
    assert.deepEqual(migrated.progressionState?.manhwa.viewedPageIds, []);
    assert.equal(migrated.progressionState?.manhwa.lastReadPageId, null);
  });

  it('keeps a current final-manifest Continue Reading checkpoint', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    canonical.manhwa.unlockedPageIds.push('manhwa_ch03_page_04');
    canonical.manhwa.lastReadPageId = 'manhwa_ch03_page_04';
    canonical.manhwa.lastReadGlobalPageNumber = 32;
    canonical.manhwa.lastReadChapterId = 'chapter_3';
    canonical.manhwa.lastReadAt = '2026-02-02T02:02:02.000Z';
    const migrated = migrateGameState({ progressionState: canonical }, GAME_SAVE_VERSION);
    assert.equal(migrated.progressionState?.manhwa.lastReadPageId, 'manhwa_ch03_page_04');
    assert.equal(migrated.progressionState?.manhwa.lastReadGlobalPageNumber, 32);
  });
});
