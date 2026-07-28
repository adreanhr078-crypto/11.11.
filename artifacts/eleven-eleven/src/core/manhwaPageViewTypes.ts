import type {
  GameProgressionState,
} from './gameProgressionTypes';
import type { EchoEffect } from './puzzleRewardTypes';

export interface ManhwaPageAuthoredEffect {
  echoEffect: EchoEffect;
  storyFlags: Record<string, boolean>;
  beliefsAdded: string[];
  questionsAdded: string[];
  knowledgeNodeIdsAdded: string[];
  dialogueTriggers: string[];
  dialogueLine?: string;
  hasAuthoredEffect: boolean;
}

export type ManhwaPageViewFailureReason =
  | 'invalid-page-id'
  | 'invalid-timestamp'
  | 'page-not-unlocked'
  | 'invalid-page-effect';

export interface ManhwaPageViewTransactionResult {
  success: boolean;
  alreadyViewed: boolean;
  effectApplied: boolean;
  effectReceiptAdded: boolean;
  state: GameProgressionState;
  failureReason?: ManhwaPageViewFailureReason;
}
