/**
 * gameTypes.ts — shared type definitions used by gameStore and core modules
 * Updated v5.0: Added currency system, daily missions, and shop system
 */

import type { MemoryShard } from './memoryShardsTypes';
import type { GameProgressionState } from './gameProgressionTypes';
import type {
  PuzzleReward,
  PuzzleRewardTransactionResult,
} from './puzzleRewardTypes';
import type {
  CanonicalEchoEffect,
  StandaloneEchoEvent,
  StandaloneEchoEventResult,
} from './echoEventTypes';
import type {
  ManhwaUnlockTransactionResult,
} from './manhwaArchiveTypes';
import type {
  ManhwaPageViewTransactionResult,
} from './manhwaPageViewTypes';
import type { EchoTransformationStage, StoryPhase, PuzzleEffects } from './puzzleTypes';
import type { ChapterId, ChapterState } from './chapterSystem';
import type { EchoPersonality } from '../domain/echo/echoPersonality';
import type { ProgressionState } from '../domain/progression/progression';
import type { NarrativeState } from '../domain/narrative/narrativeState';
import type { DialogueId } from '../domain/content/contracts';
import type {
  CinematicEpisodeId,
} from '../domain/cinematics/contracts';
import type {
  CinematicPreferences,
  CinematicState,
} from '../domain/cinematics/cinematicState';
import type {
  CampaignCompletionResult,
  CampaignPuzzleProgress,
  HintPurchaseResult,
  HintTierId,
  PuzzleRewardEvent,
} from '../domain/puzzles/campaignContracts';
import type {
  AwakeningWardSaveState,
} from '../features/awakening-ward/domain/awakeningWardTypes';
export { type ChapterId, type ChapterState } from './chapterSystem';

// ─── Basic Types ─────────────────────────────────────────────────────
export type TimePhase = 'morning' | 'day' | 'evening' | '11:00' | '11:05' | '11:11';
export type PuzzleStatus = 'locked' | 'active' | 'solved' | 'failed' | 'skipped';
export type FlowerStage = 'seed' | 'sprout' | 'bloom' | 'flourish' | 'completed' | 'corrupted';
export type Ending = 'sorrow' | 'truth' | 'dark' | 'mystery';
export type EchoMood = 'خائف' | 'متردد' | 'واثق' | 'متذكر' | 'مشوش' | 'مذعور' | 'هادئ' | 'متفائل';
export type WishStatus = 'active' | 'completed' | 'failed';
export type MissionType = 'story' | 'quick' | 'cipher' | 'reflection' | 'challenge';
export type EntityId = 'echo' | 'watcher' | 'signal' | 'architect';

export interface LegacyEntityProgress {
  unlocked: boolean;
  puzzlesSolved: number;
  emotionalState: number;
  storyFragments: string[];
}

// ─── Daily Mission Types ────────────────────────────────────────────
export interface DailyMission {
  id: string;
  type: MissionType;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  puzzleId: string;
  reward: { coins: number; crystals: number; shardId?: string };
  expiresAt: number;
  completed: boolean;
}

export interface CoinShopPrices {
  hintPrice: number;
  skipPrice: number;
  rerollPrice: number;
  extraHintPrice: number;
  rareShardPrice: number;
}

// ─── State Interfaces ────────────────────────────────────────────────
export interface EchoState {
  /** Canonical personality model. Legacy scalar fields remain as UI aliases. */
  personality: EchoPersonality;
  trust: number; fear: number; memoryStability: number; corruption: number;
  hope: number; loneliness: number; awareness: number; isolation: number;
  mood: EchoMood; personalityTraits: string[];
  lastDialogue: string; dialogueHistory: string[];
  level: number; xp: number; xpMax: number;
  
  // Currency system
  coins: number;
  crystals: number;
  usedHints: string[];        // puzzle IDs where hints were used
  skippedPuzzles: string[];   // puzzle IDs that were skipped
  rerolledPuzzles: string[];  // puzzle IDs that were rerolled
  
  /** @deprecated Compatibility view only; Phase 3C will own evolution. */
  transformationStage: EchoTransformationStage;
  ragePoints: number;
  forgivenessPoints: number;
  xpMultiplier?: number;
}

