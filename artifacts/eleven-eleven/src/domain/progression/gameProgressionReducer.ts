import type {
  EchoProgressState,
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  EchoEffect,
  PuzzleReward,
  PuzzleRewardFailureReason,
  PuzzleRewardTransactionResult,
} from '../../core/puzzleRewardTypes';
import {
  CANONICAL_ECHO_METRIC_KEYS,
} from '../../core/echoEventTypes';
import type { PuzzleId } from '../content/contracts';
import {
  applyCanonicalEchoEffect,
  normalizeCanonicalEchoEffect,
} from '../echo/canonicalEchoMetrics';
import {
  increaseAchievementProgress,
  synchronizeAchievementProgress,
} from '../achievements/achievementProgression';
import {
  clampProgressMetric,
  normalizeNonNegativeInteger,
  reconcileGameProgressionState,
} from './gameProgressionState';

export interface GameProgressionTransitionResult {
  success: boolean;
  state: GameProgressionState;
}

const ECHO_EFFECT_KEYS = new Set<keyof EchoProgressState>([
  'humanity',
  'trust',
  'fear',
  'anger',
  'memoryStability',
  'memoriesRecovered',
  'corruption',
  'hope',
  'ragePoints',
  'sadness',
  'loneliness',
  'awareness',
  'isolation',
  'forgivenessPoints',
]);

function normalizedPositiveAmount(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : null;
}

function normalizeId(value: string): string {
  return value.trim();
}

function isValidTimestamp(timestamp: string): boolean {
  return Boolean(timestamp.trim()) && Number.isFinite(Date.parse(timestamp));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function failedReward(
  state: GameProgressionState,
  receiptKey: string,
  failureReason: PuzzleRewardFailureReason,
  fingerprint = '',
  conflict = false,
): PuzzleRewardTransactionResult {
  return {
    success: false,
    alreadyClaimed: false,
    conflict,
    receiptKey,
    fingerprint,
    state,
    unlockedPageIds: [],
    failureReason,
  };
}

export function addCoins(
  state: GameProgressionState,
  amount: number,
): GameProgressionTransitionResult {
  const increment = normalizedPositiveAmount(amount);
  if (increment === null) return { success: false, state };
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        coins: state.resources.coins + increment,
      },
    },
  };
}

export function setCoinBalance(
  state: GameProgressionState,
  amount: number,
): GameProgressionTransitionResult {
  if (!Number.isFinite(amount) || amount < 0) {
    return { success: false, state };
  }
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        coins: normalizeNonNegativeInteger(amount),
      },
    },
  };
}

export function spendCoins(
  state: GameProgressionState,
  amount: number,
): GameProgressionTransitionResult {
  const cost = normalizedPositiveAmount(amount);
  if (cost === null || state.resources.coins < cost) {
    return { success: false, state };
  }
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        coins: state.resources.coins - cost,
      },
    },
  };
}

export function grantMemoryShard(
  state: GameProgressionState,
  shardId: string,
  timestamp: string,
): GameProgressionTransitionResult {
  const id = normalizeId(shardId);
  if (
    !id
    || !isValidTimestamp(timestamp)
    || state.resources.memoryShards.discoveredShardIds.includes(id)
  ) {
    return { success: false, state };
  }
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        memoryShards: {
          ...state.resources.memoryShards,
          spendableBalance:
            state.resources.memoryShards.spendableBalance + 1,
          discoveredShardIds: [
            ...state.resources.memoryShards.discoveredShardIds,
            id,
          ],
          discoveredAt: {
            ...state.resources.memoryShards.discoveredAt,
            [id]: timestamp,
          },
        },
      },
    },
  };
}

export function spendMemoryShards(
  state: GameProgressionState,
  amount: number,
): GameProgressionTransitionResult {
  const cost = normalizedPositiveAmount(amount);
  const shards = state.resources.memoryShards;
  if (cost === null || shards.spendableBalance < cost) {
    return { success: false, state };
  }
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        memoryShards: {
          ...shards,
          spendableBalance: shards.spendableBalance - cost,
          totalSpent: shards.totalSpent + cost,
        },
      },
    },
  };
}

export function resetMemoryShardProgress(
  state: GameProgressionState,
): GameProgressionTransitionResult {
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        memoryShards: {
          spendableBalance: 0,
          discoveredShardIds: [],
          discoveredAt: {},
          totalSpent: 0,
        },
      },
    },
  };
}

function validateEchoEffect(effect: EchoEffect): boolean {
  return Object.entries(effect).every(([key, amount]) => (
    ECHO_EFFECT_KEYS.has(key as keyof EchoProgressState)
    && typeof amount === 'number'
    && Number.isFinite(amount)
  ));
}

