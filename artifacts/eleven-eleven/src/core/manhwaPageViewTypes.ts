import type {
  GameProgressionState,
} from './gameProgressionTypes';
import type { CanonicalEchoEffect } from './echoEventTypes';

export const MANHWA_PAGE_EFFECT_VERSION = 1;
export const MANHWA_PAGE_EFFECT_FINGERPRINT_PATTERN =
  /^manhwa-page-v1-[0-9a-f]{8}$/;

export interface ManhwaPageAuthoredEffect {
  effectVersion: number;
  echoEffect: CanonicalEchoEffect;
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
  | 'unreleased-page'
  | 'invalid-timestamp'
  | 'page-not-unlocked'
  | 'invalid-page-effect'
  | 'page-effect-conflict';

export interface ManhwaPageViewTransactionResult {
  success: boolean;
  alreadyViewed: boolean;
  effectApplied: boolean;
  effectReceiptAdded: boolean;
  conflict: boolean;
  receiptKey: string;
  fingerprint: string;
  state: GameProgressionState;
  failureReason?: ManhwaPageViewFailureReason;
}

export function createManhwaPageEffectReceiptKey(
  pageId: string,
  effectVersion: number = MANHWA_PAGE_EFFECT_VERSION,
): string {
  return `${pageId.trim()}:effect:${effectVersion}`;
}

export function getManhwaPageEffectReceiptPageId(
  receiptKey: string,
): string | null {
  const match = /^(.+):effect:([1-9]\d*)$/.exec(receiptKey.trim());
  return match?.[1]?.trim() || null;
}

export function isLegacyManhwaPageEffectReceipt(
  receipt: string,
  pageId: string,
  effectVersion: number,
): boolean {
  return (
    effectVersion === MANHWA_PAGE_EFFECT_VERSION
    && receipt.trim() === pageId.trim()
  );
}
