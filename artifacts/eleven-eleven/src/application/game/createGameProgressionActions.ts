import type {
  GameActions,
  GameState,
} from '../../core/gameTypes';
import type { PuzzleRewardTransactionResult } from '../../core/puzzleRewardTypes';
import {
  addCoins,
  applyEchoEffects,
  applyPuzzleRewardTransaction,
  grantMemoryShard,
  resetMemoryShardProgress,
  setCoinBalance,
  spendCoins,
  spendMemoryShards,
} from '../../domain/progression/gameProgressionReducer';
import type {
  GameProgressionTransitionResult,
} from '../../domain/progression/gameProgressionReducer';
import {
  createAchievementViews,
} from '../../domain/achievements/achievementProgression';
import type {
  GameStateGetter,
  GameStateSetter,
  GameTimestampProvider,
} from './statePorts';

type PublicGameProgressionActions = Pick<
  GameActions,
  | 'addCoins'
  | 'spendCoins'
  | 'canAffordCoins'
  | 'setCoins'
  | 'grantMemoryShard'
  | 'spendMemoryShards'
  | 'hasMemoryShards'
  | 'applyEchoEffects'
  | 'applyPuzzleReward'
>;

export interface GameProgressionActions
  extends PublicGameProgressionActions {
  /** Compatibility-only reset used by the established developer/test action. */
  resetMemoryShards: () => void;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function receiptToPuzzleId(receipt: string): string {
  const separatorIndex = receipt.lastIndexOf(':');
  return separatorIndex > 0
    ? receipt.slice(0, separatorIndex)
    : receipt;
}

/**
 * The sole compatibility projection for canonical progression commands.
 *
 * New Echo channels project to their matching legacy view only. In particular,
 * humanity never writes hope, anger never writes ragePoints, and
 * memoryStability never writes memoriesRecovered.
 */
export function projectGameProgressionCompatibility(
  state: GameState,
  progressionState: GameState['progressionState'],
): Partial<GameState> {
  const echoProgress = progressionState.echo;
  const discoveredShardIds =
    progressionState.resources.memoryShards.discoveredShardIds;

  return {
    progressionState,
    currency: progressionState.resources.coins,
    collectedMemoryFragments: discoveredShardIds,
    memoryFragmentCollectedAt:
      progressionState.resources.memoryShards.discoveredAt,
    puzzleProgress:
      progressionState.puzzles.campaignProgressByPuzzleId,
    claimedPuzzleRewards: unique(
      progressionState.puzzles.claimedRewardReceipts.map(receiptToPuzzleId),
    ),
    unlockedHintTiersByPuzzle:
      progressionState.puzzles.unlockedHintTiersByPuzzle,
    unlockedManhwaPageIds: progressionState.manhwa.unlockedPageIds,
    viewedManhwaPageIds: progressionState.manhwa.viewedPageIds,
    manhwaPageUnlockedAt: progressionState.manhwa.pageUnlockedAt,
    manhwaPageViewedAt: progressionState.manhwa.pageViewedAt,
    progression: progressionState.puzzles.journey,
    narrative: progressionState.story.narrative,
    solvedPuzzles:
      progressionState.puzzles.journey.completedPuzzleIds.length,
    echo: {
      ...state.echo,
      personality: {
        ...state.echo.personality,
        humanity: echoProgress.humanity,
        trust: echoProgress.trust,
        fear: echoProgress.fear,
        anger: echoProgress.anger,
        sadness: echoProgress.sadness,
        corruption: echoProgress.corruption,
        memoriesRecovered: echoProgress.memoriesRecovered,
      },
      trust: echoProgress.trust,
      fear: echoProgress.fear,
      memoryStability: echoProgress.memoryStability,
      corruption: echoProgress.corruption,
      hope: echoProgress.hope,
      ragePoints: echoProgress.ragePoints,
      loneliness: echoProgress.loneliness,
      awareness: echoProgress.awareness,
      isolation: echoProgress.isolation,
      forgivenessPoints: echoProgress.forgivenessPoints,
      coins: progressionState.resources.coins,
    },
    memory: {
      ...state.memory,
      fragmentsCollected: discoveredShardIds.length,
    },
    achievements: createAchievementViews(
      progressionState.achievements,
    ),
  };
}

function normalizedPositiveAmount(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : null;
}

export function createGameProgressionActions(
  set: GameStateSetter,
  get: GameStateGetter,
  now: GameTimestampProvider = () => new Date().toISOString(),
): GameProgressionActions {
  const commitTransition = (
    transition: (
      state: GameState['progressionState'],
    ) => GameProgressionTransitionResult,
  ): boolean => {
    let success = false;
    set((state) => {
      const result = transition(state.progressionState);
      success = result.success;
      return result.success
        ? projectGameProgressionCompatibility(state, result.state)
        : {};
    });
    return success;
  };

  return {
    addCoins(amount) {
      return commitTransition((state) => addCoins(state, amount));
    },

    spendCoins(amount) {
      return commitTransition((state) => spendCoins(state, amount));
    },

    canAffordCoins(amount) {
      const normalized = normalizedPositiveAmount(amount);
      return normalized !== null
        && get().progressionState.resources.coins >= normalized;
    },

    setCoins(amount) {
      return commitTransition((state) => setCoinBalance(state, amount));
    },

    grantMemoryShard(shardId, timestamp = now()) {
      return commitTransition(
        (state) => grantMemoryShard(state, shardId, timestamp),
      );
    },

    spendMemoryShards(amount) {
      return commitTransition(
        (state) => spendMemoryShards(state, amount),
      );
    },

    hasMemoryShards(amount) {
      const normalized = normalizedPositiveAmount(amount);
      return normalized !== null
        && (
          get().progressionState.resources.memoryShards.spendableBalance
          >= normalized
        );
    },

    resetMemoryShards() {
      commitTransition(resetMemoryShardProgress);
    },

    applyEchoEffects(effects) {
      const timestamp = Date.parse(now());
      return commitTransition(
        (state) => applyEchoEffects(state, effects, timestamp),
      );
    },

    applyPuzzleReward(puzzleId, reward, timestamp = now()) {
      let transaction: PuzzleRewardTransactionResult = {
        success: false,
        alreadyClaimed: false,
        receiptKey: `${puzzleId.trim()}:${reward.rewardVersion}`,
        state: get().progressionState,
        unlockedPageIds: [],
      };
      set((state) => {
        transaction = applyPuzzleRewardTransaction(
          state.progressionState,
          puzzleId,
          reward,
          timestamp,
        );
        return transaction.success
          ? projectGameProgressionCompatibility(
              state,
              transaction.state,
            )
          : {};
      });
      return transaction;
    },
  };
}
