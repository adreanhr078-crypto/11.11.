import type {
  CanonChapterId,
  CanonLocalizedText,
} from './canonTypes';

export const INITIAL_ECHO_EVOLUTION_STAGE_ID = 'awakening_fragile';

export type EchoEvolutionStageId = string;
export type RuntimeStoryEventId = string;

export type EchoEvolutionKnowledgeBoundary =
  | 'runtime-public'
  | 'story-event-revealed';

/**
 * A player-bundle stage definition.
 *
 * Authorship belongs to internal authoring data and is deliberately not
 * represented here or in the player save. Runtime definitions describe only
 * publication-safe data.
 */
export interface EchoEvolutionStageDefinition {
  stageId: EchoEvolutionStageId;
  order: number;
  chapterId: CanonChapterId;
  requiredStoryEventId: RuntimeStoryEventId | null;
  previousStageId: EchoEvolutionStageId | null;
  visualFormId: string;
  isPermanent: boolean;
  published: boolean;
  playerVisible: boolean;
  safePlayerLabel: CanonLocalizedText;
  knowledgeBoundary: EchoEvolutionKnowledgeBoundary;
}

export interface RuntimeStoryEventDefinition {
  eventId: RuntimeStoryEventId;
  eventVersion: number;
  chapterId: CanonChapterId;
  published: boolean;
}

/**
 * Evidence already owned by a source transaction. Evolution never creates a
 * second receipt for Puzzle, Manhwa, Memory, Dialogue, or Story sources.
 */
export interface ProvenStoryEvent {
  eventId: RuntimeStoryEventId;
  eventVersion: number;
  fingerprint: string;
  timestamp: string;
}

export interface EchoEvolutionProgressState {
  currentStageId: EchoEvolutionStageId;
  reachedStageIds: EchoEvolutionStageId[];
  stageReachedAt: Record<EchoEvolutionStageId, string>;
}

export type EchoEvolutionTransitionFailureReason =
  | 'invalid-definitions'
  | 'unknown-current-stage'
  | 'current-stage-unpublished'
  | 'current-stage-permanent'
  | 'no-next-stage'
  | 'next-stage-unpublished'
  | 'missing-story-event-definition'
  | 'story-event-unpublished'
  | 'story-event-version-mismatch'
  | 'story-event-not-proven'
  | 'invalid-story-event-proof'
  | 'stage-already-reached';

export interface EchoEvolutionTransitionPlan {
  fromStageId: EchoEvolutionStageId;
  toStageId: EchoEvolutionStageId;
  requiredStoryEventId: RuntimeStoryEventId;
  reachedAt: string;
  nextProgress: EchoEvolutionProgressState;
}

export interface EchoEvolutionEvaluationResult {
  success: boolean;
  transitionAvailable: boolean;
  progress: EchoEvolutionProgressState;
  plan: EchoEvolutionTransitionPlan | null;
  failureReason?: EchoEvolutionTransitionFailureReason;
}