function orderedRecord(
  value: Readonly<Record<string, number | boolean>> | undefined,
): Record<string, number | boolean> {
  return Object.fromEntries(
    Object.entries(value ?? {}).sort(([left], [right]) => (
      left.localeCompare(right)
    )),
  );
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Fingerprints the source-owned Puzzle payload. Timestamp is intentionally
 * excluded so an identical retry after reload remains idempotent.
 */
export function createPuzzleRewardFingerprint(
  puzzleId: string,
  reward: PuzzleReward,
): string {
  const normalizedEffect = reward.echoEffect
    ? normalizeCanonicalEchoEffect(reward.echoEffect)
    : undefined;
  if (reward.echoEffect && !normalizedEffect) return '';
  const echoEffect = Object.fromEntries(
    CANONICAL_ECHO_METRIC_KEYS.flatMap((metric) => {
      const amount = normalizedEffect?.[metric];
      return amount === undefined ? [] : [[metric, amount]];
    }),
  );
  const payload = {
    puzzleId: puzzleId.trim(),
    rewardVersion: reward.rewardVersion,
    coins: reward.coins ?? 0,
    memoryShards: (reward.memoryShards ?? [])
      .map(({ id }) => id.trim())
      .sort(),
    echoEffect,
    storyFlags: orderedRecord(reward.storyFlags),
    achievementProgress: orderedRecord(reward.achievementProgress),
    pageUnlocks: (reward.pageUnlocks ?? [])
      .map((unlock) => ({
        pageId: unlock.pageId.trim(),
        requiredShardIds: unlock.requiredShardIds
          .map((id) => id.trim())
          .sort(),
      }))
      .sort((left, right) => left.pageId.localeCompare(right.pageId)),
  };
  return `puzzle-v1-${fnv1a(JSON.stringify(payload))}`;
}

export function applyEchoEffects(
  state: GameProgressionState,
  effect: EchoEffect,
  unlockedAt: number | null = null,
): GameProgressionTransitionResult {
  if (!validateEchoEffect(effect)) return { success: false, state };
  const echo = { ...state.echo };
  for (const [key, amount] of Object.entries(effect) as Array<
    [keyof EchoProgressState, number]
  >) {
    echo[key] = clampProgressMetric(echo[key] + amount);
  }
  return {
    success: true,
    state: {
      ...state,
      echo,
      achievements: synchronizeAchievementProgress(
        state.achievements,
        {
          completedPuzzleCount:
            state.puzzles.journey.completedPuzzleIds.length,
          echoTrust: echo.trust,
        },
        unlockedAt,
      ),
    },
  };
}

interface ValidatedReward {
  shardIds: string[];
  pageUnlocks: Array<{
    pageId: string;
    requiredShardIds: string[];
  }>;
}

function validateReward(
  state: GameProgressionState,
  puzzleId: string,
  reward: PuzzleReward,
  timestamp: string,
  receiptKey: string,
):
  | { valid: true; value: ValidatedReward }
  | { valid: false; result: PuzzleRewardTransactionResult } {
  if (!/^puzzle_[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(puzzleId)) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-puzzle-id'),
    };
  }
  if (!Number.isSafeInteger(reward.rewardVersion) || reward.rewardVersion < 1) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-reward-version'),
    };
  }
  if (!isValidTimestamp(timestamp)) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-timestamp'),
    };
  }
  if (
    reward.coins !== undefined
    && (
      !Number.isSafeInteger(reward.coins)
      || reward.coins < 0
    )
  ) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-coins'),
    };
  }

  const shardIds = (reward.memoryShards ?? []).map(({ id }) => normalizeId(id));
  if (shardIds.some((id) => !id)) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-shard'),
    };
  }
  if (unique(shardIds).length !== shardIds.length) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'duplicate-shard'),
    };
  }
  if (
    reward.echoEffect
    && !normalizeCanonicalEchoEffect(reward.echoEffect)
  ) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-echo-effect'),
    };
  }
  if (
    reward.storyFlags
    && Object.entries(reward.storyFlags).some(([flag, value]) => (
      !flag.trim() || typeof value !== 'boolean'
    ))
  ) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-story-flag'),
    };
  }
  if (reward.achievementProgress) {
    for (const [achievementId, increment] of Object.entries(
      reward.achievementProgress,
    )) {
      if (
        !achievementId.trim()
        || !Number.isSafeInteger(increment)
        || increment <= 0
      ) {
        return {
          valid: false,
          result: failedReward(
            state,
            receiptKey,
            'invalid-achievement-progress',
          ),
        };
      }
      if (!state.achievements.byId[achievementId]) {
        return {
          valid: false,
          result: failedReward(state, receiptKey, 'unknown-achievement'),
        };
      }
    }
  }

  const pageUnlocks = (reward.pageUnlocks ?? []).map((unlock) => ({
    pageId: normalizeId(unlock.pageId),
    requiredShardIds: unlock.requiredShardIds.map(normalizeId),
  }));
  if (
    unique(pageUnlocks.map(({ pageId }) => pageId)).length
      !== pageUnlocks.length
    || pageUnlocks.some(({ pageId, requiredShardIds }) => (
      !pageId
      || requiredShardIds.some((id) => !id)
      || unique(requiredShardIds).length !== requiredShardIds.length
    ))
  ) {
    return {
      valid: false,
      result: failedReward(state, receiptKey, 'invalid-page-unlock'),
    };
  }

  return {
    valid: true,
    value: {
      shardIds,
      pageUnlocks,
    },
  };
}

