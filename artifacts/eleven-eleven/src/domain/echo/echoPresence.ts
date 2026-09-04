import type { GameProgressionState } from '../../core/gameProgressionTypes';
import type {
  StoryPuzzleActivity,
  StoryPuzzleEchoResonanceAxis,
  StoryPuzzleSnapshot,
} from '../story-puzzles/storyPuzzleContracts';
import {
  FINAL_MANHWA_CANON_EVENTS,
  type FinalManhwaCanonEventId,
} from '../../content/story/finalManhwaCanonEvents';
import { createStoryStateReadModel } from '../story/storyState';
import { normalizeAuthoritativeStoryState } from '../story/storyState';

export type EchoPresenceStageId =
  | 'awakening_fragile'
  | 'black_coronation'
  | 'second_contract_marked'
  | 'black_echo_protocol';

export type EchoPresenceTrigger =
  | 'login_session_start'
  | 'chapter_completed'
  | 'main_puzzle_solved'
  | 'secret_puzzle_discovered'
  | 'secret_puzzle_solved'
  | 'perfect_solve'
  | 'hint_used'
  | 'puzzle_attempt_rejected'
  | 'memory_shard_acquired'
  | 'all_chapter_shards_found'
  | 'major_canon_event'
  | 'echo_transformation'
  | 'story_completed'
  | 'all_20_shards_found'
  | 'live_challenge_completed';

export type EchoReactionRepeatPolicy =
  | 'once-per-event'
  | 'cooldown'
  | 'session';

export interface EchoReactionDefinition {
  id: string;
  trigger: EchoPresenceTrigger;
  priority: number;
  repeatPolicy: EchoReactionRepeatPolicy;
  acknowledgement: string;
  /** Canon dialogue is intentionally absent until owner-authored content exists. */
  dialogueRef: null;
  visualEffect: 'focus' | 'pulse' | 'signal' | 'transform' | 'steady';
}

/**
 * Central reaction registry. These are short system acknowledgements, not new
 * Canon dialogue. Story content is still read from server-issued receipts.
 */
export const ECHO_REACTIONS: readonly EchoReactionDefinition[] = Object.freeze([
  {
    id: 'echo-session-start',
    trigger: 'login_session_start',
    priority: 10,
    repeatPolicy: 'session',
    acknowledgement: 'SUBJECT RECONNECTED',
    dialogueRef: null,
    visualEffect: 'steady',
  },
  {
    id: 'echo-chapter-completed',
    trigger: 'chapter_completed',
    priority: 40,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'CHAPTER SYNC CONFIRMED',
    dialogueRef: null,
    visualEffect: 'pulse',
  },
  {
    id: 'echo-main-puzzle-solved',
    trigger: 'main_puzzle_solved',
    priority: 35,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'PATTERN VERIFIED',
    dialogueRef: null,
    visualEffect: 'focus',
  },
  {
    id: 'echo-secret-discovered',
    trigger: 'secret_puzzle_discovered',
    priority: 65,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'MEMORY SIGNAL DETECTED',
    dialogueRef: null,
    visualEffect: 'signal',
  },
  {
    id: 'echo-secret-solved',
    trigger: 'secret_puzzle_solved',
    priority: 75,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'MEMORY NODE STABILIZED',
    dialogueRef: null,
    visualEffect: 'signal',
  },
  {
    id: 'echo-perfect-solve',
    trigger: 'perfect_solve',
    priority: 55,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'PERFECT PATTERN VERIFIED',
    dialogueRef: null,
    visualEffect: 'focus',
  },
  {
    id: 'echo-hint-used',
    trigger: 'hint_used',
    priority: 20,
    repeatPolicy: 'cooldown',
    acknowledgement: 'ASSISTANCE CHANNEL OPEN',
    dialogueRef: null,
    visualEffect: 'steady',
  },
  {
    id: 'echo-attempt-rejected',
    trigger: 'puzzle_attempt_rejected',
    priority: 25,
    repeatPolicy: 'cooldown',
    acknowledgement: 'RECHECK THE EVIDENCE — I AM STILL HERE',
    dialogueRef: null,
    visualEffect: 'steady',
  },
  {
    id: 'echo-shard-acquired',
    trigger: 'memory_shard_acquired',
    priority: 45,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'MEMORY FRAGMENT DETECTED',
    dialogueRef: null,
    visualEffect: 'signal',
  },
  {
    id: 'echo-chapter-shards-complete',
    trigger: 'all_chapter_shards_found',
    priority: 60,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'CHAPTER MEMORY ARRAY COMPLETE',
    dialogueRef: null,
    visualEffect: 'signal',
  },
  {
    id: 'echo-major-canon-event',
    trigger: 'major_canon_event',
    priority: 80,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'CANON EVENT VERIFIED',
    dialogueRef: null,
    visualEffect: 'pulse',
  },
  {
    id: 'echo-transformation',
    trigger: 'echo_transformation',
    priority: 100,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'ECHO STATE UPDATED',
    dialogueRef: null,
    visualEffect: 'transform',
  },
  {
    id: 'echo-story-completed',
    trigger: 'story_completed',
    priority: 90,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'STORY STATE SYNCHRONIZED',
    dialogueRef: null,
    visualEffect: 'pulse',
  },
  {
    id: 'echo-all-shards-found',
    trigger: 'all_20_shards_found',
    priority: 88,
    repeatPolicy: 'once-per-event',
    acknowledgement: 'MEMORY ARRAY COMPLETE',
    dialogueRef: null,
    visualEffect: 'transform',
  },
  {
    id: 'echo-live-challenge-completed',
    trigger: 'live_challenge_completed',
    priority: 50,
    repeatPolicy: 'cooldown',
    acknowledgement: 'LIVE SIGNAL VERIFIED',
    dialogueRef: null,
    visualEffect: 'signal',
  },
] as const satisfies readonly EchoReactionDefinition[]);

