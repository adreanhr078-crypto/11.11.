import type {
  CanonicalEchoEffect,
} from './echoEventTypes';
import type {
  GameProgressionState,
} from './gameProgressionTypes';
import type {
  ProvenStoryEvent,
} from './echoEvolutionTypes';
import type {
  DialogueId,
  MemoryFragmentId,
  MemoryId,
} from '../domain/content/contracts';
import type {
  CinematicEpisodeId,
} from '../domain/cinematics/contracts';

export type NarrativeKnowledgeAudience = 'player' | 'echo';

export interface NarrativeKnowledgeGrant {
  nodeId: string;
  audience: NarrativeKnowledgeAudience;
}

export interface MemoryNarrativeSource {
  kind: 'memory';
  memoryId: MemoryId;
  fragmentId?: MemoryFragmentId;
}

export interface DialogueNarrativeSource {
  kind: 'dialogue';
  dialogueId: DialogueId;
  nodeId: string;
  choiceId: string;
}

export interface CinematicNarrativeSource {
  kind: 'cinematic';
  episodeId: CinematicEpisodeId;
  narrativeEventId: string;
}

export interface IndependentStoryNarrativeSource {
  kind: 'story';
  eventId: string;
}

export type NarrativeSourceIdentity =
  | MemoryNarrativeSource
  | DialogueNarrativeSource
  | CinematicNarrativeSource
  | IndependentStoryNarrativeSource;

export interface DialogueNarrativeTransition {
  nextNodeId: string | null;
  completed: boolean;
}

export interface NarrativeStoryEventReference {
  eventId: string;
  eventVersion: number;
}

/**
 * A fully-authored source plan. The complete plan is validated before any
 * canonical state is changed.
 */
export interface NarrativeEffectPlan {
  source: NarrativeSourceIdentity;
  eventVersion: number;
  replayPolicy: 'once' | 'repeatable';
  fingerprint: string;
  timestamp: string;
  echoEffect: CanonicalEchoEffect;
  storyFlags: Readonly<Record<string, boolean>>;
  knowledgeGrants: readonly NarrativeKnowledgeGrant[];
  dialogueTransition?: DialogueNarrativeTransition;
  storyEvent?: NarrativeStoryEventReference;
}

/**
 * Source-owned idempotency ledger. Fingerprints and timestamps are metadata
 * for the receipt key, not additional receipts. A legacy key may intentionally
 * have neither metadata entry and remains protected from replay.
 */
export interface NarrativeEventProgressState {
  claimedSourceReceiptKeys: string[];
  sourceFingerprintsByReceiptKey: Record<string, string>;
  sourceAppliedAtByReceiptKey: Record<string, string>;
  provenStoryEventsByReceiptKey: Record<string, ProvenStoryEvent>;
}

export type NarrativeEventFailureReason =
  | 'invalid-source'
  | 'invalid-event-version'
  | 'invalid-replay-policy'
  | 'invalid-fingerprint'
  | 'invalid-timestamp'
  | 'invalid-echo-effect'
  | 'invalid-story-flag'
  | 'invalid-knowledge-node'
  | 'invalid-dialogue-transition'
  | 'invalid-story-event'
  | 'story-event-not-found'
  | 'story-event-unpublished'
  | 'narrative-event-conflict'
  | 'evolution-evaluation-failed';

export interface NarrativeEventTransactionResult {
  success: boolean;
  applied: boolean;
  alreadyApplied: boolean;
  conflict: boolean;
  receiptKey: string;
  fingerprint: string;
  state: GameProgressionState;
  failureReason?: NarrativeEventFailureReason;
}
