/**
 * gameTypes.ts — shared type definitions used by gameStore and core modules
 * Updated v4.0: Now includes new puzzle system, Echo transformation, and story arcs
 */

import type { MemoryShard } from './memoryShardsTypes';
import type { EchoTransformationStage, StoryPhase, PuzzleEffects } from './puzzleTypes';

// ─── Basic Types ─────────────────────────────────────────────────────
export type TimePhase = 'morning' | 'day' | 'evening' | '11:00' | '11:05' | '11:11';
export type EntityId = 'echo' | 'watcher' | 'signal' | 'architect';
export type PuzzleStatus = 'locked' | 'active' | 'solved' | 'failed';
export type FlowerStage = 'seed' | 'sprout' | 'bloom' | 'flourish' | 'completed' | 'corrupted';
export type Ending = 'sorrow' | 'truth' | 'dark' | 'mystery';
export type EchoMood = 'خائف' | 'متردد' | 'واثق' | 'متذكر' | 'مشوش' | 'مذعور' | 'هادئ' | 'متفائل';
export type WishStatus = 'active' | 'completed' | 'failed';

// ─── State Interfaces ────────────────────────────────────────────────
export interface EchoState {
  trust: number; fear: number; memoryStability: number; corruption: number;
  hope: number; loneliness: number; awareness: number; isolation: number;
  mood: EchoMood; personalityTraits: string[];
  lastDialogue: string; dialogueHistory: string[];
  level: number; xp: number; xpMax: number;
  
  // New: Echo transformation system
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
  id: string; entity: EntityId; title: string;
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
}

export interface EntityState {
  id: EntityId; name: string; glyph: string;
  unlocked: boolean; completed: boolean;
  puzzlesSolved: number; totalPuzzles: number;
  dialogueProgress: number; loreUnlocked: string[];
  emotionalState: number;
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

export interface GameState {
  echo: EchoState; time: TimeState; flower: FlowerState;
  memory: MemoryState; puzzles: PuzzleNode[];
  totalPuzzles: number; solvedPuzzles: number;
  entities: Record<EntityId, EntityState>; currentEntity: EntityId;
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
  actions: {
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
    // New action for transformation
    updateTransformation?: (type: 'rage' | 'forgiveness', amount: number) => void;
  };
}