export interface EchoStateDefinition {
  stageId: EchoPresenceStageId;
  form:
    | 'normal'
    | 'black-coronation'
    | 'second-contract-marked'
    | 'black-echo-protocol';
  idleVariant: 'steady' | 'watchful' | 'unstable';
  breathingSeconds: number;
  glanceAmount: number;
  redEnergy: number;
  glitchIntensity: number;
  scanIntensity: number;
  assetStatus: 'existing-safe-asset' | 'visual-slot';
}

/** Existing safe asset is intentionally reused for visual slots until owner art is supplied. */
export const ECHO_STATES: readonly EchoStateDefinition[] = Object.freeze([
  {
    stageId: 'awakening_fragile',
    form: 'normal',
    idleVariant: 'steady',
    breathingSeconds: 5.8,
    glanceAmount: 0.25,
    redEnergy: 0.08,
    glitchIntensity: 0.06,
    scanIntensity: 0.1,
    assetStatus: 'existing-safe-asset',
  },
  {
    stageId: 'black_coronation',
    form: 'black-coronation',
    idleVariant: 'watchful',
    breathingSeconds: 6.6,
    glanceAmount: 0.16,
    redEnergy: 0.46,
    glitchIntensity: 0.2,
    scanIntensity: 0.32,
    assetStatus: 'existing-safe-asset',
  },
  {
    stageId: 'second_contract_marked',
    form: 'second-contract-marked',
    idleVariant: 'watchful',
    breathingSeconds: 6.2,
    glanceAmount: 0.12,
    redEnergy: 0.68,
    glitchIntensity: 0.3,
    scanIntensity: 0.44,
    assetStatus: 'existing-safe-asset',
  },
  {
    stageId: 'black_echo_protocol',
    form: 'black-echo-protocol',
    idleVariant: 'unstable',
    breathingSeconds: 7.1,
    glanceAmount: 0.1,
    redEnergy: 0.72,
    glitchIntensity: 0.36,
    scanIntensity: 0.52,
    assetStatus: 'existing-safe-asset',
  },
] as const satisfies readonly EchoStateDefinition[]);

export interface EchoPresenceReaction {
  id: string;
  trigger: EchoPresenceTrigger;
  acknowledgement: string;
  priority: number;
  visualEffect: EchoReactionDefinition['visualEffect'];
  sourceId: string | null;
  expiresAt: number;
}

export interface EchoPresenceReadModel {
  stage: EchoStateDefinition;
  reaction: EchoPresenceReaction | null;
  memorySignals: {
    lastPuzzleWasPerfect: boolean;
    recentHintUsed: boolean;
    recentSecretFound: boolean;
    currentShardCount: number;
    puzzleResonanceTotal: number;
    dominantPuzzleResonance: StoryPuzzleEchoResonanceAxis | null;
    lastMajorCanonEvent: FinalManhwaCanonEventId | null;
  };
}

const REACTION_WINDOW_MS = 9_000;

function stageDefinition(stageId: string): EchoStateDefinition {
  return ECHO_STATES.find((candidate) => candidate.stageId === stageId)
    ?? ECHO_STATES[0]!;
}

function reactionDefinition(trigger: EchoPresenceTrigger): EchoReactionDefinition {
  return ECHO_REACTIONS.find((candidate) => candidate.trigger === trigger)
    ?? ECHO_REACTIONS[0]!;
}

