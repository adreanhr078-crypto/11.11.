import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createManhwaArchiveActions } from '../application/game/createManhwaArchiveActions';
import {
  CHAPTER_01_MANHWA_ACCESS_DEFINITIONS,
  CHAPTER_01_MANHWA_REACHABILITY,
} from '../application/game/manhwaArchiveReachability';
import type { GameState } from '../core/gameTypes';
import {
  createManhwaUnlockReceiptKey,
} from '../core/manhwaArchiveTypes';
import {
  applyManhwaPageUnlockTransaction,
  createManhwaPageAccessDefinition,
} from '../domain/manhwa/manhwaArchiveProgression';
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

function progressionWithShards(balance: number) {
  const progression = structuredClone(buildInitialState().progressionState);
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
    const update = typeof partial === 'function'
      ? partial(state)
      : partial;
    state = { ...state, ...update };
  };
  return {
    actions: createManhwaArchiveActions(set, get),
    getState: get,
  };
}

describe('Manhwa Archive reachability', () => {
  it('documents the fixed cost and current Chapter 01 ceiling', () => {
    assert.equal(CHAPTER_01_MANHWA_ACCESS_DEFINITIONS.length, 29);
    assert.equal(
      CHAPTER_01_MANHWA_ACCESS_DEFINITIONS.reduce(
        (total, page) => total + page.shardCost,
        0,
      ),
      134,
    );
    assert.deepEqual(CHAPTER_01_MANHWA_REACHABILITY, {
      availableShards: 20,
      totalPaidCost: 134,
      spendToHighestReachablePage: 19,
      remainingShards: 1,
      additionalShardsRequiredForFullArchive: 114,
      highestReachablePageId: 'manhwa_ch01_page_06',
      highestReachablePageNumber: 6,
      fullyReachable: false,
      unreachablePageIds: CHAPTER_01_MANHWA_ACCESS_DEFINITIONS
        .slice(6)
        .map((page) => page.pageId),
    });
    assert.equal(
      CHAPTER_01_MANHWA_REACHABILITY.unreachablePageIds[0],
      'manhwa_ch01_page_07',
    );
  });
});

describe('Manhwa Archive unlock transaction', () => {
  it('spends canonical balance atomically without consuming discovery records', () => {
    const state = progressionWithShards(3);
    const discoverySnapshot = structuredClone(
      state.resources.memoryShards,
    );
    const page = createManhwaPageAccessDefinition({
      pageId: 'manhwa_ch01_page_02',
      pageNumber: 2,
      prerequisitePageId: 'manhwa_ch01_page_01',
    });
    const result = applyManhwaPageUnlockTransaction(
      state,
      page,
      '2026-02-02T02:02:02.000Z',
    );

    assert.equal(result.success, true);
    assert.equal(result.alreadyUnlocked, false);
    assert.equal(result.costSpent, 3);
    assert.equal(result.state.resources.memoryShards.spendableBalance, 0);
    assert.equal(result.state.resources.memoryShards.totalSpent, 3);
    assert.deepEqual(
      result.state.resources.memoryShards.discoveredShardIds,
      discoverySnapshot.discoveredShardIds,
    );
    assert.deepEqual(
      result.state.resources.memoryShards.discoveredAt,
      discoverySnapshot.discoveredAt,
    );
    assert.ok(
      result.state.manhwa.unlockedPageIds.includes(
        'manhwa_ch01_page_02',
      ),
    );
    assert.ok(
      result.state.manhwa.claimedPageUnlockReceipts.includes(
        'manhwa_ch01_page_02:unlock:1',
      ),
    );
    assert.equal(state.resources.memoryShards.spendableBalance, 3);
    assert.equal(
      state.manhwa.unlockedPageIds.includes('manhwa_ch01_page_02'),
      false,
    );
  });

  it('rejects invalid, out-of-order, and unaffordable unlocks unchanged', () => {
    const state = progressionWithShards(2);
    const snapshot = structuredClone(state);
    const pageTwo = createManhwaPageAccessDefinition({
      pageId: 'manhwa_ch01_page_02',
      pageNumber: 2,
      prerequisitePageId: 'manhwa_ch01_page_01',
    });
    const insufficient = applyManhwaPageUnlockTransaction(
      state,
      pageTwo,
      '2026-02-02T02:02:02.000Z',
    );
    assert.equal(insufficient.failureReason, 'insufficient-shards');
    assert.strictEqual(insufficient.state, state);

    const pageThree = createManhwaPageAccessDefinition({
      pageId: 'manhwa_ch01_page_03',
      pageNumber: 3,
      prerequisitePageId: 'manhwa_ch01_page_02',
    });
    const outOfOrder = applyManhwaPageUnlockTransaction(
      state,
      pageThree,
      '2026-02-02T02:02:02.000Z',
    );
    assert.equal(outOfOrder.failureReason, 'previous-page-required');
    assert.strictEqual(outOfOrder.state, state);

    const invalidTime = applyManhwaPageUnlockTransaction(
      progressionWithShards(3),
      pageTwo,
      'not-a-timestamp',
    );
    assert.equal(invalidTime.failureReason, 'invalid-timestamp');
    assert.deepEqual(state, snapshot);
  });

  it('does not charge twice before or after persistence reload', () => {
    const initial = buildInitialState();
    const harness = createHarness({
      ...initial,
      progressionState: progressionWithShards(5),
    });
    const first = harness.actions.unlockManhwaPage(
      'manhwa_ch01_page_02',
      '2026-02-02T02:02:02.000Z',
    );
    assert.equal(first.success, true);
    assert.equal(first.costSpent, 3);

    const duplicate = harness.actions.unlockManhwaPage(
      'manhwa_ch01_page_02',
      '2026-02-02T02:03:02.000Z',
    );
    assert.equal(duplicate.success, true);
    assert.equal(duplicate.alreadyUnlocked, true);
    assert.equal(duplicate.costSpent, 0);
    assert.equal(
      harness.getState().progressionState.resources.memoryShards
        .spendableBalance,
      2,
    );

    const saved = partializeGameState(harness.getState());
    const reloaded = mergeGameState(
      migrateGameState(saved, GAME_SAVE_VERSION),
      buildInitialState(),
    );
    const reloadedHarness = createHarness(reloaded);
    const afterReload = reloadedHarness.actions.unlockManhwaPage(
      'manhwa_ch01_page_02',
      '2026-02-02T02:04:02.000Z',
    );
    assert.equal(afterReload.success, true);
    assert.equal(afterReload.alreadyUnlocked, true);
    assert.equal(afterReload.costSpent, 0);
    assert.equal(
      reloadedHarness.getState().progressionState.resources.memoryShards
        .spendableBalance,
      2,
    );
    assert.ok(
      reloadedHarness.getState().unlockedManhwaPageIds.includes(
        'manhwa_ch01_page_02',
      ),
    );
  });
});

