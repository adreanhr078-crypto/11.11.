import type {
  GameActions,
  GameState,
} from '../../core/gameTypes';
import type {
  PuzzleReward,
  PuzzleRewardTransactionResult,
} from '../../core/puzzleRewardTypes';
import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  StandaloneEchoEventResult,
} from '../../core/echoEventTypes';
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
  applyStandaloneEchoEventTransaction,
  createStandaloneEchoEventReceiptKey,
} from '../../domain/echo/echoEventReducer';
import {
  projectCanonicalEchoCompatibility,
} from '../../domain/echo/echoCompatibilityProjection';
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
  | 'applyStandaloneEchoEvent'
  | 'applyPuzzleReward'
>;

export interface PuzzleRewardCommitResult {
  progressionState: GameProgressionState;
  patch?: Partial<GameState>;
}

export type PuzzleRewardCommitFinalizer = (
  rewardedState: GameState,
  progressionState: GameProgressionState,
) => PuzzleRewardCommitResult;

export interface GameProgressionActions
  extends Omit<PublicGameProgressionActions, 'applyPuzzleReward'> {
  applyPuzzleReward: (
    puzzleId: string,
    reward: PuzzleReward,
    timestamp?: string,
    finalize?: PuzzleRewardCommitFinalizer,
  ) => PuzzleRewardTransactionResult;
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
      ...projectCanonicalEchoCompatibility(
        progressionState.echo,
        state.echo,
      ),
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

    applyStandaloneEchoEvent(event) {
      let result: StandaloneEchoEventResult = {
        success: false,
        applied: false,
        alreadyApplied: false,
        conflict: false,
        receiptKey: createStandaloneEchoEventReceiptKey(
          event.eventId,
          event.eventVersion,
        ),
      };
      set((state) => {
        const transition = applyStandaloneEchoEventTransaction(
          state.progressionState,
          event,
        );
        result = transition;
        return transition.applied
          ? projectGameProgressionCompatibility(
              state,
              transition.state,
            )
          : {};
      });
      return result;
    },

    applyPuzzleReward(
      puzzleId,
      reward,
      timestamp = now(),
      finalize,
    ) {
      let transaction: PuzzleRewardTransactionResult = {
        success: false,
        alreadyClaimed: false,
        conflict: false,
        receiptKey: `${puzzleId.trim()}:${reward.rewardVersion}`,
        fingerprint: '',
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
        if (!transaction.success) return {};
        const rewardProjection = projectGameProgressionCompatibility(
          state,
          transaction.state,
        );
        const rewardedState = {
          ...state,
          ...rewardProjection,
        };
        const completion = finalize?.(
          rewardedState,
          transaction.state,
        );
        if (!completion) return rewardProjection;
        transaction = {
          ...transaction,
          state: completion.progressionState,
        };
        return {
          ...projectGameProgressionCompatibility(
            state,
            completion.progressionState,
          ),
          ...completion.patch,
        };
      });
      return transaction;
    },
  };
}