/**
 * Computes an entire puzzle reward before the application layer performs its
 * single store write. Invalid input and duplicate receipts return the original
 * state object, so partial rewards cannot escape.
 */
export function applyPuzzleRewardTransaction(
  state: GameProgressionState,
  puzzleId: string,
  reward: PuzzleReward,
  timestamp: string,
): PuzzleRewardTransactionResult {
  const normalizedPuzzleId = puzzleId.trim();
  const receiptKey = `${normalizedPuzzleId}:${reward.rewardVersion}`;
  const validation = validateReward(
    state,
    normalizedPuzzleId,
    reward,
    timestamp,
    receiptKey,
  );
  if (!validation.valid) return validation.result;
  const fingerprint = createPuzzleRewardFingerprint(
    normalizedPuzzleId,
    reward,
  );
  if (state.puzzles.claimedRewardReceipts.includes(receiptKey)) {
    const storedFingerprint =
      state.puzzles.rewardFingerprintsByReceiptKey?.[receiptKey];
    if (storedFingerprint && storedFingerprint !== fingerprint) {
      return failedReward(
        state,
        receiptKey,
        'reward-conflict',
        fingerprint,
        true,
      );
    }
    return {
      success: false,
      alreadyClaimed: true,
      conflict: false,
      receiptKey,
      fingerprint,
      state,
      unlockedPageIds: [],
    };
  }

  const discoveredShardIds = [
    ...state.resources.memoryShards.discoveredShardIds,
  ];
  const discoveredAt = {
    ...state.resources.memoryShards.discoveredAt,
  };
  let newlyDiscoveredCount = 0;
  for (const shardId of validation.value.shardIds) {
    if (discoveredShardIds.includes(shardId)) continue;
    discoveredShardIds.push(shardId);
    discoveredAt[shardId] = timestamp;
    newlyDiscoveredCount += 1;
  }

  const unlockedAt = Date.parse(timestamp);
  const echoTransition = reward.echoEffect
    ? applyCanonicalEchoEffect(state.echo, reward.echoEffect)
    : { success: true, echo: state.echo };
  const achievementProgress = increaseAchievementProgress(
    state.achievements,
    reward.achievementProgress ?? {},
    unlockedAt,
  );

  const unlockedPageIds = [
    ...state.manhwa.unlockedPageIds,
  ];
  const pageUnlockedAt = {
    ...state.manhwa.pageUnlockedAt,
  };
  const newlyUnlockedPageIds: string[] = [];
  for (const unlock of validation.value.pageUnlocks) {
    if (
      unlockedPageIds.includes(unlock.pageId)
      || !unlock.requiredShardIds.every(
        (shardId) => discoveredShardIds.includes(shardId),
      )
    ) {
      continue;
    }
    unlockedPageIds.push(unlock.pageId);
    pageUnlockedAt[unlock.pageId] = timestamp;
    newlyUnlockedPageIds.push(unlock.pageId);
  }

  const completedPuzzleIds = unique([
    ...state.puzzles.journey.completedPuzzleIds,
    normalizedPuzzleId as PuzzleId,
  ]);
  const synchronizedAchievementProgress = synchronizeAchievementProgress(
    achievementProgress,
    {
      completedPuzzleCount: completedPuzzleIds.length,
      echoTrust: echoTransition.echo.trust,
    },
    unlockedAt,
  );
  const nextState = reconcileGameProgressionState({
    ...state,
    resources: {
      coins: state.resources.coins + (reward.coins ?? 0),
      memoryShards: {
        ...state.resources.memoryShards,
        spendableBalance:
          state.resources.memoryShards.spendableBalance
          + newlyDiscoveredCount,
        discoveredShardIds,
        discoveredAt,
      },
    },
    puzzles: {
      ...state.puzzles,
      journey: {
        ...state.puzzles.journey,
        completedPuzzleIds,
        skippedPuzzleIds:
          state.puzzles.journey.skippedPuzzleIds.filter(
            (id) => id !== normalizedPuzzleId,
          ),
      },
      claimedRewardReceipts: [
        ...state.puzzles.claimedRewardReceipts,
        receiptKey,
      ],
      rewardFingerprintsByReceiptKey: {
        ...(state.puzzles.rewardFingerprintsByReceiptKey ?? {}),
        [receiptKey]: fingerprint,
      },
    },
    manhwa: {
      ...state.manhwa,
      unlockedPageIds,
      pageUnlockedAt,
    },
    achievements: {
      byId: synchronizedAchievementProgress.byId,
    },
    echo: echoTransition.echo,
    story: {
      ...state.story,
      narrative: {
        ...state.story.narrative,
        activeFlags: {
          ...state.story.narrative.activeFlags,
          ...(reward.storyFlags ?? {}),
        },
      },
    },
  });

  return {
    success: true,
    alreadyClaimed: false,
    conflict: false,
    receiptKey,
    fingerprint,
    state: nextState,
    unlockedPageIds: newlyUnlockedPageIds,
  };
}