function triggerForActivity(activity: StoryPuzzleActivity): EchoPresenceTrigger {
  switch (activity.kind) {
    case 'login-session-start': return 'login_session_start';
    case 'secret-puzzle-discovered': return 'secret_puzzle_discovered';
    case 'secret-puzzle-solved': return 'secret_puzzle_solved';
    case 'perfect-solve': return 'perfect_solve';
    case 'hint-used': return 'hint_used';
    case 'puzzle-attempt-rejected': return 'puzzle_attempt_rejected';
    case 'all-20-shards-found': return 'all_20_shards_found';
    case 'live-challenge-completed': return 'live_challenge_completed';
    case 'all-chapter-shards-found': return 'all_chapter_shards_found';
    case 'chapter-completed': return 'chapter_completed';
    case 'memory-shard-acquired': return 'memory_shard_acquired';
    default: return 'main_puzzle_solved';
  }
}

function createReaction(
  trigger: EchoPresenceTrigger,
  sourceId: string | null,
  occurredAt: number,
  now: number,
): EchoPresenceReaction | null {
  if (!Number.isFinite(occurredAt) || now - occurredAt > REACTION_WINDOW_MS) {
    return null;
  }
  const definition = reactionDefinition(trigger);
  return {
    id: definition.id,
    trigger,
    acknowledgement: definition.acknowledgement,
    priority: definition.priority,
    visualEffect: definition.visualEffect,
    sourceId,
    expiresAt: occurredAt + REACTION_WINDOW_MS,
  };
}

function canonReaction(
  progressionState: GameProgressionState,
  now: number,
): EchoPresenceReaction | null {
  const story = createStoryStateReadModel(progressionState);
  const receipt = normalizeAuthoritativeStoryState(
    progressionState.story.authoritative,
  ).canonEventReceipts.at(-1);
  if (!receipt) return null;
  const trigger = (
    receipt.eventId === 'manhwa_chapter_04_black_coronation'
    || receipt.eventId === 'manhwa_chapter_04_black_echo_protocol'
  ) ? 'echo_transformation' : 'major_canon_event';
  return createReaction(trigger, receipt.eventId, Date.parse(receipt.reachedAt), now);
}

function bestReaction(
  candidates: Array<EchoPresenceReaction | null>,
): EchoPresenceReaction | null {
  return candidates
    .filter((candidate): candidate is EchoPresenceReaction => candidate !== null)
    .sort((left, right) => right.priority - left.priority)[0] ?? null;
}

export function createEchoPresenceReadModel(input: {
  progressionState: GameProgressionState;
  puzzleSnapshot?: StoryPuzzleSnapshot | null;
  activity?: StoryPuzzleActivity | null;
  now?: number;
}): EchoPresenceReadModel {
  const now = input.now ?? Date.now();
  const story = createStoryStateReadModel(input.progressionState);
  const baseStage = stageDefinition(story.echoState.stageId);
  const resonance = input.puzzleSnapshot?.echoResonance;
  const resonanceTotal = resonance?.total ?? 0;
  const resonanceStrength = Math.min(1, resonanceTotal / 60);
  // Story Puzzle resonance is a verified presentation state. It can make Echo
  // appear more attentive, but it can never unlock or replace a Canon stage.
  const stage: EchoStateDefinition = {
    ...baseStage,
    glanceAmount: Math.min(0.4, baseStage.glanceAmount + resonanceStrength * 0.08),
    scanIntensity: Math.min(0.75, baseStage.scanIntensity + resonanceStrength * 0.12),
  };
  const activity = input.activity;
  const activityReaction = activity
    ? createReaction(
      triggerForActivity(activity),
      activity.puzzleId ?? activity.sourceId ?? null,
      activity.occurredAt,
      now,
    )
    : null;
  const reaction = bestReaction([activityReaction, canonReaction(input.progressionState, now)]);
  const latestEntry = input.puzzleSnapshot?.entries
    .filter((entry) => entry.completedAt)
    .sort((left, right) => Date.parse(right.completedAt!) - Date.parse(left.completedAt!))[0];
  const latestActivityIsPerfect = activity?.kind === 'perfect-solve'
    || (latestEntry?.perfectSolve === true && activity?.puzzleId === latestEntry.puzzleId);

  const dominantPuzzleResonance = resonance
    ? (Object.entries(resonance.byAxis) as Array<[StoryPuzzleEchoResonanceAxis, number]>)
      .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
    : null;

  return {
    stage,
    reaction,
    memorySignals: {
      lastPuzzleWasPerfect: latestActivityIsPerfect,
      recentHintUsed: activity?.kind === 'hint-used',
      recentSecretFound: activity?.kind === 'secret-puzzle-discovered'
        || activity?.kind === 'secret-puzzle-solved',
      currentShardCount: input.puzzleSnapshot?.shardCount ?? 0,
      puzzleResonanceTotal: resonanceTotal,
      dominantPuzzleResonance,
      lastMajorCanonEvent: story.reachedCanonEvents.at(-1) ?? null,
    },
  };
}

export function getEchoReactionDefinition(
  trigger: EchoPresenceTrigger,
): EchoReactionDefinition {
  return reactionDefinition(trigger);
}