export interface TimeState {
  phase: TimePhase; phaseIndex: number; isNight: boolean;
  hour: number; minute: number; dayCycle: number;
}

export interface PuzzleNode {
  id: string; chapterId: ChapterId; title: string;
  question: string; answers: string[]; hint: string;
  status: PuzzleStatus; difficulty: number;
  storyReveal: string; memoryUnlock: string | null;
  dependencies: string[];
  effects: PuzzleEffects;
  // New fields
  act?: number;
  phase?: StoryPhase;
  hints?: string[];
  puzzleType?: string;
  puzzleCategory?: ChapterId; // Category for this puzzle
  coins?: number;             // Coins rewarded for solving
}

export interface FlowerState {
  stage: FlowerStage; growth: number; decay: number;
  hiddenUnlocked: boolean; maxStage: number;
}

export interface WishNode {
  id: string; text: string; progress: number;
  status: WishStatus; createdAt: string;
  storyImpact: number; // 0-100, affects ending
}

export interface MemoryState {
  fragmentsCollected: number; totalFragments: number;
  corruptedFragments: number;
  timelineEvents: TimelineEvent[]; logsUnlocked: string[];
}

export interface TimelineEvent {
  id: string; time: string; phase: TimePhase;
  description: string; type: 'memory' | 'puzzle' | 'chat' | 'night' | 'achievement' | 'ending';
}

export interface Achievement {
  id: string; name: string; desc: string; icon: string;
  unlocked: boolean; unlockedAt: number | null;
}

export interface EndingState {
  sorrow: { unlocked: boolean; progress: number; };
  truth: { unlocked: boolean; progress: number; };
  dark: { unlocked: boolean; progress: number; };
  mystery: { unlocked: boolean; progress: number; };
  // New endings
  vengeance?: { unlocked: boolean; progress: number; };
  redemption?: { unlocked: boolean; progress: number; };
}

export interface GameActions {
  addCoins: (amount: number) => boolean;
  spendCoins: (amount: number) => boolean;
  canAffordCoins: (amount: number) => boolean;
  setCoins: (amount: number) => boolean;
  grantMemoryShard: (shardId: string, timestamp?: string) => boolean;
  spendMemoryShards: (amount: number) => boolean;
  hasMemoryShards: (amount: number) => boolean;
  applyEchoEffects: (effects: CanonicalEchoEffect) => boolean;
  applyStandaloneEchoEvent: (
    event: StandaloneEchoEvent,
  ) => StandaloneEchoEventResult;
  applyPuzzleReward: (
    puzzleId: string,
    reward: PuzzleReward,
    timestamp?: string,
  ) => PuzzleRewardTransactionResult;
  unlockManhwaPage: (
    pageId: string,
    timestamp?: string,
  ) => ManhwaUnlockTransactionResult;
  viewManhwaPage: (
    pageId: string,
    timestamp?: string,
  ) => ManhwaPageViewTransactionResult;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
  setCurrency: (amount: number) => void;
  collectMemoryFragment: (fragmentId: string) => boolean;
  hasMemoryFragment: (fragmentId: string) => boolean;
  resetMemoryFragments: () => void;
  saveCampaignPuzzleProgress: (
    puzzleId: string,
    progress: CampaignPuzzleProgress[],
  ) => void;
  completeCampaignPuzzle: (
    puzzleId: string,
    progress: CampaignPuzzleProgress[],
  ) => CampaignCompletionResult;
  purchaseCampaignHint: (
    puzzleId: string,
    tierId: HintTierId,
  ) => HintPurchaseResult;
  markManhwaPageViewed: (pageId: string) => void;
  clearPuzzleRewardEvent: () => void;
  chat: () => { dialogue: string; effects: Partial<EchoState>; };
  solve: (puzzleId: string, answer: string) => { success: boolean; message: string; achievement?: Achievement; };
  advanceTime: () => void;
  addWish: (text: string) => void;
  completeWish: (wishId: string) => void;
  checkEndings: () => void;
  makeFinalChoice: (choice: string) => void;
  resetGame: () => void;
  replayEnding: (endingId: string) => void;
  incrementTrust: (amount?: number) => void;
  decrementTrust: (amount?: number) => void;
  incrementFear: (amount?: number) => void;
  decrementFear: (amount?: number) => void;
  incrementCuriosity: (amount?: number) => void;
  setLevel: (level: number) => void;
  /** @deprecated Phase 3B blocks legacy transformation metric writes. */
  updateTransformation?: (type: 'rage' | 'forgiveness', amount: number) => void;
  buyHint: (puzzleId: string) => { success: boolean; message: string; hint?: string };
  skipPuzzle: (puzzleId: string) => { success: boolean; message: string };
  rerollPuzzle: (puzzleId: string) => { success: boolean; message: string; newPuzzleId?: string };
  completeDailyMission: (missionId: string) => {
    success: boolean;
    message: string;
    reward?: { coins: number; crystals: number; shardId?: string };
  };
  refreshDailyMissions: () => void;
  setNarrativeFlag: (flag: string, value: boolean) => void;
  recordNarrativeDecision: (
    decisionId: string,
    choiceId: string,
    source?: 'dialogue' | 'puzzle' | 'system' | 'ending',
  ) => void;
  unlockEligibleMemories: () => {
    unlockedMemoryIds: string[];
    unlockedFragmentIds: string[];
  };
  startDialogueGraph: (dialogueId: DialogueId) => void;
  chooseDialogueOption: (choiceId: string) => void;
  evaluateNarrativeEndings: () => string[];
  startCinematicEpisode: (episodeId: CinematicEpisodeId) => void;
  completeCinematicScene: () => void;
  chooseCinematicChoice: (choiceId: string) => void;
  pauseCinematic: () => void;
  resumeCinematic: () => void;
  stopCinematic: () => void;
  setCinematicPreferences: (
    preferences: Partial<CinematicPreferences>,
  ) => void;
}