describe('Manhwa Archive migration receipts', () => {
  it('creates missing receipts only for pages proven unlocked', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    canonical.manhwa.unlockedPageIds = [
      'manhwa_ch01_page_01',
      'manhwa_ch01_page_02',
    ];
    canonical.manhwa.claimedPageUnlockReceipts = [];
    const migrated = migrateGameState({
      progressionState: canonical,
    }, 12);

    assert.deepEqual(
      migrated.progressionState?.manhwa.claimedPageUnlockReceipts,
      [
        createManhwaUnlockReceiptKey('manhwa_ch01_page_01'),
        createManhwaUnlockReceiptKey('manhwa_ch01_page_02'),
      ],
    );
  });

  it('does not treat an orphan receipt as proof of an unlock', () => {
    const canonical = structuredClone(buildInitialState().progressionState);
    canonical.manhwa.unlockedPageIds = ['manhwa_ch01_page_01'];
    canonical.manhwa.claimedPageUnlockReceipts = [
      createManhwaUnlockReceiptKey('manhwa_ch01_page_01'),
      createManhwaUnlockReceiptKey('manhwa_ch01_page_02'),
    ];
    const migrated = migrateGameState({
      progressionState: canonical,
      unlockedManhwaPageIds: ['manhwa_ch01_page_02'],
    }, 12);

    assert.deepEqual(
      migrated.progressionState?.manhwa.unlockedPageIds,
      ['manhwa_ch01_page_01'],
    );
    assert.deepEqual(
      migrated.progressionState?.manhwa.claimedPageUnlockReceipts,
      [createManhwaUnlockReceiptKey('manhwa_ch01_page_01')],
    );
  });

  it('accepts the official legacy unlocked-page field as additional proof', () => {
    const migrated = migrateGameState({
      unlockedManhwaPageIds: ['manhwa_ch01_page_02'],
      claimedPageUnlockReceipts: [
        createManhwaUnlockReceiptKey('manhwa_ch01_page_02'),
      ],
    }, 12);

    assert.ok(
      migrated.progressionState?.manhwa.unlockedPageIds.includes(
        'manhwa_ch01_page_02',
      ),
    );
    assert.ok(
      migrated.progressionState?.manhwa.claimedPageUnlockReceipts.includes(
        createManhwaUnlockReceiptKey('manhwa_ch01_page_02'),
      ),
    );
  });
});
