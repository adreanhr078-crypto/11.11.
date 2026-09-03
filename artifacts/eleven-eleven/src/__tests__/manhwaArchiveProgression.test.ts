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
  FINAL_MANHWA_MANIFEST_VERSION,
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
  FINAL_MANHWA_PAGE_COUNT,
  FINAL_MANHWA_PAGES,
  FINAL_MANHWA_RELEASED_PAGE_COUNT,
} from '../content/manhwa/finalManhwa';
import {
  GAME_SAVE_VERSION,
  migrateGameState,
} from '../infrastructure/persistence/gamePersistence';
import type { GameStateGetter, GameStateSetter } from '../application/game/statePorts';
import { buildInitialState } from '../stores/gameStoreHelpers';
import { STORY_PUZZLES } from '../content/puzzles/storyPuzzleCatalog';

function progressionForUnlock(balance: number) {
  const progression = structuredClone(buildInitialState().progressionState);
  const firstPageId = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[1]!.id;
  progression.manhwa.unlockedPageIds = [firstPageId];
  progression.manhwa.claimedPageUnlockReceipts = [
    createManhwaUnlockReceiptKey(firstPageId),
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

describe('corrected Final Manhwa access definitions', () => {
  it('keeps all 70 physical pages under immutable V3 IDs but exposes only p1–9', () => {
    assert.equal(FINAL_MANHWA_PAGES.length, FINAL_MANHWA_PAGE_COUNT);
    assert.equal(FINAL_MANHWA_ACCESS_DEFINITIONS.length, FINAL_MANHWA_RELEASED_PAGE_COUNT);
    assert.equal(FINAL_MANHWA_ACCESS_DEFINITIONS[0]?.pageId,
      FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[1]?.id);
    assert.equal(FINAL_MANHWA_ACCESS_DEFINITIONS.at(-1)?.pageId,
      FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[FINAL_MANHWA_RELEASED_PAGE_COUNT]?.id);
    assert.ok(FINAL_MANHWA_ACCESS_DEFINITIONS.every((definition) => (
      definition.pageId.startsWith('echo_network_final_2026_09_v1_page_')
    )));
    assert.equal(FINAL_MANHWA_REACHABILITY.availableShards, STORY_PUZZLES.length);
  });
});

describe('corrected Manhwa reader-window synchronization', () => {
  it('synchronizes only the published 1–9 opening window from verified current puzzle IDs', () => {
    const harness = createHarness(buildInitialState());
    assert.equal(harness.getState().progressionState.manhwa.unlockedPageIds.length, 7);

    assert.equal(harness.actions.synchronizeStoryPuzzleManhwaAccess([
      'story_puzzle_01_echo_network_signal_sync',
    ], '2026-02-02T02:02:02.000Z'), true);
    assert.equal(harness.getState().progressionState.manhwa.unlockedPageIds.length, 9);

    const mainPuzzleIds = STORY_PUZZLES
      .filter((puzzle) => puzzle.classification === 'main')
      .map((puzzle) => puzzle.id);
    assert.equal(harness.actions.synchronizeStoryPuzzleManhwaAccess(
      mainPuzzleIds,
      '2026-02-02T02:03:02.000Z',
    ), false);
    assert.deepEqual(
      harness.getState().progressionState.manhwa.unlockedPageIds,
      Array.from({ length: FINAL_MANHWA_RELEASED_PAGE_COUNT }, (_, index) => (
        FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[index + 1]!.id
      )),
    );
    assert.equal(harness.getState().progressionState.manhwa.unlockedPageIds.includes(
      FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[10]!.id,
    ), false);
  });

  it('never lets retained V2 puzzle IDs change the V3 reader window', () => {
    const harness = createHarness(buildInitialState());
    const before = structuredClone(harness.getState().progressionState.manhwa);

    assert.equal(harness.actions.synchronizeStoryPuzzleManhwaAccess([
      'story_puzzle_01_signal_calibration',
      'story_puzzle_20_core_sequence',
    ], '2026-02-02T02:02:02.000Z'), false);
    assert.deepEqual(harness.getState().progressionState.manhwa, before);
  });

  it('keeps the generic legacy transaction atomic without granting a V3 reader page', () => {
    const state = progressionForUnlock(3);
    const page = createManhwaPageAccessDefinition({
      pageId: 'legacy_test_page_02',
      pageNumber: 2,
      prerequisitePageId: FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[1]!.id,
    });
    const result = applyManhwaPageUnlockTransaction(
      state,
      page,
      '2026-02-02T02:02:02.000Z',
    );
    assert.equal(result.success, true);
    assert.equal(result.state.resources.memoryShards.spendableBalance, 0);
    assert.ok(result.state.manhwa.unlockedPageIds.includes('legacy_test_page_02'));
    assert.equal(result.state.manhwa.unlockedPageIds.includes(
      FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[2]!.id,
    ), false);
  });

  it('rejects a V2 page ID at the V3 archive action boundary', () => {
    const harness = createHarness(buildInitialState());
    const result = harness.actions.unlockManhwaPage('manhwa_ch01_page_01');
    assert.equal(result.success, false);
    assert.equal(result.failureReason, 'invalid-page-id');
    assert.equal(result.state, harness.getState().progressionState);
  });
});

describe('corrected Final Manhwa migration boundary', () => {
  it('resets an old-manifest reader to the V3 opening window while preserving the account shell', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    canonical.manhwa.manifestVersion = 2;
    canonical.manhwa.unlockedPageIds = ['manhwa_ch01_page_01', 'manhwa_ch01_page_02'];
    canonical.manhwa.viewedPageIds = ['manhwa_ch01_page_02'];
    canonical.resources.coins = 42;

    const migrated = migrateGameState({ progressionState: canonical }, GAME_SAVE_VERSION);
    assert.equal(migrated.progressionState?.resources.coins, 42);
    assert.deepEqual(
      migrated.progressionState?.manhwa.unlockedPageIds,
      Array.from({ length: 7 }, (_, index) => (
        FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[index + 1]!.id
      )),
    );
    assert.deepEqual(migrated.progressionState?.manhwa.viewedPageIds, []);
    assert.equal(migrated.progressionState?.manhwa.lastReadPageId, null);
  });

  it('does not accept V2 page records or checkpoints even when a save claims the V3 manifest', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    canonical.manhwa.manifestVersion = FINAL_MANHWA_MANIFEST_VERSION;
    canonical.manhwa.unlockedPageIds = ['manhwa_ch01_page_01'];
    canonical.manhwa.viewedPageIds = ['manhwa_ch01_page_01'];
    canonical.manhwa.lastReadPageId = 'manhwa_ch01_page_01';
    canonical.manhwa.lastReadGlobalPageNumber = 3;
    canonical.manhwa.lastReadChapterId = 'chapter_1';
    canonical.manhwa.lastReadAt = '2026-02-02T02:02:02.000Z';

    const migrated = migrateGameState({ progressionState: canonical }, GAME_SAVE_VERSION);
    assert.deepEqual(migrated.progressionState?.manhwa.unlockedPageIds, []);
    assert.deepEqual(migrated.progressionState?.manhwa.viewedPageIds, []);
    assert.equal(migrated.progressionState?.manhwa.lastReadPageId, null);
    assert.equal(migrated.progressionState?.manhwa.lastReadGlobalPageNumber, null);
  });

  it('keeps a V3 opening-page Continue Reading checkpoint', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    const page = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[9]!;
    canonical.manhwa.unlockedPageIds = [page.id];
    canonical.manhwa.lastReadPageId = page.id;
    canonical.manhwa.lastReadGlobalPageNumber = page.globalPageNumber;
    canonical.manhwa.lastReadChapterId = 'chapter_1';
    canonical.manhwa.lastReadAt = '2026-02-02T02:02:02.000Z';
    const migrated = migrateGameState({ progressionState: canonical }, GAME_SAVE_VERSION);
    assert.equal(migrated.progressionState?.manhwa.lastReadPageId, page.id);
    assert.equal(migrated.progressionState?.manhwa.lastReadGlobalPageNumber, 9);
  });
});
