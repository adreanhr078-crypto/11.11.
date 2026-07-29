import type {
  AchievementProgressEntry,
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import { GAME_PROGRESSION_SCHEMA_VERSION } from '../../core/gameProgressionDefaults';
import {
  createManhwaUnlockReceiptKey,
  getManhwaUnlockReceiptPageId,
} from '../../core/manhwaArchiveTypes';
import {
  synchronizeAchievementProgress,
} from '../achievements/achievementProgression';
import {
  normalizeEchoEventProgressState,
} from '../echo/echoEventReducer';

export function clampProgressMetric(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(
    values.map((value) => value.trim()).filter(Boolean),
  )] as T[];
}

function normalizeAchievementEntry(
  entry: AchievementProgressEntry,
): AchievementProgressEntry {
  const target = Math.max(1, normalizeNonNegativeInteger(entry.target));
  const current = Math.min(
    target,
    normalizeNonNegativeInteger(entry.current),
  );
  return {
    current,
    target,
    unlockedAt: typeof entry.unlockedAt === 'number'
      && Number.isFinite(entry.unlockedAt)
      ? entry.unlockedAt
      : null,
  };
}

/**
 * Reconciles canonical progression invariants without mutating the input.
 * Unlock ledgers are monotonic; spending affects only the spendable balance.
 */
export function reconcileGameProgressionState(
  state: GameProgressionState,
): GameProgressionState {
  const completedPuzzleIds = uniqueStrings(
    state.puzzles.journey.completedPuzzleIds,
  );
  const completed = new Set(completedPuzzleIds);
  const unlockedPageIds = uniqueStrings(state.manhwa.unlockedPageIds);
  const claimedPageUnlockReceipts = uniqueStrings(
    state.manhwa.claimedPageUnlockReceipts,
  ).filter((receipt) => {
    const pageId = getManhwaUnlockReceiptPageId(receipt);
    return pageId !== null && unlockedPageIds.includes(pageId);
  });
  for (const pageId of unlockedPageIds) {
    if (!claimedPageUnlockReceipts.some(
      (receipt) => getManhwaUnlockReceiptPageId(receipt) === pageId,
    )) {
      claimedPageUnlockReceipts.push(
        createManhwaUnlockReceiptKey(pageId),
      );
    }
  }
  const normalizedAchievementProgress = {
    byId: Object.fromEntries(
      Object.entries(state.achievements.byId).map(([id, entry]) => [
        id,
        normalizeAchievementEntry(entry),
      ]),
    ),
  };
  const achievements = synchronizeAchievementProgress(
    normalizedAchievementProgress,
    {
      completedPuzzleCount: completedPuzzleIds.length,
      echoTrust: clampProgressMetric(state.echo.trust),
    },
    null,
  );

  return {
    ...state,
    schemaVersion: GAME_PROGRESSION_SCHEMA_VERSION,
    resources: {
      coins: normalizeNonNegativeInteger(state.resources.coins),
      memoryShards: {
        spendableBalance: normalizeNonNegativeInteger(
          state.resources.memoryShards.spendableBalance,
        ),
        discoveredShardIds: uniqueStrings(
          state.resources.memoryShards.discoveredShardIds,
        ),
        discoveredAt: { ...state.resources.memoryShards.discoveredAt },
        totalSpent: normalizeNonNegativeInteger(
          state.resources.memoryShards.totalSpent,
        ),
      },
    },
    puzzles: {
      ...state.puzzles,
      journey: {
        ...state.puzzles.journey,
        completedPuzzleIds,
        skippedPuzzleIds: uniqueStrings(
          state.puzzles.journey.skippedPuzzleIds,
        ).filter((puzzleId) => !completed.has(puzzleId)),
        unlockedChapterIds: uniqueStrings(
          state.puzzles.journey.unlockedChapterIds,
        ),
        completedChapterIds: uniqueStrings(
          state.puzzles.journey.completedChapterIds,
        ),
      },
      claimedRewardReceipts: uniqueStrings(
        state.puzzles.claimedRewardReceipts,
      ),
    },
    manhwa: {
      ...state.manhwa,
      unlockedPageIds,
      viewedPageIds: uniqueStrings(state.manhwa.viewedPageIds).filter(
        (pageId) => unlockedPageIds.includes(pageId),
      ),
      claimedPageUnlockReceipts,
      claimedPageEffectIds: uniqueStrings(
        state.manhwa.claimedPageEffectIds,
      ),
    },
    achievements,
    echo: {
      ...state.echo,
      humanity: clampProgressMetric(state.echo.humanity),
      trust: clampProgressMetric(state.echo.trust),
      fear: clampProgressMetric(state.echo.fear),
      anger: clampProgressMetric(state.echo.anger),
      memoryStability: clampProgressMetric(state.echo.memoryStability),
      memoriesRecovered: clampProgressMetric(state.echo.memoriesRecovered),
      corruption: clampProgressMetric(state.echo.corruption),
      hope: clampProgressMetric(state.echo.hope),
      ragePoints: clampProgressMetric(state.echo.ragePoints),
      sadness: clampProgressMetric(state.echo.sadness),
      loneliness: clampProgressMetric(state.echo.loneliness),
      awareness: clampProgressMetric(state.echo.awareness),
      isolation: clampProgressMetric(state.echo.isolation),
      forgivenessPoints: clampProgressMetric(
        state.echo.forgivenessPoints,
      ),
    },
    echoEvents: normalizeEchoEventProgressState(state.echoEvents),
    story: {
      narrative: state.story.narrative,
    },
  };
}
