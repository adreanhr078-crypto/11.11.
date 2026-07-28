import type { GameProgressionState } from '../../core/gameProgressionTypes';
import {
  createManhwaUnlockReceiptKey,
  MANHWA_UNLOCK_VERSION,
  type ManhwaPageAccessDefinition,
  type ManhwaReachabilityReport,
  type ManhwaUnlockFailureReason,
  type ManhwaUnlockTransactionResult,
} from '../../core/manhwaArchiveTypes';
import {
  reconcileGameProgressionState,
} from '../progression/gameProgressionState';

function isValidTimestamp(timestamp: string): boolean {
  return Boolean(timestamp.trim()) && Number.isFinite(Date.parse(timestamp));
}

function failedUnlock(
  state: GameProgressionState,
  receiptKey: string,
  failureReason: ManhwaUnlockFailureReason,
): ManhwaUnlockTransactionResult {
  return {
    success: false,
    alreadyUnlocked: false,
    receiptKey,
    costSpent: 0,
    state,
    failureReason,
  };
}

export function getManhwaPageShardCost(pageNumber: number): number {
  if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) return -1;
  if (pageNumber === 1) return 0;
  if (pageNumber <= 3) return 3;
  if (pageNumber <= 5) return 4;
  return 5;
}

export function createManhwaPageAccessDefinition(
  input: Omit<
    ManhwaPageAccessDefinition,
    'shardCost' | 'unlockVersion'
  >,
): ManhwaPageAccessDefinition {
  return {
    ...input,
    shardCost: getManhwaPageShardCost(input.pageNumber),
    unlockVersion: MANHWA_UNLOCK_VERSION,
  };
}

/**
 * Computes the maximum sequential page reachable from a fixed shard economy.
 * Page 01 is free; every later page consumes its configured shard cost.
 */
export function createManhwaReachabilityReport(
  pages: readonly ManhwaPageAccessDefinition[],
  availableShards: number,
): ManhwaReachabilityReport {
  const orderedPages = [...pages].sort(
    (left, right) => left.pageNumber - right.pageNumber,
  );
  const normalizedShards = Number.isFinite(availableShards)
    ? Math.max(0, Math.floor(availableShards))
    : 0;
  const totalPaidCost = orderedPages.reduce(
    (total, page) => total + Math.max(0, page.shardCost),
    0,
  );
  let spent = 0;
  let highestReachablePage = orderedPages[0];
  let previousPageId: string | undefined;

  for (const page of orderedPages) {
    const sequential = (
      page.pageNumber === 1
      || page.prerequisitePageId === previousPageId
    );
    if (!sequential || spent + page.shardCost > normalizedShards) break;
    spent += page.shardCost;
    highestReachablePage = page;
    previousPageId = page.pageId;
  }

  const highestPageNumber = highestReachablePage?.pageNumber ?? 0;
  const unreachablePageIds = orderedPages
    .filter((page) => page.pageNumber > highestPageNumber)
    .map((page) => page.pageId);

  return {
    availableShards: normalizedShards,
    totalPaidCost,
    spendToHighestReachablePage: spent,
    remainingShards: normalizedShards - spent,
    additionalShardsRequiredForFullArchive: Math.max(
      0,
      totalPaidCost - normalizedShards,
    ),
    highestReachablePageId: highestReachablePage?.pageId ?? '',
    highestReachablePageNumber: highestPageNumber,
    fullyReachable: unreachablePageIds.length === 0,
    unreachablePageIds,
  };
}

/**
 * Pays for and unlocks exactly one page. The caller commits the returned state
 * in one store write. Discovery records are deliberately never consumed.
 */
export function applyManhwaPageUnlockTransaction(
  state: GameProgressionState,
  definition: ManhwaPageAccessDefinition,
  timestamp: string,
): ManhwaUnlockTransactionResult {
  const pageId = definition.pageId.trim();
  const prerequisitePageId = definition.prerequisitePageId?.trim();
  const receiptKey = createManhwaUnlockReceiptKey(
    pageId,
    definition.unlockVersion,
  );
  if (!pageId) {
    return failedUnlock(state, receiptKey, 'invalid-page-id');
  }
  if (
    !Number.isSafeInteger(definition.pageNumber)
    || definition.pageNumber < 1
  ) {
    return failedUnlock(state, receiptKey, 'invalid-page-number');
  }
  if (
    definition.pageNumber > 1
    && (!prerequisitePageId || prerequisitePageId === pageId)
  ) {
    return failedUnlock(state, receiptKey, 'invalid-prerequisite');
  }
  if (
    !Number.isSafeInteger(definition.shardCost)
    || definition.shardCost < 0
    || definition.shardCost
      !== getManhwaPageShardCost(definition.pageNumber)
  ) {
    return failedUnlock(state, receiptKey, 'invalid-cost');
  }
  if (
    !Number.isSafeInteger(definition.unlockVersion)
    || definition.unlockVersion < 1
  ) {
    return failedUnlock(state, receiptKey, 'invalid-version');
  }
  if (!isValidTimestamp(timestamp)) {
    return failedUnlock(state, receiptKey, 'invalid-timestamp');
  }

  const pageIsUnlocked = state.manhwa.unlockedPageIds.includes(pageId);
  const receiptExists = state.manhwa.claimedPageUnlockReceipts.includes(
    receiptKey,
  );
  if (receiptExists && !pageIsUnlocked) {
    return failedUnlock(state, receiptKey, 'receipt-without-unlock');
  }
  if (pageIsUnlocked) {
    const claimedPageUnlockReceipts = receiptExists
      ? state.manhwa.claimedPageUnlockReceipts
      : [...state.manhwa.claimedPageUnlockReceipts, receiptKey];
    return {
      success: true,
      alreadyUnlocked: true,
      receiptKey,
      costSpent: 0,
      state: receiptExists
        ? state
        : reconcileGameProgressionState({
            ...state,
            manhwa: {
              ...state.manhwa,
              claimedPageUnlockReceipts,
            },
          }),
    };
  }
  if (
    prerequisitePageId
    && !state.manhwa.unlockedPageIds.includes(prerequisitePageId)
  ) {
    return failedUnlock(state, receiptKey, 'previous-page-required');
  }

  const shards = state.resources.memoryShards;
  if (shards.spendableBalance < definition.shardCost) {
    return failedUnlock(state, receiptKey, 'insufficient-shards');
  }

  const nextState = reconcileGameProgressionState({
    ...state,
    resources: {
      ...state.resources,
      memoryShards: {
        ...shards,
        spendableBalance: shards.spendableBalance - definition.shardCost,
        totalSpent: shards.totalSpent + definition.shardCost,
      },
    },
    manhwa: {
      ...state.manhwa,
      unlockedPageIds: [...state.manhwa.unlockedPageIds, pageId],
      pageUnlockedAt: {
        ...state.manhwa.pageUnlockedAt,
        [pageId]: timestamp,
      },
      claimedPageUnlockReceipts: [
        ...state.manhwa.claimedPageUnlockReceipts,
        receiptKey,
      ],
    },
  });

  return {
    success: true,
    alreadyUnlocked: false,
    receiptKey,
    costSpent: definition.shardCost,
    state: nextState,
  };
}