export interface GameState {
  /** Canonical, versioned source of truth for durable player progression. */
  progressionState: GameProgressionState;
  /** Player currency used by the new UI-driven content layer. */
  currency: number;
  /** Canonical IDs collected by the player; the UI count derives from this list. */
  collectedMemoryFragments: string[];
  memoryFragmentCollectedAt: Record<string, string>;
  puzzleProgress: Record<string, CampaignPuzzleProgress[]>;
  claimedPuzzleRewards: string[];
  unlockedHintTiersByPuzzle: Record<string, HintTierId[]>;
  integratedMemoryFragmentIds: string[];
  unlockedManhwaPageIds: string[];
  viewedManhwaPageIds: string[];
  manhwaPageUnlockedAt: Record<string, string>;
  manhwaPageViewedAt: Record<string, string>;
  consumedDialogueTriggerIds: string[];
  lastAvailablePuzzleId: string;
  lastPuzzleReward: PuzzleRewardEvent | null;
  echo: EchoState; time: TimeState; flower: FlowerState;
  memory: MemoryState; puzzles: PuzzleNode[];
  totalPuzzles: number; solvedPuzzles: number;
  /** Canonical progression state. Legacy counters are derived compatibility fields. */
  progression: ProgressionState;
  /** Canonical narrative gameplay state for memories, decisions, dialogue, and endings. */
  narrative: NarrativeState;
  /** Persisted cinematic checkpoint; frame-by-frame playback stays in the player. */
  cinematic: CinematicState;
  /** Durable, account-synced progress for the isolated 2.5D ward slice. */
  awakeningWard: AwakeningWardSaveState;
  chapters: Record<ChapterId, ChapterState>; currentChapter: ChapterId;
  /** @deprecated Compatibility only; not a progression source of truth. */
  entities: Record<EntityId, LegacyEntityProgress>;
  wishes: WishNode[];
  player: { curiosity: number; interactions: number; choices: string[]; };
  world: { stability: number; glitchLevel: number; corruptionLevel: number; anomalyCount: number; };
  achievements: Achievement[];
  endings: EndingState;
  narrativeTriggers: Record<string, boolean>;
  finalChoice: string | null;
  unlockedEndings: string[];
  seenEndings: string[];
  achievedEnding: string | null;
  lastEndingViewed: string | null;
  allMemoryShards: MemoryShard[];
  
  // Daily missions
  dailyMissions: DailyMission[];
  lastMissionRefresh: number;
  shopPrices: CoinShopPrices;
  
  actions: GameActions;
}
