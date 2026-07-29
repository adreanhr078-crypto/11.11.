import type {
  EchoProgressState,
  GameProgressionState,
} from './gameProgressionTypes';
import type {
  CanonicalEchoEffect,
} from './echoEventTypes';

/** @deprecated Compatibility effect contract for non-puzzle legacy sources. */
export type EchoEffect = Partial<Record<keyof EchoProgressState, number>>;

export interface PuzzleShardGrant {
  id: string;
}

/**
 * Generic unlock condition carried by an adapter.
 * Phase 1B does not import or alter authored Manhwa content.
 */
export interface PuzzlePageUnlock {
  pageId: string;
  requiredShardIds: readonly string[];
}

export interface PuzzleReward {
  rewardVersion: number;
  memoryShards?: readonly PuzzleShardGrant[];
  coins?: number;
  echoEffect?: CanonicalEchoEffect;
  storyFlags?: Readonly<Record<string, boolean>>;
  achievementProgress?: Readonly<Record<string, number>>;
  pageUnlocks?: readonly PuzzlePageUnlock[];
}

export type PuzzleRewardFailureReason =
  | 'invalid-puzzle-id'
  | 'invalid-reward-version'
  | 'invalid-timestamp'
  | 'invalid-coins'
  | 'invalid-shard'
  | 'duplicate-shard'
  | 'invalid-echo-effect'
  | 'invalid-story-flag'
  | 'invalid-achievement-progress'
  | 'unknown-achievement'
  | 'invalid-page-unlock'
  | 'reward-conflict';

export interface PuzzleRewardTransactionResult {
  success: boolean;
  alreadyClaimed: boolean;
  conflict: boolean;
  receiptKey: string;
  fingerprint: string;
  state: GameProgressionState;
  unlockedPageIds: string[];
  failureReason?: PuzzleRewardFailureReason;
}
