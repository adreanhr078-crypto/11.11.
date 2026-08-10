import type {
  CampaignPuzzleProgress,
  HintTierId,
} from '../domain/puzzles/campaignContracts';
import type { ProgressionState } from '../domain/progression/progression';
import type { NarrativeState } from '../domain/narrative/narrativeState';
import type { AuthoritativeStoryState } from '../domain/story/storyState';
import type { EchoEventProgressState } from './echoEventTypes';
import type { EchoEvolutionProgressState } from './echoEvolutionTypes';
import type { NarrativeEventProgressState } from './narrativeEventTypes';

export interface MemoryShardProgressState {
  /** Spendable shard balance. Spending never removes discovery records. */
  spendableBalance: number;
  /** Permanent, unique shard discovery ledger used by content unlock rules. */
  discoveredShardIds: string[];
  discoveredAt: Record<string, string>;
  /** Lifetime number of shards spent by the player. */
  totalSpent: number;
}

export interface PlayerResourceProgressState {
  coins: number;
  memoryShards: MemoryShardProgressState;
}

export interface PuzzleProgressState {
  journey: ProgressionState;
  campaignProgressByPuzzleId: Record<string, CampaignPuzzleProgress[]>;
  claimedRewardReceipts: string[];
  /** Payload metadata for the existing receipt key; not a second receipt. */
  rewardFingerprintsByReceiptKey: Record<string, string>;
  unlockedHintTiersByPuzzle: Record<string, HintTierId[]>;
}

export interface ManhwaProgressState {
  /** Version of the active publication manifest used by this save. */
  manifestVersion: number;
  unlockedPageIds: string[];
  viewedPageIds: string[];
  pageUnlockedAt: Record<string, string>;
  pageViewedAt: Record<string, string>;
  claimedPageUnlockReceipts: string[];
  /**
   * Source-owned Page Effect receipts. Legacy saves may contain a plain
   * pageId for v1; new receipts use `pageId:effect:effectVersion`.
   */
  claimedPageEffectIds: string[];
  /** Payload metadata for versioned Page Effect receipts, not a receipt. */
  pageEffectFingerprintsByReceiptKey: Record<string, string>;
  /** Continue Reading checkpoint for the active publication. */
  lastReadPageId: string | null;
  lastReadChapterId: string | null;
  lastReadGlobalPageNumber: number | null;
  lastReadAt: string | null;
  /** Server-confirmed chapter rewards mirrored for local UX only. */
  completedChapterIds: string[];
}

export interface AchievementProgressEntry {
  current: number;
  target: number;
  unlockedAt: number | null;
}

export interface AchievementProgressState {
  byId: Record<string, AchievementProgressEntry>;
}

/**
 * Canonical Echo progression channels.
 *
 * `memoryStability` and `memoriesRecovered` intentionally represent different
 * concepts. Legacy `hope` and `ragePoints` also remain independent values;
 * migrations may use them only as documented fallbacks for missing canonical
 * fields.
 */
export interface EchoProgressState {
  humanity: number;
  trust: number;
  fear: number;
  anger: number;
  memoryStability: number;
  memoriesRecovered: number;
  corruption: number;
  /** @deprecated Independent compatibility value; never canonical humanity. */
  hope: number;
  /** @deprecated Independent compatibility value; never canonical anger. */
  ragePoints: number;
  sadness: number;
  loneliness: number;
  awareness: number;
  isolation: number;
  forgivenessPoints: number;
}

export interface StoryProgressState {
  narrative: NarrativeState;
  /** Server-backed Canon and Memory Fragment receipts for cross-device story state. */
  authoritative: AuthoritativeStoryState;
}

export interface GameProgressionState {
  schemaVersion: number;
  resources: PlayerResourceProgressState;
  puzzles: PuzzleProgressState;
  manhwa: ManhwaProgressState;
  achievements: AchievementProgressState;
  echo: EchoProgressState;
  echoEvents: EchoEventProgressState;
  narrativeEvents: NarrativeEventProgressState;
  evolution: EchoEvolutionProgressState;
  story: StoryProgressState;
}
